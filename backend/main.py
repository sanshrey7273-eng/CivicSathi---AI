import os
import re
import random
import datetime
import uuid
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from dotenv import load_dotenv
import google.generativeai as genai
from fastapi.responses import FileResponse
from reportlab.pdfgen import canvas
import tempfile
import io
import httpx
from supabase import create_client, Client

load_dotenv()

app = FastAPI(title="Nagrik Mitra AI API", version="1.0.0")

# CORS Configuration
allowed_env = os.environ.get("ALLOWED_ORIGINS", "")
env_origins = [o.strip() for o in allowed_env.split(",") if o.strip()]

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    *env_origins
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if env_origins else ["*"],
    allow_origin_regex=r"https:\/\/.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gemini Configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
gemini_configured = False
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        # Check if the key is valid by initializing the model, actual test happens on use
        gemini_configured = True
    except Exception as e:
        print(f"Gemini configuration error: {e}")

# Supabase Configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY") or os.environ.get("SUPABASE_ANON_KEY")
supabase: Optional[Client] = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"Supabase init error: {e}")

# In-memory mock DB (fallback if Supabase is unavailable)
db_complaints = {}

def validate_indian_mobile(phone: Optional[str]) -> Optional[str]:
    """
    Validates and normalizes Indian 10-digit mobile phone numbers:
    - Treats +91 / 91 country code and 0 trunk prefix as separate prefixes and extracts only the 10-digit number.
    - Trims whitespace.
    - Requires exactly 10 numeric digits.
    - Rejects letters and non-numeric characters.
    - Validates that the first digit is 6, 7, 8, or 9.
    """
    if phone is None:
        return None
    raw = str(phone).strip()
    if not raw:
        return None

    # Reject any alphabetic letters
    if re.search(r'[a-zA-Z]', raw):
        raise ValueError("Mobile number must not contain letters.")

    # Remove formatting characters (spaces, hyphens, parentheses, dots)
    cleaned = re.sub(r'[\s\-\(\)\.]', '', raw)

    # Separate country code (+91, +)
    if cleaned.startswith('+91'):
        cleaned = cleaned[3:]
    elif cleaned.startswith('+'):
        cleaned = cleaned[1:]

    # Separate 91 prefix if full 12 digits
    if len(cleaned) > 10 and cleaned.startswith('91'):
        cleaned = cleaned[2:]
    # Separate trunk 0 if 11 digits
    elif len(cleaned) > 10 and cleaned.startswith('0'):
        cleaned = cleaned[1:]

    # Must contain only digits
    if not cleaned.isdigit():
        raise ValueError("Mobile number must contain only numeric digits.")

    # Must be exactly 10 digits
    if len(cleaned) != 10:
        raise ValueError(f"Mobile number must contain exactly 10 digits (got {len(cleaned)}).")

    # First digit must be 6, 7, 8, or 9
    if not re.match(r'^[6-9]\d{9}$', cleaned):
        raise ValueError("Invalid Indian mobile number. First digit must be 6, 7, 8, or 9.")

    return cleaned

# --- Models ---
class ClassifyRequest(BaseModel):
    text: str
    lang: str = "en"

class PhoneValidateRequest(BaseModel):
    phone: str

class ComplaintCreate(BaseModel):
    category: str
    department_key: str
    department_name: str
    summary_en: str
    summary_local: str
    lat: float
    lng: float
    address: str
    ward_id: int
    ward_name: str
    image_url: Optional[str] = None
    voice_url: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_name: Optional[str] = None
    citizen_phone: Optional[str] = None
    citizen_name: Optional[str] = None
    lang: Optional[str] = "en"
    transcript: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = "submitted"
    created_at: Optional[str] = None
    documents: Optional[List[str]] = None
    is_anonymous: bool = True

    @field_validator("contact_phone", "citizen_phone", mode="before")
    @classmethod
    def validate_phone(cls, v):
        return validate_indian_mobile(v)

class ResolveGeoRequest(BaseModel):
    lat: float
    lng: float

# --- Endpoints ---

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.datetime.now().isoformat()}

@app.post("/api/validate/phone")
def validate_phone_endpoint(req: PhoneValidateRequest):
    try:
        normalized = validate_indian_mobile(req.phone)
        return {"valid": True, "normalized": normalized}
    except ValueError as e:
        return {"valid": False, "error": str(e)}

@app.get("/api/integrations/status")
def integration_status():
    return {
        "gemini": gemini_configured,
        "supabase": bool(os.environ.get("SUPABASE_URL")),
    }

