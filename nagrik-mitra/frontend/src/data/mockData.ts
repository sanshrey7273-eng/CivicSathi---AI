import type { Ward, Department, Scheme, Complaint, WardStat } from '../types';

export const PUNE_WARDS: Ward[] = [
  { id: 1, name: 'Shivajinagar-Ghole Road', lat: 18.5308, lng: 73.8475, officeAddress: 'Ghole Road, near Balgandharva Rangmandir, Shivajinagar' },
  { id: 2, name: 'Kasba-Vishrambaug', lat: 18.5196, lng: 73.8553, officeAddress: 'Near Shaniwar Wada, Kasba Peth' },
  { id: 3, name: 'Aundh-Baner', lat: 18.5590, lng: 73.7868, officeAddress: 'Bremen Chowk, Aundh, Pune' },
  { id: 4, name: 'Kothrud-Bavdhan', lat: 18.5074, lng: 73.8077, officeAddress: 'Paud Road, near Chandani Chowk, Kothrud' },
  { id: 5, name: 'Hadapsar-Mundhwa', lat: 18.5089, lng: 73.9259, officeAddress: 'Gadital, Pune-Solapur Highway, Hadapsar' },
  { id: 6, name: 'Yerawada-Kalas-Dhanori', lat: 18.5679, lng: 73.9143, officeAddress: 'Yerawada Ward Office, Nagar Road' },
  { id: 7, name: 'Bibwewadi', lat: 18.4800, lng: 73.8620, officeAddress: 'Swami Vivekanand Marg, Bibwewadi' },
  { id: 8, name: 'Sinhagad Road', lat: 18.4800, lng: 73.8200, officeAddress: 'Dhayari Phata, Sinhagad Road' },
  { id: 9, name: 'Warje-Karvenagar', lat: 18.4900, lng: 73.8000, officeAddress: 'Karve Road, Warje Malwadi' },
  { id: 10, name: 'Nagar Road-Wadgaonsheri', lat: 18.5500, lng: 73.9000, officeAddress: 'Wadgaonsheri Main Road, Pune' }
];

export const DEPARTMENTS: Record<string, Department> = {
  pmc_road: {
    key: 'pmc_road',
    name: {
      mr: 'पुणे महानगरपालिका पथ विभाग / क्षेत्रीय कार्यालय',
      hi: 'पुणे नगर निगम सड़क विभाग / वार्ड कार्यालय',
      en: 'PMC Road Department / Ward Office'
    },
    office: 'PMC Main Building, Shivajinagar, Pune 411005',
    docs: {
      mr: ['खड्ड्याचे छायाचित्र (फोटो)', 'अचूक ठिकाण / जवळची खूण (लँडमार्क)', 'नागरिकाचे नाव व संपर्क क्रमांक'],
      hi: ['सड़क के गड्ढे की तस्वीर (फोटो)', 'सटीक स्थान / नजदीकी लैंडमार्क', 'नागरिक का नाम व संपर्क नंबर'],
      en: ['Photo of the pothole', 'Exact location / nearby landmark', 'Citizen name and contact number']
    }
  },
  pmc_swm: {
    key: 'pmc_swm',
    name: {
      mr: 'पुणे महानगरपालिका घनकचरा व्यवस्थापन विभाग',
      hi: 'पुणे नगर निगम ठोस अपशिष्ट प्रबंधन विभाग',
      en: 'PMC Solid Waste Management Department'
    },
    office: 'Solid Waste Dept, Tilak Road Office, Pune 411030',
    docs: {
      mr: ['कचऱ्याच्या ढिगाऱ्याचे छायाचित्र (फोटो)', 'अचूक ठिकाण / जवळची खूण (लँडमार्क)', 'नागरिकाचे नाव व संपर्क क्रमांक'],
      hi: ['कचरे के ढेर की तस्वीर (फोटो)', 'सटीक स्थान / नजदीकी लैंडमार्क', 'नागरिक का नाम व संपर्क नंबर'],
      en: ['Photo of the garbage dump', 'Exact location / nearby landmark', 'Citizen name and contact number']
    }
  },
  food_civil_supplies: {
    key: 'food_civil_supplies',
    name: {
      mr: 'अन्न व नागरी पुरवठा कार्यालय (शिधापत्रिका)',
      hi: 'खाद्य एवं नागरिक आपूर्ति कार्यालय (राशन कार्ड)',
      en: 'Food & Civil Supplies Office (Ration Card)'
    },
    office: 'Collector Office Compound, Pune 411001',
    docs: {
      mr: ['विद्यमान रेशन कार्डची छायांकित प्रत', 'अर्जदाराचे आधार कार्ड', 'दुरुस्तीचा पुरावा (जन्म / विवाह दाखला)', 'पत्त्याचा पुरावा (वीज बिल / कर पावती)', 'पासपोर्ट आकाराचे छायाचित्र'],
      hi: ['मौजूदा राशन कार्ड की प्रति', 'आवेदक का आधार कार्ड', 'दुरुस्ती का प्रमाण (जन्म / विवाह प्रमाण पत्र)', 'पते का प्रमाण (बिजली बिल / कर रसीद)', 'पासपोर्ट साइज फोटो'],
      en: ['Copy of existing ration card', 'Aadhaar card of applicant', 'Proof of correct details (Birth/Marriage cert)', 'Address proof (Electricity bill)', 'Passport size photograph']
    }
  }
};

