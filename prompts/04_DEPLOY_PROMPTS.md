# 04 DEPLOY (Supabase -> Render -> Vercel)

## D1: Supabase (manual)
1. New project -> SQL editor -> paste `supabase/schema.sql` -> Run.
2. Storage -> create **public** buckets: `complaint-images`, `complaint-pdfs`.
3. Settings -> API: copy `Project URL`, `anon key`, `service_role key` (service role is backend-only, never in frontend).

## D2: Render (backend)
1. Push repo to GitHub.
2. Render -> New -> Web Service -> connect repo -> **Root directory `backend`**, Runtime **Docker**.
3. Health check path: `/api/health`. Plan: Free.
4. Env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `LLM_PROVIDER`, `GEMINI_API_KEY` (or `ANTHROPIC_API_KEY`), `GROQ_API_KEY`, `ADMIN_KEY`, `ALLOWED_ORIGINS` (add Vercel URL later), `PDF_BUCKET`, `IMAGE_BUCKET`, `CONTACT_EMAIL`.
5. Deploy, then open `https://<service>.onrender.com/api/health`.
6. Free tier sleeps after inactivity. Open health URL 2 minutes before demo.

## D3: Vercel (frontend)
1. New Project -> import repo -> **Root directory `frontend`**, framework Vite.
2. Env vars: `VITE_API_BASE_URL=https://<service>.onrender.com/api`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
3. Add `frontend/vercel.json`:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```
4. Deploy. Copy the Vercel URL.

## D4: Connect them
1. Render -> `ALLOWED_ORIGINS=https://<your-app>.vercel.app,http://localhost:5173` -> redeploy.
2. Test full flow on phone (mic needs HTTPS, Vercel gives it).

## Prompt: deploy review (Cursor or Antigravity)
```
@docs/ARCHITECTURE.md @docs/RULES.md
Review the repo for deployment readiness: backend Dockerfile, render.yaml, env var usage, CORS, frontend build, vercel.json rewrites, hardcoded localhost URLs, secrets in git. Output a checklist table (item, status, fix). Do not change code unless I say so.
```

## Prompt: post-deploy smoke test
```
Write scripts/smoke_test.py that, given API_BASE, calls /health, /classify (Marathi pothole sentence), creates a complaint at Pune coordinates, fetches it, downloads the PDF and asserts it is a valid PDF over 10 KB. Print PASS/FAIL per step.
```

## Troubleshooting
| Problem | Fix |
|---|---|
| PDF has boxes / broken Marathi | Fonts not found: check absolute font path inside Docker, `fonts-noto-core` installed |
| CORS error in browser | `ALLOWED_ORIGINS` must match exact Vercel origin (no trailing slash) |
| First request very slow | Render cold start: warm-up ping, open health URL before demo |
| Mic not working | Needs HTTPS and Chrome; check site permission |
| Map tiles missing / marker icon broken | Leaflet CSS import + fix default icon paths in Vite |
| 401/permission from Supabase | Backend must use service role key; frontend reads view with anon key |