CIVIC_CATEGORY_METADATA = {
    "pothole": {
        "department_key": "pmc_road",
        "department_name": {
            "mr": "पुणे मनपा पथ व रस्ता देखभाल विभाग",
            "hi": "पुणे नगर निगम सड़क रखरखाव विभाग",
            "en": "PMC Road Maintenance Department"
        },
        "reason": {
            "mr": "शहरातील सार्वजनिक रस्त्यांवरील खड्डे बुजवणे, डांबरीकरण आणि रस्त्यांची सुरक्षा राखणे ही जबाबदारी मनपा पथ विभागाकडे असते.",
            "hi": "शहर की सड़कों के गड्ढे भरने, डामरीकरण और सड़क सुरक्षा की जिम्मेदारी नगर निगम सड़क विभाग के पास है।",
            "en": "Maintenance of city roads, asphalt repairs, and pothole filling are managed by the PMC Road Maintenance Department."
        },
        "required_documents": {
            "mr": ["अचूक रस्त्याचे ठिकाण व पत्ता (Exact Location)", "जवळची खूण / लँडमार्क (Nearby Landmark)"],
            "hi": ["सटीक सड़क का स्थान और पता (Exact Location)", "नजदीकी लैंडमार्क (Nearby Landmark)"],
            "en": ["Exact road location and address", "Nearby landmark / intersection"]
        },
        "optional_documents": {
            "mr": ["खड्ड्याचे स्पष्ट छायाचित्र (Road Photo - ऐच्छिक)", "अपघाताचा धोका / तीव्रता तपशील (Optional)"],
            "hi": ["गड्ढे का स्पष्ट फोटो (Photo - वैकल्पिक)", "दुर्घटना जोखिम विवरण (Optional)"],
            "en": ["Clear photo of pothole (Helpful/Optional)", "Severity / hazard details (Optional)"]
        },
        "next_steps": {
            "mr": ["तक्रार अधिकृत अर्ज स्वरूपात सबमिट करा", "क्षेत्रीय कनिष्ठ अभियंता ४८ तासांत प्रत्यक्ष पाहणी करेल", "दुरुस्ती अहवाल एसएमएस किंवा ऑनलाइन ट्रॅक करा"],
            "hi": ["शिकायत दर्ज कर संदर्भ संख्या प्राप्त करें", "क्षेत्रीय अभियंता ४८ घंटे में निरीक्षण करेगा", "मरम्मत स्थिति ऑनलाइन ट्रैक करें"],
            "en": ["Submit complaint and receive tracking reference", "Junior Engineer will inspect site within 48 hours", "Track repair progress online or via reference number"]
        },
        "priority": "high",
        "severity": "high",
        "confidence": 0.95
    },
    "garbage": {
        "department_key": "pmc_swm",
        "department_name": {
            "mr": "पुणे मनपा घनकचरा व्यवस्थापन विभाग",
            "hi": "पुणे नगर निगम ठोस अपशिष्ट प्रबंधन विभाग",
            "en": "PMC Solid Waste Management Department"
        },
        "reason": {
            "mr": "रस्त्यावरील साचलेला कचरा उचलणे, कचराकुंड्या रिकाम्या करणे व सार्वजनिक स्वच्छता राखणे हे घनकचरा विभागाचे कार्य आहे.",
            "hi": "सड़क पर जमा कचरे का उठाव, कचरा पात्र खाली करना और स्वच्छता बनाए रखना ठोस अपशिष्ट प्रबंधन विभाग का कार्य है।",
            "en": "Clearing waste accumulation, emptying municipal bins, and public sanitation are handled by the Solid Waste Dept."
        },
        "required_documents": {
            "mr": ["कचरा साचलेल्या जागेचा अचूक पत्ता (Location)", "परिसराचे नाव व जवळची खूण (Landmark)"],
            "hi": ["कचरा जमा होने का सटीक स्थान (Location)", "क्षेत्र का नाम व नजदीकी लैंडमार्क (Landmark)"],
            "en": ["Accurate address of waste accumulation", "Area landmark for sanitary truck access"]
        },
        "optional_documents": {
            "mr": ["साचलेल्या कचऱ्याचा फोटो (Garbage Photo - ऐच्छिक)", "किती दिवसांपासून कचरा साचला आहे याचा तपशील (Optional)"],
            "hi": ["कचरे के ढेर का फोटो (Photo - वैकल्पिक)", "कितने दिनों से कचरा है इसका विवरण (Optional)"],
            "en": ["Photo of garbage accumulation (Helpful/Optional)", "Days uncleared details (Optional)"]
        },
        "next_steps": {
            "mr": ["तक्रार सबमिट करा व पावती क्रमांक मिळवा", "आरोग्य निरीक्षक (Sanitary Inspector) २४ तासांत गाडी पाठवून कचरा उचलेल", "स्वच्छतेची खात्री करून तक्रार बंद केली जाईल"],
            "hi": ["शिकायत दर्ज कर पावती प्राप्त करें", "सफाई निरीक्षक २४ घंटे में कचरा गाड़ी भेजेगा", "सफाई सत्यापन के बाद शिकायत बंद होगी"],
            "en": ["Submit complaint and retain reference number", "Sanitary inspector dispatches collection vehicle within 24 hours", "Closed after sanitation verification"]
        },
        "priority": "high",
        "severity": "high",
        "confidence": 0.96
    },
    "water": {
        "department_key": "water_supply",
        "department_name": {
            "mr": "पुणे मनपा पाणी पुरवठा विभाग",
            "hi": "पुणे नगर निगम जल आपूर्ति विभाग",
            "en": "PMC Water Supply Department"
        },
        "reason": {
            "mr": "मुख्य जलवाहिनी गळती, कमी दाबाने पाणीपुरवठा किंवा दूषित पाण्याचे निवारण पाणी पुरवठा विभागामार्फत केले जाते.",
            "hi": "जलवाहिनी लीकेज, कम दबाव से पानी आना अथवा दूषित पेयजल समस्या का समाधान जल आपूर्ति विभाग करता है।",
            "en": "Pipeline leaks, low water pressure, contaminated water, or supply disruptions fall under the Water Supply Dept."
        },
        "required_documents": {
            "mr": ["बाधित परिसराचा अचूक पत्ता (Location)", "समस्येचे स्वरूप (कमी दाब / दूषित पाणी / गळती)"],
            "hi": ["प्रभावित क्षेत्र का सटीक पता (Location)", "समस्या का प्रकार (कम दबाव / लीकेज / गंदा पानी)"],
            "en": ["Affected street or building address", "Nature of issue (Leakage / Low Pressure / Contamination)"]
        },
        "optional_documents": {
            "mr": ["पाईपलाईन गळतीचा फोटो (Photo - ऐच्छिक)", "पाणी येण्याची वेळ / वारंवारता तपशील (Optional)"],
            "hi": ["पाइप लीकेज का फोटो (वैकल्पिक)", "जल आपूर्ति समय विवरण (Optional)"],
            "en": ["Photo of pipeline leak or murky water (Helpful/Optional)", "Supply timing details (Optional)"]
        },
        "next_steps": {
            "mr": ["तक्रार नोंदवून जल अभियंता कार्यालयाकडे पाठवली जाईल", "लाईनमन किंवा दुरुस्ती पथक २४ ते ४८ तासांत गळती दुरुस्त करेल", "नियमित पाणीपुरवठा पूर्ववत केला जाईल"],
            "hi": ["शिकायत जल अभियंता कार्यालय को प्रेषित होगी", "मरम्मत दल २४ से ४८ घंटे में लीकेज ठीक करेगा", "सामान्य जल आपूर्ति बहाल की जाएगी"],
            "en": ["Complaint forwarded to Zonal Water Engineer", "Maintenance crew dispatched within 24-48 hours", "Supply pressure restored"]
        },
        "priority": "high",
        "severity": "high",
        "confidence": 0.93
    },
    "streetlight": {
        "department_key": "electrical_dept",
        "department_name": {
            "mr": "पुणे मनपा विद्युत व पथदिवे विभाग",
            "hi": "पुणे नगर निगम विद्युत एवं स्ट्रीटलाइट विभाग",
            "en": "PMC Electrical & Streetlight Department"
        },
        "reason": {
            "mr": "बंद पथदिवे दुरुस्त करणे, खराब झालेले दिवे बदलणे व विद्युत खांबांची सुरक्षा राखणे ही विद्युत विभागाची जबाबदारी आहे.",
            "hi": "बंद स्ट्रीटलाइट ठीक करना, बल्ब बदलना तथा बिजली खंभों की सुरक्षा बनाए रखना विद्युत विभाग का कार्य है।",
            "en": "Non-functional streetlights, faulty fixtures, broken poles, and wiring safety are maintained by Electrical Dept."
        },
        "required_documents": {
            "mr": ["रस्त्याचे नाव व जवळचा विजेचा खांब क्रमांक / खूण (Pole / Landmark)", "परिसराचा पत्ता (Location)"],
            "hi": ["सड़क का नाम व नजदीकी खंभा नंबर / लैंडमार्क (Pole / Landmark)", "स्थान का पता (Location)"],
            "en": ["Street name & nearby lamp pole number or landmark", "Area address"]
        },
        "optional_documents": {
            "mr": ["बंद दिव्याचा किंवा खांबाचा फोटो (Photo - ऐच्छिक)"],
            "hi": ["बंद स्ट्रीटलाइट का फोटो (वैकल्पिक)"],
            "en": ["Photo of dark street or damaged pole (Helpful/Optional)"]
        },
        "next_steps": {
            "mr": ["तक्रार संबंधित क्षेत्रीय विद्युत मक्तेदाराकडे वर्ग केली जाईल", "४८ ते ७२ तासांत दिवा बदलून किंवा दुरुस्त करून चालू केला जाईल"],
            "hi": ["शिकायत क्षेत्रीय विद्युत ठेकेदार को भेजी जाएगी", "४८ से ७२ घंटे में लाइट मरम्मत कर चालू की जाएगी"],
            "en": ["Dispatched to electrical maintenance contractor", "Bulb or circuit replaced within 48-72 hours"]
        },
        "priority": "medium",
        "severity": "medium",
        "confidence": 0.92
    },
    "drainage": {
        "department_key": "pmc_drainage",
        "department_name": {
            "mr": "पुणे मनपा मलनिस्सारण व ड्रेनेज विभाग",
            "hi": "पुणे नगर निगम जल निकासी एवं सीवेज विभाग",
            "en": "PMC Drainage & Sewage Department"
        },
        "reason": {
            "mr": "तुंबलेली गटारे, चेंबरमधून बाहेर पडणारे सांडपाणी व पावसाळी वाहिन्यांची सफाई ड्रेनेज विभागाकडून केली जाते.",
            "hi": "चोक हुई नालियां, सीवेज चेंबर का ओवरफ्लो और गंदे पानी की निकासी ड्रेनेज विभाग द्वारा संभाली जाती है।",
            "en": "Clogged stormwater drains, overflowing manholes, and blocked sewer lines are cleared by Drainage Department."
        },
        "required_documents": {
            "mr": ["तुंबलेल्या गटाराचे / चेंबरचे अचूक ठिकाण (Location)", "जवळची खूण (Landmark)"],
            "hi": ["ओवरफ्लो चेंबर का सटीक स्थान (Location)", "नजदीकी लैंडमार्क"],
            "en": ["Location of overflowing manhole or choked drain", "Nearby landmark"]
        },
        "optional_documents": {
            "mr": ["तुंबलेल्या सांडपाण्याचा फोटो (Photo - ऐच्छिक)", "रोगराईचा धोका / दुर्गंधी तपशील (Optional)"],
            "hi": ["नाली / चेंबर ओवरफ्लो का फोटो (वैकल्पिक)", "दुर्गंध या जोखिम विवरण (Optional)"],
            "en": ["Photo of sewage overflow (Helpful/Optional)", "Waterlogging risk note (Optional)"]
        },
        "next_steps": {
            "mr": ["ड्रेनेज जेटिंग मशीन व सफाई पथक २४ तासांत रवाना केले जाईल", "चेंबर साफ करून पाण्याचा निचरा मोकळा केला जाईल"],
            "hi": ["जेटिंग मशीन व सफाई दल २४ घंटे में भेजा जाएगा", "चेंबर साफ कर पानी की निकासी शुरू की जाएगी"],
            "en": ["Jetting machine unit dispatched within 24 hours", "Chamber desilted and drainage flow restored"]
        },
        "priority": "high",
        "severity": "high",
        "confidence": 0.95
    },
    "ration_card": {
        "department_key": "food_civil_supplies",
        "department_name": {
            "mr": "अन्न व नागरी पुरवठा व शिधापत्रिका कार्यालय",
            "hi": "खाद्य एवं नागरिक आपूर्ति कार्यालय (राशन कार्ड)",
            "en": "Food & Civil Supplies / Rationing Office"
        },
        "reason": {
            "mr": "रेशन कार्ड दुरुस्ती, नवीन नाव समाविष्ट करणे किंवा धान्य वाटप तक्रारींचे निवारण नागरी पुरवठा कार्यालयामार्फत होते.",
            "hi": "राशन कार्ड में सुधार, नए सदस्य का नाम जोड़ना अथवा अनाज वितरण शिकायतों का समाधान खाद्य आपूर्ति विभाग करता है।",
            "en": "Ration card corrections, member additions, and public distribution subsidies are processed by Food & Civil Supplies."
        },
        "required_documents": {
            "mr": ["विद्यमान रेशन कार्ड क्रमांक (Ration Card Number)", "अर्जदाराचा ओळखीचा पुरावा (Identity Proof)"],
            "hi": ["मौजूदा राशन कार्ड नंबर (Ration Card Number)", "आवेदक का पहचान प्रमाण (Identity Proof)"],
            "en": ["Existing ration card number", "Identity proof of applicant"]
        },
        "optional_documents": {
            "mr": ["नाव जोडण्यासाठी जन्म/विवाह दाखला (Only if member addition)", "पासपोर्ट आकाराचे छायाचित्र (Photo)"],
            "hi": ["नाम जोड़ने हेतु जन्म/विवाह प्रमाण पत्र (यदि सदस्य जोड़ना हो)", "पासपोर्ट साइज फोटो"],
            "en": ["Birth/Marriage certificate (only if adding a member)", "Passport size photograph"]
        },
        "next_steps": {
            "mr": ["नागरिक मित्र द्वारे अधिकृत विनंती अर्ज मसुदा तयार करा", "मूळ कागदपत्रांसह विभागीय पुरवठा कार्यालयात (Zonal Office) भेट द्या", "नवीन पावती किंवा अपडेटेड कार्ड प्राप्त करा"],
            "hi": ["आधिकारिक आवेदन पत्र तैयार कर प्रिंट लें", "मूल दस्तावेजों के साथ क्षेत्रीय आपूर्ति कार्यालय जाएं", "अपडेटेड पर्ची या कार्ड प्राप्त करें"],
            "en": ["Generate official municipal application draft", "Visit local Zonal Food & Supplies office with original documents", "Receive updated ration card slip"]
        },
        "priority": "medium",
        "severity": "medium",
        "confidence": 0.95
    },
    "other": {
        "department_key": "general_admin",
        "department_name": {
            "mr": "पुणे मनपा सामान्य जनतक्रार निवारण कक्ष",
            "hi": "पुणे नगर निगम सामान्य जनशिकायत निवारण प्रकोष्ठ",
            "en": "PMC General Grievance Redressal Cell"
        },
        "reason": {
            "mr": "दिलेल्या माहितीवरून विशिष्ट विभाग निश्चित करता येत नाही. अचूक कारवाईसाठी समस्येचा थोडा अधिक तपशील आवश्यक आहे.",
            "hi": "दी गई जानकारी से विशिष्ट विभाग निश्चित नहीं हो पा रहा है। उचित कार्रवाई हेतु अतिरिक्त विवरण आवश्यक है।",
            "en": "The complaint text does not clearly match a specific municipal department. A bit more detail is needed."
        },
        "clarifying_question": {
            "mr": "आपली समस्या नेमकी कोणत्या विषयाशी संबंधित आहे? (उदा. रस्ता/खड्डा, कचरा, पाणीपुरवठा, पथदिवे, ड्रेनेज किंवा रेशन कार्ड) - कृपया थोडा अधिक तपशील सांगा.",
            "hi": "आपकी समस्या किस विषय से संबंधित है? (उदा. सड़क/गड्ढा, कचरा, पानी आपूर्ति, स्ट्रीटलाइट, सीवेज या राशन कार्ड) - कृपया थोड़ा और विवरण दें।",
            "en": "Which municipal service does your complaint relate to? (e.g., Road/Pothole, Garbage, Water Supply, Streetlight, Drainage, or Ration Card)?"
        },
        "required_documents": {
            "mr": ["समस्येचे सविस्तर वर्णन (Detailed Description)", "परिसराचा अचूक पत्ता (Location Address)"],
            "hi": ["समस्या का विस्तृत विवरण (Detailed Description)", "स्थान का पता (Location Address)"],
            "en": ["Detailed description of the issue", "Location address"]
        },
        "optional_documents": {
            "mr": ["कोणताही उपलब्ध फोटो (Photo - ऐच्छिक)"],
            "hi": ["कोई उपलब्ध फोटो (वैकल्पिक)"],
            "en": ["Any supporting photo (Helpful/Optional)"]
        },
        "next_steps": {
            "mr": ["तपशील दुरुस्त करून पुन्हा AI विश्लेषण करा किंवा मॅन्युअली योग्य प्रकार निवडा", "अधिकृत मसुदा तयार करून सबमिट करा"],
            "hi": ["विवरण संशोधित कर पुनः विश्लेषण करें अथवा श्रेणी चुनें", "तैयार कर सबमिट करें"],
            "en": ["Refine details and re-classify, or select the category manually", "Review and proceed to submit"]
        },
        "priority": "low",
        "severity": "low",
        "confidence": 0.50
    }
}