export const INITIAL_WARD_STATS: WardStat[] = [
  {
    ward_id: 1,
    name: 'Shivajinagar-Ghole Road',
    lat: 18.5308,
    lng: 73.8475,
    total: 38,
    by_status: { submitted: 6, in_review: 9, in_progress: 11, resolved: 10, rejected: 2 }
  },
  {
    ward_id: 2,
    name: 'Kasba-Vishrambaug',
    lat: 18.5196,
    lng: 73.8553,
    total: 29,
    by_status: { submitted: 4, in_review: 6, in_progress: 8, resolved: 9, rejected: 2 }
  },
  {
    ward_id: 3,
    name: 'Aundh-Baner',
    lat: 18.5590,
    lng: 73.7868,
    total: 44,
    by_status: { submitted: 8, in_review: 10, in_progress: 12, resolved: 13, rejected: 1 }
  },
  {
    ward_id: 4,
    name: 'Kothrud-Bavdhan',
    lat: 18.5074,
    lng: 73.8077,
    total: 51,
    by_status: { submitted: 7, in_review: 12, in_progress: 15, resolved: 15, rejected: 2 }
  },
  {
    ward_id: 5,
    name: 'Hadapsar-Mundhwa',
    lat: 18.5089,
    lng: 73.9259,
    total: 42,
    by_status: { submitted: 9, in_review: 8, in_progress: 11, resolved: 12, rejected: 2 }
  },
  {
    ward_id: 6,
    name: 'Yerawada-Kalas-Dhanori',
    lat: 18.5679,
    lng: 73.9143,
    total: 35,
    by_status: { submitted: 5, in_review: 9, in_progress: 10, resolved: 10, rejected: 1 }
  },
  {
    ward_id: 7,
    name: 'Bibwewadi',
    lat: 18.4800,
    lng: 73.8620,
    total: 26,
    by_status: { submitted: 3, in_review: 5, in_progress: 9, resolved: 8, rejected: 1 }
  },
  {
    ward_id: 8,
    name: 'Sinhagad Road',
    lat: 18.4800,
    lng: 73.8200,
    total: 33,
    by_status: { submitted: 6, in_review: 7, in_progress: 10, resolved: 9, rejected: 1 }
  },
  {
    ward_id: 9,
    name: 'Warje-Karvenagar',
    lat: 18.4900,
    lng: 73.8000,
    total: 28,
    by_status: { submitted: 4, in_review: 6, in_progress: 8, resolved: 9, rejected: 1 }
  },
  {
    ward_id: 10,
    name: 'Nagar Road-Wadgaonsheri',
    lat: 18.5500,
    lng: 73.9000,
    total: 31,
    by_status: { submitted: 5, in_review: 8, in_progress: 9, resolved: 8, rejected: 1 }
  }
];

