# MEMORY: Nagrik Mitra (living log)

> Agents: append here after every task. Newest entries at the bottom. Keep it factual and short.

## Project facts
- Name: Nagrik Mitra. City: Pune. Languages: Marathi, Hindi (+ English UI).
- Categories: pothole, garbage, ration_card, other (fallback).
- Stack: Stitch (design) -> Antigravity (frontend) -> Cursor (backend) -> Supabase (DB) -> Render (backend) + Vercel (frontend).
- Backend: FastAPI + WeasyPrint (Docker on Render). Frontend: Vite + React + TS + Tailwind + react-leaflet.
- Design System: Google Stitch Project `18435860108530741254` ("Nagrik Mitra Voice Complaint App").

## Decisions
| Date | Decision | Reason |
|---|---|---|
| (start) | WeasyPrint for PDF | Correct Devanagari shaping |
| (start) | Render via Docker | Pango libs needed |
| (start) | Web Speech API first, Groq Whisper fallback | Free and fast, with safety net |
| (start) | Public reads via `public_complaints` view | Hide PII |
| 2026-10-09 | Lock backend contract & PII boundaries | Protect citizen data and finalize interface before code implementation |
| 2026-10-09 | `complaint-pdfs` bucket private + signed URLs | Complaint PDFs contain name, phone, address; direct public URLs leak citizen PII |
| 2026-10-09 | Drop `pdf_url` from `public_complaints` view | Prevent public dashboard scraping of citizen complaint letters |
| 2026-10-09 | Short-lived signed URLs for PDF download | `POST /complaints` returns 15m signed URL; `GET /complaints/{id}/pdf` redirects to 60s signed URL |
| 2026-10-09 | Reject `category=other` on submit (HTTP 422) | Only `pothole`, `garbage`, and `ration_card` can be filed; avoids fake department FK rows |
| 2026-10-09 | Add `POST /api/geo/resolve` + ignore client ward | Frontend previews ward on pin drag; server recomputes ward on submit to prevent tampering |
| 2026-10-09 | Default-deny & explicit REVOKE on raw PII tables | `complaints` and `status_events` revoked from anon, authenticated, and public; view used exclusively |
| 2026-10-09 | Localized document checklist `[{en, mr, hi}, ...]` | Database seed is single source of truth; localized strings returned by citizen's chosen language |
| 2026-10-09 | Enrich ward stats & add `/stats/summary` | Dashboard needs ward coordinates + all 5 status counts + top-level KPI summary tiles |
| 2026-10-09 | Non-blocking PDF failure + `/pdf/regenerate` | If WeasyPrint fails, complaint is saved with `pdf_url: null` and citizen can retry without losing submission |
| 2026-10-09 | 25 km Pune boundary cutoff | Nearest ward farther than 25 km sets `ward_id = null` rather than forcing incorrect municipal assignment |
| 2026-10-09 | SSRF allowlist on image fetching | Backend downloads only from authorized Supabase storage endpoint |
| 2026-10-09 | Dropped `address_hint` and email from MVP | Municipal office addresses unverified; email out of MVP to minimize citizen input burden |
| 2026-10-09 | Bundled Noto Sans Devanagari via `file://` URIs | Guarantees consistent glyph rendering for complex Marathi/Hindi conjuncts |

## Environment (fill as you go)
- Supabase project URL: _TBD_
- Render service URL: _TBD_
- Vercel URL: _TBD_
- Stitch Project ID: `18435860108530741254` (Nagrik Mitra Voice Complaint App)

## Gotchas / lessons
- **Devanagari PDF Rendering**: WeasyPrint requires runtime font path resolution (`file://`) and system packages `libpango-1.0-0`, `libpangoft2-1.0-0`, `libcairo2`, `libharfbuzz0b`, `shared-mime-info`, `fontconfig`.
- **Nominatim Policy**: Must include `CONTACT_EMAIL` in User-Agent, throttle to 1 request/second, and cache coordinates rounded to 4 decimal places.
- **Reference Number Timezone**: Reference numbers must compute the `YYYYMMDD` component using `Asia/Kolkata` time to match Indian citizen filing dates.
- **Foreign Key Safety**: When classification produces `other`, `department_key` must be `"none"` without inserting an invalid row into the database; `POST /complaints` strictly blocks submission of `other`.

## Task log
| Task | Status | Notes |
|---|---|---|
| Contract Lock | [x] Done | Aligned ARCHITECTURE.md, TASKS.md, schema.sql, and MEMORY.md with locked contract, PII isolation, and geo resolution |
| B1–B17 Planning | [x] Done | Backend tasks extended with dependencies, rate limits, regenerate endpoints, and font packages |
| F1–F10 Frontend | [x] Done | Implemented full responsive civic UI in frontend/ with voice recognition, printable PMC letter, ward map dashboard, and scheme navigator |

## Open questions
- Which LLM provider will be active for first deployment: Gemini or Claude? (set `LLM_PROVIDER` in Render environment)
- Verify official PMC department contact numbers prior to production launch (demo uses approximate ward centroids).