@app.post("/api/classify")
@app.post("/api/complaints/classify")
async def classify_complaint(req: ClassifyRequest):
    text_lower = req.text.lower()
    lang = req.lang if req.lang in ["mr", "hi", "en"] else "mr"

    # Precise keyword routing
    category = "other"
    if any(k in text_lower for k in ["ड्रेनेज", "गटार", "गटारे", "मलनिस्सारण", "सीवर", "नाली", "चेंबर", "drainage", "sewage", "gutter", "manhole", "drain"]):
        category = "drainage"
    elif any(k in text_lower for k in ["लाईट", "लाइट", "पथदिवा", "पथदिवे", "स्ट्रीटलाइट", "खांब", "अंधार", "दिवा", "streetlight", "street light", "lamp", "dark street", "pole"]):
        category = "streetlight"
    elif any(k in text_lower for k in ["पाणी", "पाणीपुरवठा", "गळती", "नळ", "जल", "पानी", "पाइप", "water", "leak", "pipeline", "tap", "water supply"]):
        category = "water"
    elif any(k in text_lower for k in ["कचरा", "घाण", "डंप", "कचराकुंडी", "दुर्गंधी", "सफाई", "कचरापेटी", "garbage", "trash", "waste", "dump", "debris", "litter"]):
        category = "garbage"
    elif any(k in text_lower for k in ["खड्डा", "खड्डे", "गड्ढा", "गड्ढे", "रस्ता", "रस्ते", "डांबर", "road", "pothole", "street damage", "asphalt"]):
        category = "pothole"
    elif any(k in text_lower for k in ["रेशन", "राशन", "शिधापत्रिका", "धान्य", "अन्न", "रेशनिंग", "ration", "ration card", "food supply"]):
        category = "ration_card"

    meta = CIVIC_CATEGORY_METADATA.get(category, CIVIC_CATEGORY_METADATA["other"])
    dep_name = meta["department_name"].get(lang, meta["department_name"]["en"])
    reason = meta["reason"].get(lang, meta["reason"]["en"])
    req_docs = meta["required_documents"].get(lang, meta["required_documents"]["en"])
    opt_docs = meta["optional_documents"].get(lang, meta["optional_documents"]["en"])
    next_steps = meta["next_steps"].get(lang, meta["next_steps"]["en"])
    clarifying = meta.get("clarifying_question", {}).get(lang, None) if category == "other" else None

    summary_en = f"Civic grievance regarding {category} requiring {meta['department_name']['en']} action."
    summary_local = f"{category.replace('_', ' ').title()}: {req.text[:65]}..."

    # If Gemini is configured, optionally enrich summaries
    if gemini_configured and category != "other":
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            prompt = (
                f"Summarize this civic complaint in one brief sentence: '{req.text}'. "
                f"Output short summary in {lang}."
            )
            resp = model.generate_content(prompt)
            if resp and resp.text:
                summary_local = resp.text.strip()
        except Exception as e:
            print(f"Gemini enrichment notice: {e}")

    return {
        "category": category,
        "department": {
            "key": meta["department_key"],
            "name": dep_name
        },
        "department_key": meta["department_key"],
        "department_name": dep_name,
        "reason": reason,
        "required_documents": req_docs,
        "optional_documents": opt_docs,
        "documents": req_docs + opt_docs,
        "next_steps": next_steps,
        "priority": meta["priority"],
        "severity": meta["severity"],
        "confidence": meta["confidence"],
        "clarifying_question": clarifying,
        "summary_en": summary_en,
        "summary_local": summary_local
    }