export const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: 'c101-demo-uuid',
    ref_no: 'NM-PUNE-20261009-1042',
    category: 'pothole',
    department_key: 'pmc_road',
    department_name: 'पुणे महानगरपालिका पथ विभाग / क्षेत्रीय कार्यालय',
    lang: 'mr',
    transcript: 'फर्ग्युसन कॉलेज रस्त्यावर वैकुंठ स्मशानभूमी फाट्याजवळ भलामोठा खड्डा पडला आहे, काल रात्री दुचाकी घसरली.',
    summary_local: 'एफसी रोडवर वैकुंठ फाट्याजवळ धोकादायक खड्डा पडल्याने अपघात होण्याची शक्यता.',
    summary_en: 'Deep hazardous pothole on FC Road near Vaikunth junction causing accidents.',
    severity: 'high',
    lat: 18.5308,
    lng: 73.8475,
    address: 'FC Road, Shivajinagar, Pune 411005',
    ward_id: 1,
    ward_name: 'Shivajinagar-Ghole Road',
    image_url: null,
    citizen_name: 'आनंद देशपांडे',
    citizen_phone: '9822******',
    status: 'in_progress',
    created_at: '2026-10-09T08:30:00Z',
    documents: ['खड्ड्याचे छायाचित्र', 'अचूक ठिकाण खूण']
  },
  {
    id: 'c102-demo-uuid',
    ref_no: 'NM-PUNE-20261008-0891',
    category: 'garbage',
    department_key: 'pmc_swm',
    department_name: 'पुणे महानगरपालिका घनकचरा व्यवस्थापन विभाग',
    lang: 'mr',
    transcript: 'कोथरूड डीपी रस्त्यावरील कचराकुंडी गेल्या तीन दिवसांपासून साफ केलेली नाही, दुर्गंधी सुटली आहे.',
    summary_local: 'कोथरूड डीपी रस्त्यावरील सार्वजनिक कचराकुंडीची त्वरित सफाई करणे आवश्यक.',
    summary_en: 'Overflowing garbage bin on Kothrud DP Road causing foul odor and health risk.',
    severity: 'medium',
    lat: 18.5074,
    lng: 73.8077,
    address: 'DP Road, near Gujarat Colony, Kothrud, Pune',
    ward_id: 4,
    ward_name: 'Kothrud-Bavdhan',
    image_url: null,
    citizen_name: 'सुनीता जोशी',
    citizen_phone: '9423******',
    status: 'resolved',
    created_at: '2026-10-08T11:15:00Z',
    documents: ['कचऱ्याच्या ढिगाऱ्याचे छायाचित्र']
  },
  {
    id: 'c103-demo-uuid',
    ref_no: 'NM-PUNE-20261008-0744',
    category: 'ration_card',
    department_key: 'food_civil_supplies',
    department_name: 'अन्न व नागरी पुरवठा कार्यालय (शिधापत्रिका)',
    lang: 'mr',
    transcript: 'माझ्या रेशन कार्डमध्ये मुलाचे नाव समाविष्ट करायचे आहे, ऑनलाईन अर्ज स्वीकारत नाही.',
    summary_local: 'शिधापत्रिकेत नवीन बालकाचे नाव समाविष्ट करणे व अन्नधान्य लाभ सुरू करणे.',
    summary_en: 'Inclusion of child name in existing ration card and issue of verification receipt.',
    severity: 'medium',
    lat: 18.5196,
    lng: 73.8553,
    address: 'Kasba Peth, near Shaniwar Wada, Pune',
    ward_id: 2,
    ward_name: 'Kasba-Vishrambaug',
    image_url: null,
    citizen_name: 'रमेश कांबळे',
    citizen_phone: '9860******',
    status: 'in_review',
    created_at: '2026-10-08T15:40:00Z',
    documents: ['विद्यमान रेशन कार्ड प्रत', 'मुलाचा जन्म दाखला', 'आधार कार्ड']
  },
  {
    id: 'c104-demo-uuid',
    ref_no: 'NM-PUNE-20261007-0612',
    category: 'pothole',
    department_key: 'pmc_road',
    department_name: 'पुणे महानगरपालिका पथ विभाग / क्षेत्रीय कार्यालय',
    lang: 'hi',
    transcript: 'बानेर रोड पर महाबळेश्वर होटल के सामने सड़क धंस गई है, बड़ा गड्ढा है.',
    summary_local: 'बानेर रोड पर होटल के सामने गहरा गड्ढा, तत्काल डामरीकरण आवश्यक.',
    summary_en: 'Road cave-in on Baner Road in front of hotel, urgent macadam repair needed.',
    severity: 'high',
    lat: 18.5590,
    lng: 73.7868,
    address: 'Baner Main Road, Aundh-Baner Ward, Pune',
    ward_id: 3,
    ward_name: 'Aundh-Baner',
    image_url: null,
    citizen_name: 'रोहित वर्मा',
    citizen_phone: '9158******',
    status: 'resolved',
    created_at: '2026-10-07T09:20:00Z',
    documents: ['सड़क के गड्ढे की तस्वीर']
  }
];

