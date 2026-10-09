# RULES: Nagrik Mitra (for all AI coding agents)

Read this file before every task. Also copy into `.cursor/rules/nagrik.mdc` (Cursor) and the Antigravity rules/workspace rules.

## General
1. Read `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/TASKS.md`, `docs/MEMORY.md` before coding.
2. Do ONE task at a time from `TASKS.md`. Do not start the next task.
3. Stay in MVP scope: only `pothole`, `garbage`, `ration_card` (+ `other` fallback). No extra features.
4. After each task: update the checkbox in `TASKS.md` and append to `MEMORY.md` (what was done, decisions, gotchas, env vars added).
5. Never invent API fields. The API contract in `ARCHITECTURE.md` is the source of truth. If a change is needed, edit ARCHITECTURE.md first and note it in MEMORY.md.
6. Never hardcode secrets. Use env vars and update `.env.example`.
7. Keep changes small and runnable. After each task, the app must start without errors.
8. Ask for clarification instead of guessing when requirements conflict.

## Backend (Cursor)
- Python 3.11, FastAPI, Pydantic v2, type hints everywhere.
- Async endpoints; blocking work (WeasyPrint) in `run_in_threadpool`.
- One responsibility per module (routers thin, logic in `services/`).
- All LLM output must be validated by Pydantic; retry once; then fallback.
- Supabase service role key is backend-only.
- Never return phone/email in public endpoints.
- Return consistent errors: `{ "error": { "code": "...", "message": "..." } }`.
- Add a pytest for every service (mock external APIs).
- Respect Nominatim policy: custom User-Agent, max 1 request/sec, cache results.
- PDF: use bundled Noto Sans Devanagari via `@font-face` with local file path. Never rely on system fonts.

## Frontend (Antigravity)
- Vite + React + TypeScript + Tailwind. Leaflet via `react-leaflet`.
- Follow the Stitch export for layout, spacing and tokens. Do not redesign.
- i18n: all UI strings in `src/i18n/{mr,hi,en}.json`. No hardcoded text.
- Mobile-first (360 px base). Touch targets at least 44 px.
- API calls only through `src/lib/api.ts`. Base URL from `VITE_API_BASE_URL`.
- Show loading, error and empty states for every async view.
- Mic UX: big button, clear listening state, editable transcript, typed fallback.
- Accessibility: labels, contrast, focus states.
- No secrets in frontend except the Supabase anon key.

## Database
- All schema changes go into `supabase/schema.sql` (idempotent: `if not exists`).
- RLS enabled on all tables. Public access via view only.

## Git
- Small commits, message format: `feat(scope): ...`, `fix(scope): ...`, `docs: ...`.
- Branch per phase optional; `main` must always deploy.

## Definition of done (per task)
- Runs locally, acceptance criteria in TASKS.md met, no console/server errors, TASKS.md and MEMORY.md updated.