# 10 Official Pune Municipal Wards Centroids
PUNE_OFFICIAL_WARDS = [
    {"id": 1, "name": "Shivajinagar-Ghole Road", "lat": 18.5308, "lng": 73.8475},
    {"id": 2, "name": "Kasba-Vishrambaug", "lat": 18.5196, "lng": 73.8553},
    {"id": 3, "name": "Aundh-Baner", "lat": 18.5590, "lng": 73.7868},
    {"id": 4, "name": "Kothrud-Bavdhan", "lat": 18.5074, "lng": 73.8077},
    {"id": 5, "name": "Hadapsar-Mundhwa", "lat": 18.5089, "lng": 73.9259},
    {"id": 6, "name": "Yerawada-Kalas-Dhanori", "lat": 18.5679, "lng": 73.9143},
    {"id": 7, "name": "Bibwewadi", "lat": 18.4800, "lng": 73.8620},
    {"id": 8, "name": "Sinhagad Road", "lat": 18.4800, "lng": 73.8200},
    {"id": 9, "name": "Warje-Karvenagar", "lat": 18.4900, "lng": 73.8000},
    {"id": 10, "name": "Nagar Road-Wadgaonsheri", "lat": 18.5500, "lng": 73.9000}
]

# Baseline sample / demo statistics when database has no records or during demo testing
DEMO_WARD_BASELINE = {
    1: {"submitted": 6, "in_review": 9, "in_progress": 11, "resolved": 10, "rejected": 2},
    2: {"submitted": 4, "in_review": 6, "in_progress": 8, "resolved": 9, "rejected": 2},
    3: {"submitted": 8, "in_review": 10, "in_progress": 12, "resolved": 13, "rejected": 1},
    4: {"submitted": 7, "in_review": 12, "in_progress": 15, "resolved": 15, "rejected": 2},
    5: {"submitted": 9, "in_review": 8, "in_progress": 11, "resolved": 12, "rejected": 2},
    6: {"submitted": 5, "in_review": 9, "in_progress": 10, "resolved": 10, "rejected": 1},
    7: {"submitted": 3, "in_review": 5, "in_progress": 9, "resolved": 8, "rejected": 1},
    8: {"submitted": 6, "in_review": 7, "in_progress": 10, "resolved": 9, "rejected": 1},
    9: {"submitted": 4, "in_review": 6, "in_progress": 8, "resolved": 9, "rejected": 1},
    10: {"submitted": 5, "in_review": 8, "in_progress": 9, "resolved": 8, "rejected": 1}
}

