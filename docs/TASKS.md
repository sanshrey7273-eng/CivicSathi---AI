# TASKS: Nagrik Mitra

Legend: `[ ]` todo, `[x]` done. Owner: **S** Stitch, **A** Antigravity (frontend), **C** Cursor (backend), **D** deploy/manual.
Rule: one task at a time. Update this file and MEMORY.md after each.

## Phase 0: Setup (manual, you)
- [ ] 0.1 (D) Create Supabase project, run `supabase/schema.sql`, create buckets `complaint-images`, `complaint-pdfs` (public)
- [ ] 0.2 (D) Get API keys: Gemini (or Anthropic), Groq
- [ ] 0.3 (D) Create GitHub repo, add `docs/`, push
- [ ] 0.4 (S) Generate screens in Stitch using `prompts/01_STITCH_PROMPTS.md`, export zip

## Phase 1: Backend (Cursor), see `prompts/03_CURSOR_BACKEND_PROMPTS.md`
- [ ] B1 (C) Project scaffold, config, health endpoint, CORS, error format
- [ ] B2 (C) Supabase client + DB service + seed data load (departments, wards)
- [ ] B3 (C) Pydantic schemas for classify and complaint
- [ ] B4 (C) LLM service: classification (text) with JSON validation, retry, keyword fallback
- [ ] B5 (C) LLM vision: classify from image (+ optional text)
- [ ] B6 (C) `/classify` router + documents checklist attach
- [ ] B7 (C) STT service (Groq Whisper) + `/transcribe`
- [ ] B8 (C) Storage service + `/upload/image`
- [ ] B9 (C) Geo service: Haversine ward match + Nominatim reverse geocode with cache
- [ ] B10 (C) PDF service: Marathi/Hindi templates, bundled fonts, WeasyPrint
- [ ] B11 (C) `/complaints` POST: ref no, insert, PDF, upload, return
- [ ] B12 (C) `/complaints` GET list/detail, PDF redirect, public-field filtering
- [ ] B13 (C) Admin status PATCH + status_events
- [ ] B14 (C) `/stats/wards`
- [ ] B15 (C) Rate limiting, validation hardening, logging hygiene
- [ ] B16 (C) Tests + seed script for 15 demo utterances
- [ ] B17 (C) Dockerfile + render.yaml + README for backend

## Phase 2: Frontend (Antigravity), see `prompts/02_ANTIGRAVITY_PLAN_PROMPTS.md`
- [ ] F1 (A) Import Stitch zip, scaffold Vite React TS Tailwind, tokens, routing
- [ ] F2 (A) i18n (mr, hi, en) + language toggle
- [ ] F3 (A) API client (`src/lib/api.ts`) + types matching the contract
- [ ] F4 (A) Home + MicButton + Web Speech API hook + typed fallback
- [ ] F5 (A) Photo capture/upload + preview
- [ ] F6 (A) Review + Result screens (classify call, department, documents)
- [ ] F7 (A) Location screen with Leaflet draggable pin + GPS + citizen details
- [ ] F8 (A) Submit flow + Success screen (PDF download, WhatsApp share)
- [ ] F9 (A) Dashboard (map clusters, ward table, filters) + detail/track page
- [ ] F10 (A) Polish: loading/error/empty states, warm-up ping, a11y, responsive check

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
