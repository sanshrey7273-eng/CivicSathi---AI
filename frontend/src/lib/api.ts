import type { Complaint, Language, WardStat, ComplaintCategory } from '../types';
import { DEPARTMENTS, INITIAL_COMPLAINTS, INITIAL_WARD_STATS, PUNE_WARDS } from '../data/mockData';

const getApiBase = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    const clean = envUrl.trim().replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }
  return import.meta.env.DEV ? 'http://localhost:8000/api' : '/api';
};

export const API_BASE = getApiBase();

export interface ClassifyResult {
  category: ComplaintCategory;
  confidence: number;
  department: {
    key: string;
    name: string;
  };
  department_key: string;
  department_name: string;
  reason: string;
  required_documents: string[];
  optional_documents: string[];
  documents: string[];
  next_steps: string[];
  priority: 'low' | 'medium' | 'high';
  severity: 'low' | 'medium' | 'high';
  clarifying_question?: string | null;
  summary_en: string;
  summary_local: string;
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function classifyText(text: string, lang: Language): Promise<ClassifyResult> {
  try {
    const res = await fetch(`${API_BASE}/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang }),
      signal: AbortSignal.timeout(8000)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Graceful offline heuristic fallback
  }

  // Heuristic offline classification
  const lower = text.toLowerCase();
  let category: ComplaintCategory = 'other';
  let depKey = 'general_admin';

  if (lower.includes('ड्रेनेज') || lower.includes('गटार') || lower.includes('गटारे') || lower.includes('मलनिस्सारण') || lower.includes('सीवर') || lower.includes('नाली') || lower.includes('चेंबर') || lower.includes('drainage') || lower.includes('sewage') || lower.includes('gutter') || lower.includes('drain') || lower.includes('manhole')) {
    category = 'drainage';
    depKey = 'pmc_drainage';
  } else if (lower.includes('लाईट') || lower.includes('लाइट') || lower.includes('पथदिवा') || lower.includes('पथदिवे') || lower.includes('स्ट्रीटलाइट') || lower.includes('खांब') || lower.includes('अंधार') || lower.includes('दिवा') || lower.includes('streetlight') || lower.includes('lamp') || lower.includes('dark street') || lower.includes('pole')) {
    category = 'streetlight';
    depKey = 'electrical_dept';
  } else if (lower.includes('पाणी') || lower.includes('पाणीपुरवठा') || lower.includes('गळती') || lower.includes('नळ') || lower.includes('जल') || lower.includes('पानी') || lower.includes('पाइप') || lower.includes('water') || lower.includes('leak') || lower.includes('pipeline') || lower.includes('water supply')) {
    category = 'water';
    depKey = 'water_supply';
  } else if (lower.includes('कचरा') || lower.includes('घाण') || lower.includes('डंप') || lower.includes('कचराकुंडी') || lower.includes('दुर्गंधी') || lower.includes('सफाई') || lower.includes('garbage') || lower.includes('trash') || lower.includes('waste') || lower.includes('dump') || lower.includes('debris')) {
    category = 'garbage';
    depKey = 'pmc_swm';
  } else if (lower.includes('खड्डा') || lower.includes('खड्डे') || lower.includes('गड्ढा') || lower.includes('गड्ढे') || lower.includes('रस्ता') || lower.includes('रस्ते') || lower.includes('डांबर') || lower.includes('road') || lower.includes('pothole') || lower.includes('street damage')) {
    category = 'pothole';
    depKey = 'pmc_road';
  } else if (lower.includes('रेशन') || lower.includes('राशन') || lower.includes('शिधापत्रिका') || lower.includes('धान्य') || lower.includes('अन्न') || lower.includes('ration') || lower.includes('ration card')) {
    category = 'ration_card';
    depKey = 'food_civil_supplies';
  }

  const dept = DEPARTMENTS[depKey] || DEPARTMENTS.pmc_road;
  const langKey = lang === 'en' ? 'en' : lang === 'hi' ? 'hi' : 'mr';

  const metadata: Record<ComplaintCategory, {
    reason: { mr: string; hi: string; en: string };
    required: { mr: string[]; hi: string[]; en: string[] };
    optional: { mr: string[]; hi: string[]; en: string[] };
    nextSteps: { mr: string[]; hi: string[]; en: string[] };
    priority: 'low' | 'medium' | 'high';
    confidence: number;
    clarifying?: { mr: string; hi: string; en: string };
  }> = {
    pothole: {
      reason: {
        mr: 'शहरातील सार्वजनिक रस्त्यांवरील खड्डे बुजवणे, डांबरीकरण आणि रस्त्यांची सुरक्षा राखणे ही जबाबदारी मनपा पथ विभागाकडे असते.',
        hi: 'शहर की सड़कों के गड्ढे भरने, डामरीकरण और सड़क सुरक्षा की जिम्मेदारी नगर निगम सड़क विभाग के पास है।',
        en: 'Maintenance of city roads, asphalt repairs, and pothole filling are managed by PMC Road Maintenance Department.'
      },
      required: {
        mr: ['अचूक रस्त्याचे ठिकाण व पत्ता (Exact Location)', 'जवळची खूण / लँडमार्क (Nearby Landmark)'],
        hi: ['सटीक सड़क का स्थान और पता (Exact Location)', 'नजदीकी लैंडमार्क (Nearby Landmark)'],
        en: ['Exact road location and address', 'Nearby landmark / intersection']
      },
      optional: {
        mr: ['खड्ड्याचे स्पष्ट छायाचित्र (Road Photo - ऐच्छिक)', 'अपघाताचा धोका / तीव्रता तपशील (Optional)'],
        hi: ['गड्ढे का स्पष्ट फोटो (Photo - वैकल्पिक)', 'दुर्घटना जोखिम विवरण (Optional)'],
        en: ['Clear photo of pothole (Helpful/Optional)', 'Severity / hazard details (Optional)']
      },
      nextSteps: {
        mr: ['तक्रार अधिकृत अर्ज स्वरूपात सबमिट करा', 'क्षेत्रीय कनिष्ठ अभियंता ४८ तासांत प्रत्यक्ष पाहणी करेल', 'दुरुस्ती अहवाल एसएमएस किंवा ऑनलाइन ट्रॅक करा'],
        hi: ['शिकायत दर्ज कर संदर्भ संख्या प्राप्त करें', 'क्षेत्रीय अभियंता ४८ घंटे में निरीक्षण करेगा', 'मरम्मत स्थिति ऑनलाइन ट्रैक करें'],
        en: ['Submit complaint and receive tracking reference', 'Junior Engineer will inspect site within 48 hours', 'Track repair progress online or via reference number']
      },
      priority: 'high',
      confidence: 0.95
    },
    garbage: {
      reason: {
        mr: 'रस्त्यावरील साचलेला कचरा उचलणे, कचराकुंड्या रिकाम्या करणे व सार्वजनिक स्वच्छता राखणे हे घनकचरा विभागाचे कार्य आहे.',
        hi: 'सड़क पर जमा कचरे का उठाव, कचरा पात्र खाली करना और स्वच्छता बनाए रखना ठोस अपशिष्ट प्रबंधन विभाग का कार्य है।',
        en: 'Clearing waste accumulation, emptying municipal bins, and public sanitation are handled by the Solid Waste Dept.'
      },
      required: {
        mr: ['कचरा साचलेल्या जागेचा अचूक पत्ता (Location)', 'परिसराचे नाव व जवळची खूण (Landmark)'],
        hi: ['कचरा जमा होने का सटीक स्थान (Location)', 'क्षेत्र का नाम व नजदीकी लैंडमार्क (Landmark)'],
        en: ['Accurate address of waste accumulation', 'Area landmark for sanitary truck access']
      },
      optional: {
        mr: ['साचलेल्या कचऱ्याचा फोटो (Garbage Photo - ऐच्छिक)', 'किती दिवसांपासून कचरा साचला आहे याचा तपशील (Optional)'],
        hi: ['कचरे के ढेर का फोटो (Photo - वैकल्पिक)', 'कितने दिनों से कचरा है इसका विवरण (Optional)'],
        en: ['Photo of garbage accumulation (Helpful/Optional)', 'Days uncleared details (Optional)']
      },
      nextSteps: {
        mr: ['तक्रार सबमिट करा व पावती क्रमांक मिळवा', 'आरोग्य निरीक्षक २४ तासांत गाडी पाठवून कचरा उचलेल', 'स्वच्छतेची खात्री करून तक्रार बंद केली जाईल'],
        hi: ['शिकायत दर्ज कर पावती प्राप्त करें', 'सफाई निरीक्षक २४ घंटे में कचरा गाड़ी भेजेगा', 'सफाई सत्यापन के बाद शिकायत बंद होगी'],
        en: ['Submit complaint and retain reference number', 'Sanitary inspector dispatches collection vehicle within 24 hours', 'Closed after sanitation verification']
      },
      priority: 'high',
      confidence: 0.96
    },
    water: {
      reason: {
        mr: 'मुख्य जलवाहिनी गळती, कमी दाबाने पाणीपुरवठा किंवा दूषित पाण्याचे निवारण पाणी पुरवठा विभागामार्फत केले जाते.',
        hi: 'जलवाहिनी लीकेज, कम दबाव से पानी आना अथवा दूषित पेयजल समस्या का समाधान जल आपूर्ति विभाग करता है।',
        en: 'Pipeline leaks, low water pressure, contaminated water, or supply disruptions fall under the Water Supply Dept.'
      },
      required: {
        mr: ['बाधित परिसराचा अचूक पत्ता (Location)', 'समस्येचे स्वरूप (कमी दाब / दूषित पाणी / गळती)'],
        hi: ['प्रभावित क्षेत्र का सटीक पता (Location)', 'समस्या का प्रकार (कम दबाव / लीकेज / गंदा पानी)'],
        en: ['Affected street or building address', 'Nature of issue (Leakage / Low Pressure / Contamination)']
      },
      optional: {
        mr: ['पाईपलाईन गळतीचा फोटो (Photo - ऐच्छिक)', 'पाणी येण्याची वेळ / वारंवारता तपशील (Optional)'],
        hi: ['पाइप लीकेज का फोटो (वैकल्पिक)', 'जल आपूर्ति समय विवरण (Optional)'],
        en: ['Photo of pipeline leak or murky water (Helpful/Optional)', 'Supply timing details (Optional)']
      },
      nextSteps: {
        mr: ['तक्रार नोंदवून जल अभियंता कार्यालयाकडे पाठवली जाईल', 'लाईनमन किंवा दुरुस्ती पथक २४ ते ४८ तासांत गळती दुरुस्त करेल', 'नियमित पाणीपुरवठा पूर्ववत केला जाईल'],
        hi: ['शिकायत जल अभियंता कार्यालय को प्रेषित होगी', 'मरम्मत दल २४ से ४८ घंटे में लीकेज ठीक करेगा', 'सामान्य जल आपूर्ति बहाल की जाएगी'],
        en: ['Complaint forwarded to Zonal Water Engineer', 'Maintenance crew dispatched within 24-48 hours', 'Supply pressure restored']
      },
      priority: 'high',
      confidence: 0.93
    },
    streetlight: {
      reason: {
        mr: 'बंद पथदिवे दुरुस्त करणे, खराब झालेले दिवे बदलणे व विद्युत खांबांची सुरक्षा राखणे ही विद्युत विभागाची जबाबदारी आहे.',
        hi: 'बंद स्ट्रीटलाइट ठीक करना, बल्ब बदलना तथा बिजली खंभों की सुरक्षा बनाए रखना विद्युत विभाग का कार्य है।',
        en: 'Non-functional streetlights, faulty fixtures, broken poles, and wiring safety are maintained by Electrical Dept.'
      },
      required: {
        mr: ['रस्त्याचे नाव व जवळचा विजेचा खांब क्रमांक / खूण (Pole / Landmark)', 'परिसराचा पत्ता (Location)'],
        hi: ['सड़क का नाम व नजदीकी खंभा नंबर / लैंडमार्क (Pole / Landmark)', 'स्थान का पता (Location)'],
        en: ['Street name & nearby lamp pole number or landmark', 'Area address']
      },
      optional: {
        mr: ['बंद दिव्याचा किंवा खांबाचा फोटो (Photo - ऐच्छिक)'],
        hi: ['बंद स्ट्रीटलाइट का फोटो (वैकल्पिक)'],
        en: ['Photo of dark street or damaged pole (Helpful/Optional)']
      },
      nextSteps: {
        mr: ['तक्रार संबंधित क्षेत्रीय विद्युत मक्तेदाराकडे वर्ग केली जाईल', '४८ ते ७२ तासांत दिवा बदलून किंवा दुरुस्त करून चालू केला जाईल'],
        hi: ['शिकायत क्षेत्रीय विद्युत ठेकेदार को भेजी जाएगी', '४८ से ७२ घंटे में लाइट मरम्मत कर चालू की जाएगी'],
        en: ['Dispatched to electrical maintenance contractor', 'Bulb or circuit replaced within 48-72 hours']
      },
      priority: 'medium',
      confidence: 0.92
    },
    drainage: {
      reason: {
        mr: 'तुंबलेली गटारे, चेंबरमधून बाहेर पडणारे सांडपाणी व पावसाळी वाहिन्यांची सफाई ड्रेनेज विभागाकडून केली जाते.',
        hi: 'चोक हुई नालियां, सीवेज चेंबर का ओवरफ्लो और गंदे पानी की निकासी ड्रेनेज विभाग द्वारा संभाली जाती है।',
        en: 'Clogged stormwater drains, overflowing manholes, and blocked sewer lines are cleared by Drainage Department.'
      },
      required: {
        mr: ['तुंबलेल्या गटाराचे / चेंबरचे अचूक ठिकाण (Location)', 'जवळची खूण (Landmark)'],
        hi: ['ओवरफ्लो चेंबर का सटीक स्थान (Location)', 'नजदीकी लैंडमार्क'],
        en: ['Location of overflowing manhole or choked drain', 'Nearby landmark']
      },
      optional: {
        mr: ['तुंबलेल्या सांडपाण्याचा फोटो (Photo - ऐच्छिक)', 'रोगराईचा धोका / दुर्गंधी तपशील (Optional)'],
        hi: ['नाली / चेंबर ओवरफ्लो का फोटो (वैकल्पिक)', 'दुर्गंध या जोखिम विवरण (Optional)'],
        en: ['Photo of sewage overflow (Helpful/Optional)', 'Waterlogging risk note (Optional)']
      },
      nextSteps: {
        mr: ['ड्रेनेज जेटिंग मशीन व सफाई पथक २४ तासांत रवाना केले जाईल', 'चेंबर साफ करून पाण्याचा निचरा मोकळा केला जाईल'],
        hi: ['जेटिंग मशीन व सफाई दल २४ घंटे में भेजा जाएगा', 'चेंबर साफ कर पानी की निकासी शुरू की जाएगी'],
        en: ['Jetting machine unit dispatched within 24 hours', 'Chamber desilted and drainage flow restored']
      },
      priority: 'high',
      confidence: 0.95
    },
    ration_card: {
      reason: {
        mr: 'रेशन कार्ड दुरुस्ती, नवीन नाव समाविष्ट करणे किंवा धान्य वाटप तक्रारींचे निवारण नागरी पुरवठा कार्यालयामार्फत होते.',
        hi: 'राशन कार्ड में सुधार, नए सदस्य का नाम जोड़ना अथवा अनाज वितरण शिकायतों का समाधान खाद्य आपूर्ति विभाग करता है।',
        en: 'Ration card corrections, member additions, and public distribution subsidies are processed by Food & Civil Supplies.'
      },
      required: {
        mr: ['विद्यमान रेशन कार्ड क्रमांक (Ration Card Number)', 'अर्जदाराचा ओळखीचा पुरावा (Identity Proof)'],
        hi: ['मौजूदा राशन कार्ड नंबर (Ration Card Number)', 'आवेदक का पहचान प्रमाण (Identity Proof)'],
        en: ['Existing ration card number', 'Identity proof of applicant']
      },
      optional: {
        mr: ['नाव जोडण्यासाठी जन्म/विवाह दाखला (Only if member addition)', 'पासपोर्ट आकाराचे छायाचित्र (Photo)'],
        hi: ['नाम जोड़ने हेतु जन्म/विवाह प्रमाण पत्र (यदि सदस्य जोड़ना हो)', 'पासपोर्ट साइज फोटो'],
        en: ['Birth/Marriage certificate (only if adding a member)', 'Passport size photograph']
      },
      nextSteps: {
        mr: ['नागरिक मित्र द्वारे अधिकृत विनंती अर्ज मसुदा तयार करा', 'मूळ कागदपत्रांसह विभागीय पुरवठा कार्यालयात (Zonal Office) भेट द्या', 'नवीन पावती किंवा अपडेटेड कार्ड प्राप्त करा'],
        hi: ['आधिकारिक आवेदन पत्र तैयार कर प्रिंट लें', 'मूल दस्तावेजों के साथ क्षेत्रीय आपूर्ति कार्यालय जाएं', 'अपडेटेड पर्ची या कार्ड प्राप्त करें'],
        en: ['Generate official municipal application draft', 'Visit local Zonal Food & Supplies office with original documents', 'Receive updated ration card slip']
      },
      priority: 'medium',
      confidence: 0.95
    },
    other: {
      reason: {
        mr: 'दिलेल्या माहितीवरून विशिष्ट विभाग निश्चित करता येत नाही. अचूक कारवाईसाठी समस्येचा थोडा अधिक तपशील आवश्यक आहे.',
        hi: 'दी गई जानकारी से विशिष्ट विभाग निश्चित नहीं हो पा रहा है। उचित कार्रवाई हेतु अतिरिक्त विवरण आवश्यक है।',
        en: 'The complaint text does not clearly match a specific municipal department. A bit more detail is needed.'
      },
      clarifying: {
        mr: 'आपली समस्या नेमकी कोणत्या विषयाशी संबंधित आहे? (उदा. रस्ता/खड्डा, कचरा, पाणीपुरवठा, पथदिवे, ड्रेनेज किंवा रेशन कार्ड) - कृपया थोडा अधिक तपशील सांगा.',
        hi: 'आपकी समस्या किस विषय से संबंधित है? (उदा. सड़क/गड्ढा, कचरा, पानी आपूर्ति, स्ट्रीटलाइट, सीवेज या राशन कार्ड) - कृपया थोड़ा और विवरण दें।',
        en: 'Which municipal service does your complaint relate to? (e.g., Road/Pothole, Garbage, Water Supply, Streetlight, Drainage, or Ration Card)?'
      },
      required: {
        mr: ['समस्येचे सविस्तर वर्णन (Detailed Description)', 'परिसराचा अचूक पत्ता (Location Address)'],
        hi: ['समस्या का विस्तृत विवरण (Detailed Description)', 'स्थान का पता (Location Address)'],
        en: ['Detailed description of the issue', 'Location address']
      },
      optional: {
        mr: ['कोणताही उपलब्ध फोटो (Photo - ऐच्छिक)'],
        hi: ['कोई उपलब्ध फोटो (वैकल्पिक)'],
        en: ['Any supporting photo (Helpful/Optional)']
      },
      nextSteps: {
        mr: ['तपशील दुरुस्त करून पुन्हा AI विश्लेषण करा किंवा मॅन्युअली योग्य प्रकार निवडा', 'अधिकृत मसुदा तयार करून सबमिट करा'],
        hi: ['विवरण संशोधित कर पुनः विश्लेषण करें अथवा श्रेणी चुनें', 'तैयार कर सबमिट करें'],
        en: ['Refine details and re-classify, or select the category manually', 'Review and proceed to submit']
      },
      priority: 'low',
      confidence: 0.50
    }
  };

  const meta = metadata[category];
  const reqDocs = meta.required[langKey];
  const optDocs = meta.optional[langKey];
  const nextSteps = meta.nextSteps[langKey];
  const clarifying = category === 'other' ? meta.clarifying?.[langKey] : null;

  return {
    category,
    confidence: meta.confidence,
    department: {
      key: depKey,
      name: dept.name[langKey]
    },
    department_key: depKey,
    department_name: dept.name[langKey],
    reason: meta.reason[langKey],
    required_documents: reqDocs,
    optional_documents: optDocs,
    documents: [...reqDocs, ...optDocs],
    next_steps: nextSteps,
    priority: meta.priority,
    severity: meta.priority,
    clarifying_question: clarifying,
    summary_en: `Civic issue identified regarding ${category} requiring ${dept.name.en} attention.`,
    summary_local: lang === 'hi'
      ? `नागरिक द्वारा दर्ज शिकायत (${dept.name.hi}): ${text.slice(0, 100)}...`
      : `नागरिकाने नोंदवलेली समस्या (${dept.name.mr}): ${text.slice(0, 100)}...`
  };
}

export async function resolveGeo(lat: number, lng: number): Promise<{ ward_id: number; ward_name: string; address: string }> {
  try {
    const res = await fetch(`${API_BASE}/geo/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng }),
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Offline nearest ward
  }