@app.post("/api/geo/resolve")
async def resolve_geo(req: ResolveGeoRequest):
    address = "Pune, Maharashtra"
    # Basic Nominatim reverse geocoding
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?lat={req.lat}&lon={req.lng}&format=json"
        async with httpx.AsyncClient(timeout=5.0) as client:
            headers = {"User-Agent": "NagrikMitraAI/1.0 (test@example.com)"}
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                if "display_name" in data:
                    # Simplify the address
                    parts = data["display_name"].split(", ")
                    address = ", ".join(parts[:4]) # take first 4 parts
    except Exception as e:
        print(f"Geocoding error: {e}")

    # Assign ward based on nearest centroid
    nearest_ward_id = 1
    nearest_ward_name = PUNE_OFFICIAL_WARDS[0]["name"]
    
    min_dist = float('inf')
    for w in PUNE_OFFICIAL_WARDS:
        dist = ((w["lat"] - req.lat)**2 + (w["lng"] - req.lng)**2)**0.5
        if dist < min_dist:
            min_dist = dist
            nearest_ward_id = w["id"]
            nearest_ward_name = w["name"]

    return {
        "ward_id": nearest_ward_id,
        "ward_name": nearest_ward_name,
        "address": address
    }

@app.post("/api/complaints")
async def create_complaint(complaint: ComplaintCreate):
    date_str = datetime.datetime.now().strftime("%Y%m%d")
    ref_no = f"NM-PUNE-{date_str}-{random.randint(1000, 9999)}"
    comp_id = str(uuid.uuid4())
    now_iso = datetime.datetime.now().isoformat()
    pdf_url = f"/api/documents/generate-pdf?id={comp_id}"
    
    # Store complete complaint dictionary in-memory for immediate local retrieval
    comp_dict = {
        "id": comp_id,
        "ref_no": ref_no,
        "status": complaint.status or "submitted",
        **complaint.dict(),
        "pdf_url": pdf_url,
        "created_at": now_iso
    }
    db_complaints[comp_id] = comp_dict

    # Map category to allowed check constraint values ('pothole', 'garbage', 'ration_card', 'other')
    valid_db_cats = {"pothole", "garbage", "ration_card", "other"}
    db_cat = complaint.category if complaint.category in valid_db_cats else "other"
    
    # Map status to valid enum ('submitted', 'in_review', 'in_progress', 'resolved', 'rejected')
    valid_statuses = {"submitted", "in_review", "in_progress", "resolved", "rejected"}
    db_status = complaint.status if complaint.status in valid_statuses else "submitted"
    
    # Prepare non-null required fields for Supabase table
    transcript_val = complaint.transcript or complaint.summary_local or complaint.summary_en or "Civic Complaint"
    lang_val = complaint.lang or "mr"
    severity_val = complaint.severity or "medium"
    address_val = complaint.address or "Pune, Maharashtra"
    citizen_phone_val = complaint.citizen_phone or complaint.contact_phone
    citizen_name_val = complaint.citizen_name or complaint.contact_name

    supabase_dict = {
        "id": comp_id,
        "ref_no": ref_no,
        "category": db_cat,
        "department_key": complaint.department_key or "pmc_general",
        "lang": lang_val,
        "transcript": transcript_val,
        "summary_en": complaint.summary_en or "Civic complaint registered",
        "summary_local": complaint.summary_local or complaint.summary_en or "नागरी तक्रार",
        "severity": severity_val,
        "lat": float(complaint.lat),
        "lng": float(complaint.lng),
        "address": address_val,
        "ward_id": int(complaint.ward_id or 1),
        "image_url": complaint.image_url,
        "pdf_url": pdf_url,
        "citizen_name": citizen_name_val,
        "citizen_phone": citizen_phone_val,
        "status": db_status,
        "created_at": now_iso
    }

    if supabase:
        try:
            supabase.table("complaints").insert(supabase_dict).execute()
        except Exception as e:
            print(f"Supabase insert error: {e}")

    return {
        "id": comp_id,
        "ref_no": ref_no,
        "status": db_status,
        "pdf_url": pdf_url
    }

