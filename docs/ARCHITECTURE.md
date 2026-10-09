# ARCHITECTURE: Nagrik Mitra

## 1. Stack
| Layer | Tool | Role |
|---|---|---|
| UI design | **Google Stitch** | Screens and export (zip) |
| Frontend | **Antigravity** | Builds React app from Stitch export |
| Backend | **Cursor** | FastAPI service |
| Database | **Supabase** | Postgres + Storage |
| Backend deploy | **Render** (Docker web service) | Needed for WeasyPrint system libs |
| Frontend deploy | **Vercel** | Static/Vite hosting |

Other: Leaflet + OpenStreetMap (map), Nominatim (reverse geocode), Web Speech API (voice), Groq Whisper (fallback STT), Gemini or Claude API (classification, drafting, vision), WeasyPrint (PDF).

## 2. System diagram
```
[Citizen Browser (Vercel)]
   | mic (Web Speech API) / photo / GPS
   v
[React + Vite + Leaflet] ---- REST ----> [FastAPI on Render]
   |                                        |-- /transcribe  -> Groq Whisper (fallback)
   | public reads (anon key, view only)     |-- /classify    -> LLM (JSON mode)
   v                                        |-- /complaints  -> Supabase (service role)
[Supabase: Postgres + Storage] <------------|-- PDF (WeasyPrint) -> Storage bucket
```

## 3. Repo layout (monorepo)
```
nagrik-mitra/
  docs/                 # these files
  frontend/             # Antigravity output (Vite + React + TS)
  backend/              # Cursor output (FastAPI)
    app/
      main.py
      config.py
      deps.py
      routers/ (health, transcribe, classify, complaints, stats)
      services/ (llm.py, stt.py, pdf.py, geo.py, storage.py, db.py)
      schemas/ (classify.py, complaint.py)
      templates/complaint_mr.html, complaint_hi.html, base.css
      fonts/NotoSansDevanagari-Regular.ttf, NotoSansDevanagari-Bold.ttf
      data/departments.json
    tests/
    Dockerfile
    requirements.txt
  supabase/schema.sql
```

## 4. Data model (Supabase Postgres)
See `supabase/schema.sql`. Tables:
- `departments` (key, name_en, name_mr, name_hi, address_hint, docs jsonb)
- `wards` (id, name, lat, lng) approximate centroids for nearest-ward matching
- `complaints` (id uuid, ref_no, category, department_key, lang, transcript, summary_en, summary_local, severity, lat, lng, address, ward_id, image_url, pdf_url, citizen_name, citizen_phone, status, created_at)
- `status_events` (id, complaint_id, status, note, created_at)
- View `public_complaints` (no phone/name/email) for anon reads.

Status enum: `submitted`, `in_review`, `in_progress`, `resolved`, `rejected`.

## 5. API contract
Base: `https://<render-app>.onrender.com/api`

| Method | Path | Body / Query | Response |
|---|---|---|---|
| GET | `/health` | | `{status:"ok"}` |
| POST | `/transcribe` | multipart `audio`, `lang` (mr/hi) | `{text}` |
| POST | `/classify` | `{text?, image_url?, lang}` | Classification (below) |
| POST | `/complaints` | Submission (below) | `{id, ref_no, pdf_url}` |
| GET | `/complaints` | `ward_id?, status?, category?` | list (public fields) |
| GET | `/complaints/{id}` | | public detail + status_events |
| GET | `/complaints/{id}/pdf` | | redirect to signed/public PDF URL |
| PATCH | `/complaints/{id}/status` | header `X-Admin-Key`, `{status, note}` | updated row |
| GET | `/stats/wards` | | `[{ward_id, name, total, by_status:{}}]` |
| POST | `/upload/image` | multipart `file` | `{url}` |

### Classification response
```json
{
  "category": "pothole | garbage | ration_card | other",
  "confidence": 0.0,
  "department_key": "pmc_road | pmc_swm | food_civil_supplies | none",
  "severity": "low | medium | high",
  "summary_en": "string",
  "summary_local": "string in citizen language",
  "documents": ["string"],
  "needs_more_info": false,
  "follow_up_question": null
}
```

### Submission body
```json
{
  "lang": "mr",
  "transcript": "...",
  "category": "pothole",
  "department_key": "pmc_road",
  "summary_local": "...",
  "summary_en": "...",
  "severity": "high",
  "lat": 18.5204, "lng": 73.8567,
  "address": "optional, server reverse-geocodes if empty",
  "image_url": null,
  "citizen_name": "...", "citizen_phone": "..."
}
```

## 6. Key flows
**Classify:** text (and/or image) -> LLM with system prompt + JSON schema -> validate with Pydantic -> if invalid, retry once -> else keyword fallback (खड्डा/गड्ढा -> pothole, कचरा -> garbage, रेशन -> ration_card) -> attach documents from `departments.json`.

**Submit:** validate -> find ward (nearest centroid, Haversine) -> reverse geocode (Nominatim, cached, 1 req/s, custom User-Agent) -> generate ref_no -> insert complaint -> render HTML template -> WeasyPrint PDF -> upload to bucket `complaint-pdfs` -> update `pdf_url` -> return.

**Dashboard:** frontend reads `GET /complaints` and `/stats/wards` (or Supabase anon on `public_complaints`), Leaflet marker clusters, color by status.

## 7. Security
- Service role key only on backend. Frontend gets anon key only (read view).
- RLS on: anon can `select` only from `public_complaints`; no direct table access.
- CORS: allow only Vercel domain + localhost.
- Admin endpoint guarded by `X-Admin-Key`.
- Rate limit `/classify` and `/complaints` (slowapi), file size/type checks.
- Never log phone numbers.

## 8. Environment variables
Backend (Render): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `LLM_PROVIDER`, `GEMINI_API_KEY` (or `ANTHROPIC_API_KEY`), `GROQ_API_KEY`, `ADMIN_KEY`, `ALLOWED_ORIGINS`, `PDF_BUCKET`, `IMAGE_BUCKET`.
Frontend (Vercel): `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## 9. Deployment notes
- **Render:** use Docker (WeasyPrint needs Pango). Dockerfile base `python:3.11-slim`, install `libpango-1.0-0 libpangoft2-1.0-0 libharfbuzz0b libffi-dev fonts-noto`. Health check path `/api/health`. Free tier sleeps, so ping on app load.
- **Vercel:** root `frontend`, build `npm run build`, output `dist`, add SPA rewrite to `index.html`.
- **Supabase:** run `schema.sql`, create public buckets `complaint-images` and `complaint-pdfs`.
