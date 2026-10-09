# TASKS: Nagrik Mitra

Legend: `[ ]` todo, `[x]` done. Owner: **S** Stitch, **A** Antigravity (frontend), **C** Cursor (backend), **D** deploy/manual.
Rule: one task at a time. Update this file and MEMORY.md after each.

## Phase 0: Setup (manual, you)
- [ ] 0.1 (D) Create Supabase project, run `supabase/schema.sql`, create buckets: `complaint-images` (public-read) and `complaint-pdfs` (private)
- [ ] 0.2 (D) Get API keys: Gemini (or Anthropic), Groq
- [ ] 0.3 (D) Create GitHub repo, add `docs/`, push
- [ ] 0.4 (S) Generate screens in Stitch using `prompts/01_STITCH_PROMPTS.md`, export zip

## Phase 1: Backend (Cursor), see `prompts/03_CURSOR_BACKEND_PROMPTS.md`
- [ ] B1 (C) Project scaffold, config, health endpoint (`GET /api/health`), CORS, and standard error envelope (`{"error": {"code": "...", "message": "..."}}`)
  *Dependency:* Python 3.11 environment and base repository structure.
- [ ] B2 (C) Supabase client + DB service + seed data load (departments with i18n docs, wards table) and offline `departments.json` fallback
  *Dependency:* Task B1, live Supabase project configured with `supabase/schema.sql`.
- [ ] B3 (C) Pydantic schemas for classify, complaint, geo resolve, and stats (strict validation: 10-digit Indian phone regex, lat/lng ranges, text length)
  *Dependency:* Task B1 and schemas specified in `docs/ARCHITECTURE.md`.
- [ ] B4 (C) LLM service: text classification with JSON schema enforcement, retry logic, and deterministic Marathi/Hindi keyword fallback
  *Dependency:* Tasks B1, B3, and LLM API credentials (`GEMINI_API_KEY` or `ANTHROPIC_API_KEY`).
- [ ] B5 (C) LLM vision: classify from image (+ optional text) with SSRF host allowlist checking for Supabase bucket URLs
  *Dependency:* Task B4 and vision-capable LLM model configuration.
- [ ] B6 (C) `/classify` router: attach deterministic i18n documents checklist based on citizen language (`mr`, `hi`, `en`); handle `other` category (returns `department_key: "none"`, `documents: []`)
  *Dependency:* Tasks B2, B3, B4, B5.
- [ ] B7 (C) STT service (Groq Whisper `whisper-large-v3-turbo`) + `POST /api/transcribe` with language hints (`mr`, `hi`)
  *Dependency:* Tasks B1, B3, and `GROQ_API_KEY`.
- [ ] B8 (C) Storage service + `POST /api/upload/image` for public images and signed URL generation for private PDFs
  *Dependency:* Tasks B2, B3, and Supabase Storage bucket setup (`complaint-images`, `complaint-pdfs`).
- [ ] B9 (C) Geo service: Haversine nearest Pune ward match (> 25 km returns `ward_id: null`), Nominatim reverse geocode (1 req/s, cache, `CONTACT_EMAIL` in User-Agent), and `POST /api/geo/resolve` endpoint for real-time map pin resolution
  *Dependency:* Tasks B2 (wards table), B3 (schemas).
- [ ] B10 (C) PDF service: Jinja2 Marathi/Hindi templates (`complaint_mr.html`, `complaint_hi.html`), WeasyPrint rendering in threadpool, bundled Noto Sans Devanagari fonts via runtime `file://` URIs
  *Dependency:* Task B1, Jinja2, WeasyPrint system libraries, bundled TTF files in `app/fonts/`.
- [ ] B11 (C) `POST /api/complaints`: reject `category=other` (HTTP 422), recompute ward on server, generate ref no with `Asia/Kolkata` date, insert complaint and `submitted` status event, render PDF; on PDF failure return `{id, ref_no, pdf_url: null, pdf_error: true}` and expose `POST /api/complaints/{id}/pdf/regenerate`
  *Dependency:* Tasks B2, B3, B8, B9, B10.