@app.get("/api/complaints")
async def get_complaints():
    items = []
    if supabase:
        try:
            res = supabase.table("public_complaints").select("*").order("created_at", desc=True).limit(50).execute()
            items = res.data or []
        except Exception:
            try:
                res = supabase.table("complaints").select("*").order("created_at", desc=True).limit(50).execute()
                items = res.data or []
            except Exception as e:
                print(f"Supabase select error: {e}")
                items = list(db_complaints.values())
    else:
        items = list(db_complaints.values())

    # Strictly sanitize public feed: zero PII (phone, name, email) exposed
    sanitized = []
    for comp in items:
        clean = dict(comp)
        clean.pop("citizen_phone", None)
        clean.pop("contact_phone", None)
        clean.pop("citizen_name", None)
        clean.pop("contact_name", None)
        clean.pop("email", None)
        sanitized.append(clean)
    return sanitized

@app.get("/api/stats/wards")
async def get_ward_stats():
    """
    Returns aggregated complaint statistics for all 10 Pune wards.
    Integrates complaints from Supabase or in-memory store.
    Provides complete numeric by_status breakdowns and source metadata.
    """
    active_complaints = []
    if supabase:
        try:
            res = supabase.table("complaints").select("ward_id, status").execute()
            active_complaints = res.data or []
        except Exception as e:
            print(f"Supabase stats query error: {e}")
            active_complaints = list(db_complaints.values())
    else:
        active_complaints = list(db_complaints.values())

    results = []
    for w in PUNE_OFFICIAL_WARDS:
        w_id = w["id"]
        base = DEMO_WARD_BASELINE.get(w_id, {
            "submitted": 5, "in_review": 7, "in_progress": 9, "resolved": 10, "rejected": 1
        })
        
        counts = {
            "submitted": int(base.get("submitted", 0)),
            "in_review": int(base.get("in_review", 0)),
            "in_progress": int(base.get("in_progress", 0)),
            "resolved": int(base.get("resolved", 0)),
            "rejected": int(base.get("rejected", 0))
        }

        # Merge dynamic complaints
        for c in active_complaints:
            if c.get("ward_id") == w_id:
                st = c.get("status", "submitted")
                if st in counts:
                    counts[st] += 1
                elif st == "pending":
                    counts["submitted"] += 1

        total = sum(counts.values())

        results.append({
            "ward_id": w_id,
            "ward_name": w["name"],
            "name": w["name"],
            "lat": w["lat"],
            "lng": w["lng"],
            "total": total,
            "by_status": counts,
            "is_sample": True,
            "data_source": "Sample Demonstration Dataset (Non-official PMC live record)"
        })

    return results