export const GOV_SCHEMES: Scheme[] = [
  {
    id: 'scheme-sanjay-gandhi',
    title: {
      mr: 'संजय गांधी निराधार अनुदान योजना',
      hi: 'संजय गांधी निराधार अनुदान योजना',
      en: 'Sanjay Gandhi Niradhar Pension Scheme'
    },
    department: {
      mr: 'सामाजिक न्याय व विशेष सहाय्य विभाग, महाराष्ट्र शासन',
      hi: 'सामाजिक न्याय एवं विशेष सहायता विभाग, महाराष्ट्र',
      en: 'Social Justice & Special Assistance Dept, GoM'
    },
    description: {
      mr: 'निराधार व्यक्ती, अंध, अपंग, अनाथ मुले, घटस्फोटित आणि संकटग्रस्त महिलांना दरमहा आर्थिक सहाय्य.',
      hi: 'निराधार व्यक्तियों, दिव्यांगों, अनाथ बच्चों और निराश्रित महिलाओं को मासिक आर्थिक सहायता.',
      en: 'Monthly financial assistance to destitute persons, persons with disabilities, orphans, and distressed women.'
    },
    benefit: {
      mr: 'दरमहा ₹१,५००/- थेट बँक खात्यात (डीबीटी द्वारे)',
      hi: 'प्रति माह ₹१,५००/- सीधे बैंक खाते में (डीबीटी)',
      en: '₹1,500 per month directly into bank account via DBT'
    },
    minAge: 18,
    maxAge: 65,
    maxIncome: 50000,
    targetGroup: ['अपंग (Divyang)', 'निराधार (Destitute)', 'महिला (Women)', 'अनाथ (Orphan)'],
    requiredDocs: {
      mr: ['वयाचा दाखला / जन्म प्रमाण पत्र', 'तहसीलदार कार्यालयाचा उत्पन्नाचा दाखला (वार्षिक उत्पन्न ५० हजारांपेक्षा कमी)', '४०% पेक्षा जास्त अपंगत्वाचे वैद्यकीय प्रमाणपत्र (लागू असल्यास)', 'महाराष्ट्रात किमान १५ वर्षे रहिवासी असल्याचा दाखला', 'आधार कार्ड व बँक पासबुक झेरॉक्स'],
      hi: ['आयु प्रमाण पत्र', 'तहसीलदार द्वारा जारी आय प्रमाण पत्र', 'दिव्यांगता प्रमाण पत्र (यदि लागू हो)', 'महाराष्ट्र अधिवास प्रमाण पत्र (15 वर्ष)', 'आधार कार्ड एवं बैंक पासबुक प्रति'],
      en: ['Age proof / Birth certificate', 'Income certificate from Tahsildar (< ₹50,000/yr)', 'Medical disability certificate > 40% (if applicable)', 'Domicile certificate of Maharashtra (min 15 yrs)', 'Aadhaar Card and Bank Passbook copy']
    },
    applicationUrl: 'https://aaplesarkar.mahaonline.gov.in'
  },
  {
    id: 'scheme-pmay-urban',
    title: {
      mr: 'प्रधानमंत्री आवास योजना (नागरी - पुणे)',
      hi: 'प्रधानमंत्री आवास योजना (शहरी - पुणे)',
      en: 'Pradhan Mantri Awas Yojana (PMAY Urban - Pune)'
    },
    department: {
      mr: 'गृहनिर्माण विभाग, पुणे महानगरपालिका',
      hi: 'आवास विभाग, पुणे नगर निगम',
      en: 'Housing Dept, Pune Municipal Corporation'
    },
    description: {
      mr: 'पुणे शहरातील अल्प उत्पन्न व आर्थिकदृष्ट्या दुर्बल घटकांतील नागरिकांना हक्काचे पक्के घर उपलब्ध करून देणे.',
      hi: 'पुणे शहर के आर्थिक रूप से कमजोर और निम्न आय वर्ग के नागरिकों के लिए पक्का मकान.',
      en: 'Affordable permanent housing for economically weaker sections (EWS) and lower income groups in Pune.'
    },
    benefit: {
      mr: 'गृहकर्जावर ₹२.५० लाखांपर्यंत व्याज अनुदान (Subvention) किंवा परवडणारे सदनिका वाटप',
      hi: 'गृह ऋण पर ₹२.५० लाख तक की सब्सिडी अथवा किफायती फ्लैट आवंटन',
      en: 'Up to ₹2.5 Lakh interest subsidy on home loans or affordable flat allotment'
    },
    maxIncome: 300000,
    targetGroup: ['EWS / LIG', 'शहरी गरीब (Urban Poor)', 'भाडेकरू (Tenants)'],
    requiredDocs: {
      mr: ['कुटुंबाचे आधार कार्ड आणि पॅन कार्ड', 'उत्पन्नाचा दाखला (तहसीलदार अथवा वेतन स्लिप)', 'भारतात कुठेही स्वतःच्या मालकीचे पक्के घर नसल्याचे प्रतिज्ञापत्र', 'पुण्यातील वास्तव्याचा पुरावा (मतदार ओळखपत्र / भाडेकरार / रेशन कार्ड)', 'बँक खाते तपशील'],
      hi: ['आधार कार्ड और पैन कार्ड', 'आय प्रमाण पत्र (तहसीलदार / वेतन पर्ची)', 'भारत में पक्का मकान न होने का शपथ पत्र', 'पुणे में निवास प्रमाण', 'बैंक विवरण'],
      en: ['Aadhaar and PAN Card', 'Income Certificate (< ₹3,00,000/yr)', 'Affidavit confirming no pucca house owned anywhere in India', 'Pune residence proof', 'Bank account details']
    },
    applicationUrl: 'https://pmaymis.gov.in'
  },
  {
    id: 'scheme-mjpjay',
    title: {
      mr: 'महात्मा ज्योतिराव फुले जन आरोग्य योजना (MJPJAY)',
      hi: 'महात्मा ज्योतिराव फुले जन आरोग्य योजना',
      en: 'Mahatma Jyotirao Phule Jan Arogya Yojana'
    },
    department: {
      mr: 'सार्वजनिक आरोग्य विभाग, महाराष्ट्र शासन',
      hi: 'सार्वजनिक स्वास्थ्य विभाग, महाराष्ट्र',
      en: 'Public Health Department, GoM'
    },
    description: {
      mr: 'गंभीर आजारांवर शासनमान्य खासगी व सरकारी रुग्णालयात पूर्णपणे मोफत दर्जेदार शस्त्रक्रिया व उपचार.',
      hi: 'गंभीर बीमारियों के लिए सरकारी व अधिकृत निजी अस्पतालों में पूर्णतः मुफ्त इलाज.',
      en: 'Cashless quality medical and surgical treatment for serious illnesses in empanelled hospitals.'
    },
    benefit: {
      mr: 'कुटुंबासाठी प्रति वर्ष ₹५,००,०००/- पर्यंत मोफत कॅशलेस उपचार व शस्त्रक्रिया',
      hi: 'प्रति परिवार प्रति वर्ष ₹५ लाख तक का कैशलेस स्वास्थ्य सुरक्षा कवर',
      en: 'Up to ₹5,00,000 cashless health coverage per family per year'
    },
    targetGroup: ['पिवळे/केशरी रेशन कार्ड धारक', 'शेतकरी कुटुंब', 'सर्व नागरिक'],
    requiredDocs: {
      mr: ['पिवळे किंवा केशरी रेशन कार्ड', 'आधार कार्ड / मतदार ओळखपत्र', 'अधिकृत रुग्णालयातील डॉक्टरचे रोगनिदान पत्र', 'कुटुंब प्रमुख व रुग्णाचा फोटो'],
      hi: ['पीला या केसरिया राशन कार्ड', 'आधार कार्ड / मतदाता पहचान पत्र', 'अस्पताल द्वारा जारी रोग निदान पर्ची', 'रोगी व परिवार का फोटो'],
      en: ['Yellow or Saffron Ration Card', 'Aadhaar Card / Voter ID', 'Doctor diagnosis prescription from network hospital', 'Patient photograph']
    },
    applicationUrl: 'https://www.jeevandayee.gov.in'
  },
  {
    id: 'scheme-shravanbal',
    title: {
      mr: 'श्रावणबाळ सेवा राज्य निवृत्तीवेतन योजना',
      hi: 'श्रावणबाल सेवा राज्य पेंशन योजना',
      en: 'Shravanbal Seva State Pension Scheme'
    },
    department: {
      mr: 'महसूल व सामाजिक न्याय विभाग, पुणे',
      hi: 'राजस्व एवं सामाजिक न्याय विभाग, पुणे',
      en: 'Revenue & Social Welfare Dept, Pune'
    },
    description: {
      mr: '६५ वर्षे व त्यावरील वयोवृद्ध नागरिकांना वृद्धापकाळात सन्मानाने जगण्यासाठी नियमित मासिक निवृत्तीवेतन.',
      hi: '65 वर्ष और उससे अधिक आयु के वरिष्ठ नागरिकों के लिए नियमित मासिक पेंशन.',
      en: 'Regular monthly pension for senior citizens aged 65 and above for dignified living.'
    },
    benefit: {
      mr: 'दरमहा ₹१,५००/- थेट बँक खात्यात जमा',
      hi: 'प्रति माह ₹१,५००/- सीधे बैंक खाते में',
      en: '₹1,500 per month deposited directly into beneficiary bank account'
    },
    minAge: 65,
    maxIncome: 21000,
    targetGroup: ['ज्येष्ठ नागरिक (Senior Citizens 65+)'],
    requiredDocs: {
      mr: ['वयाचा दाखला (शाळा सोडल्याचा दाखला / वैद्यकीय प्रमाणपत्र / मतदान कार्ड)', 'वार्षिक उत्पन्न २१,००० रुपयांपेक्षा कमी असल्याचा तहसीलदारांचा दाखला (किंवा BPL यादी नोंद)', 'महाराष्ट्रात किमान १५ वर्षे वास्तव्याचा पुरावा', 'आधार कार्ड व बँक खाते पासबुक झेरॉक्स'],
      hi: ['आयु प्रमाण पत्र (65+ वर्ष)', 'वार्षिक आय प्रमाण पत्र (< ₹21,000)', 'महाराष्ट्र अधिवास प्रमाण', 'आधार कार्ड और बैंक पासबुक'],
      en: ['Proof of age (School LC / Voter card / Medical certificate showing 65+)', 'Income certificate from Tahsildar (< ₹21,000/yr or BPL list entry)', 'Maharashtra domicile proof (15 yrs)', 'Aadhaar Card and Bank Passbook copy']
    },
    applicationUrl: 'https://sjsa.maharashtra.gov.in'
  },
  {
    id: 'scheme-annapurna',
    title: {
      mr: 'मुख्यमंत्री अन्नपूर्णा योजना (मोफत ३ गॅस सिलिंडर)',
      hi: 'मुख्यमंत्री अन्नपूर्णा योजना (मुफ्त 3 गैस सिलेंडर)',
      en: 'CM Annapurna Free LPG Cylinders Scheme'
    },
    department: {
      mr: 'अन्न व नागरी पुरवठा व ग्राहक संरक्षण विभाग',
      hi: 'खाद्य एवं नागरिक आपूर्ति विभाग',
      en: 'Food, Civil Supplies & Consumer Protection Dept'
    },
    description: {
      mr: 'लाडकी बहीण योजनेच्या लाभार्थी महिलांना आणि पात्र शिधापत्रिकाधारक कुटुंबांना वर्षाला ३ एलपीजी सिलिंडर मोफत.',
      hi: 'पात्र राशन कार्ड धारक एवं लाडकी बहिन योजना की लाभार्थी महिलाओं को वर्ष में 3 गैस सिलेंडर मुफ्त.',
      en: '3 free LPG cylinders per year for eligible ration card holders and Ladki Bahin beneficiaries.'
    },
    benefit: {
      mr: 'वर्षाला ३ एलपीजी गॅस सिलिंडरची रक्कम थेट बँक खात्यात परतावा (Reimbursement)',
      hi: 'प्रति वर्ष 3 एलपीजी सिलेंडर का भुगतान सीधे बैंक खाते में रिफंड',
      en: 'Direct bank transfer reimbursement for 3 LPG gas cylinders annually'
    },
    targetGroup: ['महिला (Women)', 'रेशन कार्ड धारक', 'लाडकी बहीण लाभार्थी'],
    requiredDocs: {
      mr: ['सक्रिय एलपीजी गॅस जोडणी पासबुक (ग्राहक क्रमांक)', 'आधार कार्ड जोडलेले बँक खाते (Aadhaar Seeded)', 'रेशन कार्ड झेरॉक्स', 'मोबाईल नंबर'],
      hi: ['गैस कनेक्शन पासबुक (उपभोक्ता संख्या)', 'आधार लिंक बैंक खाता', 'राशन कार्ड प्रति', 'मोबाइल नंबर'],
      en: ['Active LPG Gas connection passbook (Customer ID)', 'Aadhaar-seeded bank account', 'Ration card copy', 'Mobile number']
    },
    applicationUrl: 'https://mahafood.gov.in'
  }
];
