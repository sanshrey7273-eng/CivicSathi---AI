# PRD: Nagrik Mitra (Voice-First Civic Complaint & Scheme Navigator)

## 1. One-liner
A citizen speaks (Marathi/Hindi) or photographs a civic problem. The app identifies the category and the right department, lists required documents, geotags the issue, and generates a ready-to-submit complaint PDF. A public dashboard shows complaint status by ward.

## 2. Problem
- Citizens do not know which department handles which issue.
- Portals and forms are in English and long.
- Marathi/Hindi speakers and senior citizens drop off or file with the wrong department.

## 3. Target users
| User | Need |
|---|---|
| Citizen (primary) | Complain by voice in own language, get a PDF to submit |
| Public / journalist / corporator | See ward-wise complaint status |
| Admin (demo only) | Change complaint status |

## 4. MVP scope (strict: 3 complaint types only)
| Category key | Example | Department |
|---|---|---|
| `pothole` | "Maajhya gharajaval rastyat khadda aahe" | PMC Road Department / Ward Office |
| `garbage` | Garbage dumped on roadside | PMC Solid Waste Management |
| `ration_card` | Name/member error in ration card | Food & Civil Supplies Office |

Anything else classifies as `other` and shows "not supported in demo yet" with a polite message.

> Verify official department names and document lists before final demo. Use `supabase/schema.sql` seed data as the single source of truth.

## 5. Core user flow
1. Open app, choose language (मराठी / हिन्दी).
2. Tap mic and speak, or upload/take a photo (or both).
3. Transcript shown, editable.
4. AI returns category, department, summary, severity, required documents.
5. Location: auto GPS, or drag the pin on Leaflet map. Reverse-geocode to address and ward.
6. Citizen enters name and phone (optional email).
7. Submit: complaint saved, reference number generated, PDF generated.
8. Success screen: PDF download, share on WhatsApp, track link.
9. Public dashboard: map with pins, ward-wise counts, status filter.

## 6. Functional requirements
- FR1 Voice input in `mr-IN` and `hi-IN` using Web Speech API; fallback to server Whisper (Groq) if unsupported.
- FR2 Image upload (max 5 MB) to Supabase Storage.
- FR3 LLM classification returns strict JSON (see ARCHITECTURE.md).
- FR4 Required-documents checklist per category.
- FR5 Geotag: lat/lng, address, ward.
- FR6 PDF in citizen language (Marathi/Hindi) with Devanagari rendered correctly.
- FR7 Reference number format `NM-PUNE-YYYYMMDD-XXXX`.
- FR8 Public dashboard (Leaflet markers, ward counts, status).
- FR9 Admin status update (shared secret header, demo only).
- FR10 Public data must never expose phone/email.

## 7. Non-functional requirements
- Mobile-first, works on 4G.
- Classification under 4 s, PDF under 6 s.
- Graceful fallbacks: typed input if mic fails; manual category pick if LLM fails.
- Free-tier friendly (Render free sleeps: add a warm-up ping on app load).

## 8. Out of scope
Auto-submission to PMC systems, login/OTP, payments, more than 3 categories, real-time push notifications.

## 9. Demo script (90 seconds)
1. Speak in Marathi: "माझ्या घराजवळ रस्त्यात मोठा खड्डा आहे".
2. Show transcript, category Pothole, department PMC Road Dept, documents list.
3. Pin appears on the map, ward detected.
4. Download Marathi PDF.
5. Open dashboard: the new pin and the ward count incremented.

## 10. Success metrics (for pitch)
- Time to file: under 60 seconds.
- Right department on first try: 90 percent plus on the 3-category test set.
- 15 test utterances (5 per category, mix of Marathi/Hindi) pass in a row before demo.

## 11. Risks
| Risk | Mitigation |
|---|---|
| Browser speech API fails on stage | Pre-recorded audio upload path + typed fallback |
| LLM returns bad JSON | JSON schema validation and one retry, then keyword fallback |
| Marathi PDF glyph issues | WeasyPrint plus bundled Noto Sans Devanagari, test early |
| Render cold start | Warm-up ping, pre-open the app before demo |