@app.get("/api/complaints/{ref_no}")
async def track_complaint(ref_no: str):
    if supabase:
        try:
            res = supabase.table("complaints").select("*").eq("ref_no", ref_no).execute()
            if res.data and len(res.data) > 0:
                record = dict(res.data[0])
                # Enrich department_name and ward_name if missing
                if not record.get("department_name"):
                    cat = record.get("category", "")
                    meta = CIVIC_CATEGORY_METADATA.get(cat, {})
                    record["department_name"] = meta.get("department_name", {}).get(record.get("lang", "en"), "PMC Civic Administration")
                if not record.get("ward_name"):
                    w_id = record.get("ward_id")
                    for w in PUNE_OFFICIAL_WARDS:
                        if w["id"] == w_id:
                            record["ward_name"] = w["name"]
                            break
                return record
        except Exception as e:
            print(f"Supabase track error: {e}")

    for comp in db_complaints.values():
        if comp.get("ref_no") == ref_no:
            return comp
    raise HTTPException(status_code=404, detail="Complaint not found")

@app.get("/api/documents/generate-pdf")
async def generate_pdf(id: str):
    comp = None
    if supabase:
        try:
            # Query by UUID id or by ref_no
            res = supabase.table("complaints").select("*").eq("id", id).execute()
            if res.data and len(res.data) > 0:
                comp = dict(res.data[0])
            else:
                res2 = supabase.table("complaints").select("*").eq("ref_no", id).execute()
                if res2.data and len(res2.data) > 0:
                    comp = dict(res2.data[0])
        except Exception as e:
            print(f"Supabase pdf fetch error: {e}")

    if not comp and id in db_complaints:
        comp = db_complaints[id]

    if not comp:
        # Check by ref_no in db_complaints
        for c in db_complaints.values():
            if c.get("ref_no") == id:
                comp = c
                break

    if not comp:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Safe lookup for department name
    dept_name = comp.get("department_name")
    if not dept_name:
        cat = comp.get("category", "")
        dept_meta = CIVIC_CATEGORY_METADATA.get(cat, {})
        dept_name = dept_meta.get("department_name", {}).get("en") or comp.get("department_key") or "PMC Civic Administration"
    
    # Generate actual PDF
    fd, temp_path = tempfile.mkstemp(suffix=".pdf")
    os.close(fd)
    
    c = canvas.Canvas(temp_path)
    c.drawString(100, 800, "Nagrik Mitra - Complaint Receipt")
    c.drawString(100, 780, f"Reference No: {comp.get('ref_no')}")
    c.drawString(100, 760, f"Date: {comp.get('created_at')}")
    c.drawString(100, 740, f"Category: {comp.get('category')}")
    c.drawString(100, 720, f"Department: {dept_name}")
    c.drawString(100, 700, f"Summary: {comp.get('summary_en') or comp.get('summary_local', '')}")
    c.drawString(100, 680, f"Status: {comp.get('status', 'submitted').capitalize()}")
    c.drawString(100, 660, f"Location: {comp.get('address', 'Pune')}")
    c.save()
    
    return FileResponse(temp_path, media_type="application/pdf", filename=f"Complaint_{comp.get('ref_no')}.pdf")

@app.get("/api/map/complaints")
def map_complaints():
    return [
        {"lat": 18.5204, "lng": 73.8567, "category": "pothole", "label": "[Demo Data] Shivajinagar Pothole"}
    ]

@app.get("/api/schemes")
def get_schemes():
    return [{"id": 1, "name": "Sample Scheme 1", "description": "Demo scheme"}]

@app.post("/api/schemes/eligibility")
def check_eligibility():
    return {"eligible": True, "message": "Demo eligibility check passed"}

@app.get("/api/departments")
def get_departments():
    if supabase:
        try:
            res = supabase.table("departments").select("*").execute()
            if res.data and len(res.data) > 0:
                return [
                    {
                        "key": d.get("key"),
                        "name": d.get("name_en") or d.get("name", ""),
                        "name_mr": d.get("name_mr") or d.get("name", ""),
                        "name_hi": d.get("name_hi") or d.get("name", ""),
                        "category": d.get("category")
                    }
                    for d in res.data
                ]
        except Exception as e:
            print(f"Supabase departments fetch error: {e}")

    return [
        {"key": meta["department_key"], "name": meta["department_name"]["en"], "name_mr": meta["department_name"]["mr"]}
        for meta in CIVIC_CATEGORY_METADATA.values()
    ]

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
