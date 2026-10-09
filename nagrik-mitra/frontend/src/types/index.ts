export type Language = 'mr' | 'hi' | 'en';

export type ComplaintCategory = 'pothole' | 'garbage' | 'ration_card' | 'other';

export type ComplaintStatus = 'submitted' | 'in_review' | 'in_progress' | 'resolved' | 'rejected';

export type Severity = 'low' | 'medium' | 'high';

export interface Department {
  key: string;
  name: {
    mr: string;
    hi: string;
    en: string;
  };
  office: string;
  docs: {
    mr: string[];
    hi: string[];
    en: string[];
  };
}

export interface Ward {
  id: number;
  name: string;
  lat: number;
  lng: number;
  officeAddress: string;
}

export interface Complaint {
  id: string;
  ref_no: string;
  category: ComplaintCategory;
  department_key: string;
  department_name: string;
  lang: Language;
  transcript: string;
  summary_local: string;
  summary_en: string;
  severity: Severity;
  lat: number;
  lng: number;
  address: string;
  ward_id: number | null;
  ward_name: string;
  image_url: string | null;
  citizen_name: string;
  citizen_phone: string;
  status: ComplaintStatus;
  created_at: string;
  documents: string[];
}

export interface WardStat {
  ward_id: number;
  name: string;
  lat: number;
  lng: number;
  total: number;
  by_status: Record<ComplaintStatus, number>;
}

export interface Scheme {
  id: string;
  title: {
    mr: string;
    hi: string;
    en: string;
  };
  department: {
    mr: string;
    hi: string;
    en: string;
  };
  description: {
    mr: string;
    hi: string;
    en: string;
  };
  benefit: {
    mr: string;
    hi: string;
    en: string;
  };
  minAge?: number;
  maxAge?: number;
  maxIncome?: number; // annual in INR
  targetGroup: string[];
  requiredDocs: {
    mr: string[];
    hi: string[];
    en: string[];
  };
  applicationUrl: string;
}