- [ ] B12 (C) `/complaints` read endpoints: `GET /api/complaints` and `GET /api/complaints/{id}` using `public_complaints` view (no phone/name/raw pdf_url); `GET /api/complaints/{id}/pdf` 307 redirect to a 60-second signed URL
  *Dependency:* Tasks B2, B3, B8, B11.
- [ ] B13 (C) Admin status `PATCH /api/complaints/{id}/status` guarded by `X-Admin-Key` (constant-time compare); insert status_event and return updated public detail (never raw row)
  *Dependency:* Tasks B2, B3, B11, `ADMIN_KEY` environment variable.
- [ ] B14 (C) Stats endpoints: `GET /api/stats/wards` returning ward centroid `lat`, `lng`, total, and breakdown of all 5 status counts; add `GET /api/stats/summary` returning `{total, pending, resolved_last_7_days}` (15s cache)
  *Dependency:* Tasks B2, B3.
- [ ] B15 (C) Rate limiting (SlowAPI: classify 20/min, complaints 5/min, upload 10/min, transcribe 10/min, geo/resolve 30/min), SSRF allowlist on image downloads, PII masking in logs, error envelope validation
  *Dependency:* Tasks B1 through B14.
- [ ] B16 (C) Pytest suite + 15 demo test utterances (5 per category, Marathi/Hindi/Hinglish) + idempotent `scripts/seed_demo.py` for 30 realistic complaints across wards
  *Dependency:* Tasks B4, B6, B9, B11.
- [ ] B17 (C) Dockerfile (installing `libpango-1.0-0`, `libpangoft2-1.0-0`, `libcairo2`, `libharfbuzz0b`, `libffi-dev`, `shared-mime-info`, `fontconfig`, and `fonts-noto-core` fallback) + `render.yaml` + backend README with PDF font verification test
  *Dependency:* Tasks B1, B10, `requirements.txt`.

## Phase 2: Frontend (Antigravity), see `prompts/02_ANTIGRAVITY_PLAN_PROMPTS.md`
- [x] F1 (A) Import Stitch tokens, scaffold Vite React TS with civic design system, tokens, and responsive layout
- [x] F2 (A) i18n support (Marathi, Hindi, English) with language toggle in header
- [x] F3 (A) API client (`src/lib/api.ts`) + TypeScript models matching backend contract with graceful offline fallback
- [x] F4 (A) Voice-First Home + Pulsing Saffron MicButton with Web Speech API hook + one-click sample prompts + typed fallback
- [x] F5 (A) Photo upload with client-side preview, validation, and removal
- [x] F6 (A) Review + Result view with category chips, PMC department cards, and required document checklists
- [x] F7 (A) Location screen with Pune ward centroid selector, GPS button, address input, and citizen contact form
- [x] F8 (A) Submit flow + Success letterhead view + Working A4 print/PDF download + WhatsApp share link + ref number copy
- [x] F9 (A) Public Ward Dashboard with interactive SVG Pune ward map, KPI summary cards, ward table, and recent sanitized complaints
- [x] F10 (A) Government Scheme Navigator with eligibility quiz (Age, Income, Category) and official application links + Status Tracker

## Phase 3: Integration and deploy
- [ ] I1 (D) Deploy backend on Render (Docker), set env vars, test `/api/health`
- [ ] I2 (D) Deploy frontend on Vercel, set env vars, SPA rewrite
- [ ] I3 (D) Set `ALLOWED_ORIGINS` to Vercel URL, redeploy backend
- [ ] I4 (D) End-to-end test of 15 utterances (5 per category, Marathi + Hindi)
- [ ] I5 (D) Verify Marathi PDF on phone and desktop
- [ ] I6 (D) Seed 20 to 30 demo complaints across wards for dashboard
- [ ] I7 (D) Demo rehearsal + fallback recording (video) ready

## Phase 4: Pitch
- [ ] P1 Submission form text, 1-minute pitch, demo video