  // Find nearest centroid
  let nearestWard = PUNE_WARDS[0];
  let minDistance = Number.MAX_VALUE;

  for (const ward of PUNE_WARDS) {
    const d = Math.hypot(ward.lat - lat, ward.lng - lng);
    if (d < minDistance) {
      minDistance = d;
      nearestWard = ward;
    }
  }

  return {
    ward_id: nearestWard.id,
    ward_name: nearestWard.name,
    address: `${nearestWard.name}, Pune, Maharashtra`
  };
}

export async function submitComplaint(data: Partial<Complaint>): Promise<{ id: string; ref_no: string; pdf_url: string | null }> {
  try {
    const res = await fetch(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(8000)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Simulated offline generation
  }

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const refNo = `NM-PUNE-${dateStr}-${randomSuffix}`;
  const id = `c-${Date.now()}`;

  return {
    id,
    ref_no: refNo,
    pdf_url: null
  };
}

export async function fetchComplaintByRef(refNo: string): Promise<Complaint | null> {
  try {
    const clean = refNo.trim();
    if (!clean) return null;
    const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(clean)}`, {
      signal: AbortSignal.timeout(6000)
    });
    if (res.ok) {
      const data = await res.json();
      return {
        id: data.id || `c-${Date.now()}`,
        ref_no: data.ref_no || clean,
        category: data.category || 'other',
        department_key: data.department_key || 'pmc_road',
        department_name: data.department_name || 'PMC Department',
        lang: data.lang || 'mr',
        transcript: data.transcript || data.summary_local || '',
        summary_local: data.summary_local || '',
        summary_en: data.summary_en || '',
        severity: data.severity || 'medium',
        lat: data.lat || 18.5204,
        lng: data.lng || 73.8567,
        address: data.address || 'Pune',
        ward_id: data.ward_id || 1,
        ward_name: data.ward_name || 'Shivajinagar-Ghole Road',
        image_url: data.image_url || null,
        citizen_name: data.citizen_name || 'Citizen',
        citizen_phone: data.citizen_phone || '',
        status: data.status || 'submitted',
        created_at: data.created_at || new Date().toISOString(),
        documents: data.documents || []
      };
    }
  } catch {
    // Offline lookup
  }
  return null;
}

export async function fetchStats(): Promise<{ wards: WardStat[]; total: number; resolved: number; pending: number }> {
  try {
    const res = await fetch(`${API_BASE}/stats/wards`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const rawWards: any[] = await res.json();
      if (Array.isArray(rawWards) && rawWards.length > 0) {
        const wards: WardStat[] = rawWards.map(w => {
          const byStatus = w.by_status || {};
          const submitted = Number(byStatus.submitted ?? byStatus.pending ?? 0) || 0;
          const in_review = Number(byStatus.in_review ?? 0) || 0;
          const in_progress = Number(byStatus.in_progress ?? 0) || 0;
          const resolved = Number(byStatus.resolved ?? 0) || 0;
          const rejected = Number(byStatus.rejected ?? 0) || 0;
          const computedTotal = submitted + in_review + in_progress + resolved + rejected;
          const totalVal = typeof w.total === 'number' && !isNaN(w.total) ? w.total : computedTotal;

          return {
            ward_id: Number(w.ward_id ?? w.id ?? 0),
            name: String(w.name || w.ward_name || `Ward ${w.ward_id || ''}`),
            lat: Number(w.lat ?? 18.5204) || 18.5204,
            lng: Number(w.lng ?? 73.8567) || 73.8567,
            total: isNaN(totalVal) ? 0 : totalVal,
            by_status: {
              submitted,
              in_review,
              in_progress,
              resolved,
              rejected
            }
          };
        });

        const total = wards.reduce((acc, w) => acc + (w.total || 0), 0);
        const resolved = wards.reduce((acc, w) => acc + (w.by_status?.resolved || 0), 0);
        return {
          wards,
          total: isNaN(total) ? 0 : total,
          resolved: isNaN(resolved) ? 0 : resolved,
          pending: Math.max(0, (isNaN(total) ? 0 : total) - (isNaN(resolved) ? 0 : resolved))
        };
      }
    }
  } catch {
    // Fallback to initial stats
  }

  const wards = INITIAL_WARD_STATS;
  const total = wards.reduce((acc, w) => acc + (w.total || 0), 0);
  const resolved = wards.reduce((acc, w) => acc + (w.by_status?.resolved || 0), 0);

  return {
    wards,
    total: isNaN(total) ? 0 : total,
    resolved: isNaN(resolved) ? 0 : resolved,
    pending: Math.max(0, total - resolved)
  };
}

export async function fetchRecentComplaints(): Promise<Complaint[]> {
  try {
    const res = await fetch(`${API_BASE}/complaints`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch {
    // Fallback
  }
  return INITIAL_COMPLAINTS;
}
