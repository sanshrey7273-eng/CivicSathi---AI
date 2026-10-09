import type { Complaint, Language, WardStat } from '../types';
import { DEPARTMENTS, INITIAL_COMPLAINTS, INITIAL_WARD_STATS, PUNE_WARDS } from '../data/mockData';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface ClassifyResult {
  category: 'pothole' | 'garbage' | 'ration_card' | 'other';
  confidence: number;
  department_key: string;
  department_name: string;
  severity: 'low' | 'medium' | 'high';
  summary_en: string;
  summary_local: string;
  documents: string[];
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
  let category: 'pothole' | 'garbage' | 'ration_card' | 'other' = 'pothole';
  let depKey = 'pmc_road';

  if (lower.includes('कचरा') || lower.includes('घाण') || lower.includes('डंप') || lower.includes('garbage') || lower.includes('trash') || lower.includes('waste')) {
    category = 'garbage';
    depKey = 'pmc_swm';
  } else if (lower.includes('रेशन') || lower.includes('राशन') || lower.includes('शिधापत्रिका') || lower.includes('ration') || lower.includes('धान्य') || lower.includes('अन्न')) {
    category = 'ration_card';
    depKey = 'food_civil_supplies';
  } else if (lower.includes('खड्डा') || lower.includes('खड्डे') || lower.includes('गड्ढा') || lower.includes('रस्ता') || lower.includes('road') || lower.includes('pothole')) {
    category = 'pothole';
    depKey = 'pmc_road';
  }

  const dept = DEPARTMENTS[depKey];
  const langKey = lang === 'en' ? 'en' : lang === 'hi' ? 'hi' : 'mr';

  return {
    category,
    confidence: 0.94,
    department_key: depKey,
    department_name: dept.name[langKey],
    severity: 'high',
    summary_en: `Civic issue identified regarding ${category} requiring immediate municipal attention.`,
    summary_local: lang === 'hi'
      ? `नागरिक द्वारा दर्ज शिकायत: ${text.slice(0, 100)}...`
      : `नागरिकाने नोंदवलेली समस्या: ${text.slice(0, 100)}...`,
    documents: dept.docs[langKey]
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

export async function fetchStats(): Promise<{ wards: WardStat[]; total: number; resolved: number; pending: number }> {
  try {
    const res = await fetch(`${API_BASE}/stats/wards`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const wards: WardStat[] = await res.json();
      const total = wards.reduce((acc, w) => acc + w.total, 0);
      const resolved = wards.reduce((acc, w) => acc + w.by_status.resolved, 0);
      return {
        wards,
        total,
        resolved,
        pending: total - resolved
      };
    }
  } catch {
    // Fallback to initial stats
  }

  const wards = INITIAL_WARD_STATS;
  const total = wards.reduce((acc, w) => acc + w.total, 0);
  const resolved = wards.reduce((acc, w) => acc + w.by_status.resolved, 0);

  return {
    wards,
    total,
    resolved,
    pending: total - resolved
  };
}

export async function fetchRecentComplaints(): Promise<Complaint[]> {
  try {
    const res = await fetch(`${API_BASE}/complaints`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Fallback
  }
  return INITIAL_COMPLAINTS;
}
