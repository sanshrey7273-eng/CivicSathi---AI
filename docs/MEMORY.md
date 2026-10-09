# MEMORY: Nagrik Mitra (living log)

> Agents: append here after every task. Newest entries at the bottom. Keep it factual and short.

## Project facts
- Name: Nagrik Mitra. City: Pune. Languages: Marathi, Hindi (+ English UI).
- Categories: pothole, garbage, ration_card, other (fallback).
- Stack: Stitch (design) -> Antigravity (frontend) -> Cursor (backend) -> Supabase (DB) -> Render (backend) + Vercel (frontend).
- Backend: FastAPI + WeasyPrint (Docker on Render). Frontend: Vite + React + TS + Tailwind + react-leaflet.

## Decisions
| Date | Decision | Reason |
|---|---|---|
| (start) | WeasyPrint for PDF | Correct Devanagari shaping |
| (start) | Render via Docker | Pango libs needed |
| (start) | Web Speech API first, Groq Whisper fallback | Free and fast, with safety net |
| (start) | Public reads via `public_complaints` view | Hide PII |

## Environment (fill as you go)
- Supabase project URL: _TBD_
- Render service URL: _TBD_
- Vercel URL: _TBD_

## Gotchas / lessons
- (add here)

## Task log
| Task | Status | Notes |
|---|---|---|
| _none yet_ | | |

## Open questions
- Which LLM provider for classification: Gemini or Claude? (set `LLM_PROVIDER`)
- Final department names and document lists verified? (yes/no)
