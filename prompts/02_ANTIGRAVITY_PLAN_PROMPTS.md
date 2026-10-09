# 02 ANTIGRAVITY PLAN PROMPTS (frontend)

Pehle **A0 (plan)** Antigravity mein daalo (Planning mode). Plan approve hone ke baad **Stitch zip upload** karo, phir A1 se aage ek-ek.
Hamesha attach: `@docs/RULES.md @docs/DESIGN.md @docs/ARCHITECTURE.md @docs/TASKS.md @docs/MEMORY.md`.

---

## A0: Master plan (paste this FIRST, before uploading the Stitch zip)
```
You are the frontend engineer for "Nagrik Mitra". Read docs/PRD.md, docs/ARCHITECTURE.md, docs/DESIGN.md, docs/RULES.md, docs/TASKS.md and docs/MEMORY.md fully.

Create a detailed implementation plan ONLY (no code yet) for the frontend in /frontend, covering tasks F1 to F10 in docs/TASKS.md. Stack: Vite + React + TypeScript + Tailwind + react-router + react-leaflet. I will upload the Stitch design export zip right after you approve this plan; the plan must include a step that uses that export as the visual source of truth.

For each task F1..F10 give: goal, files to create/modify, components, API calls used (from the contract in ARCHITECTURE.md), edge cases, and acceptance criteria. Also give: folder structure, routing table, state management approach (keep it simple: React context + hooks), i18n approach, and a list of risks (mic permission, Web Speech API support, Leaflet in React, CORS, Render cold start).

Output the plan as an artifact and wait for my approval. Do not write code.
```

---
## After plan approved: upload Stitch zip
- Zip ko `design/stitch-export/` mein extract karo (ya chat mein attach).

## A1 (F1): Import Stitch + scaffold
```
@docs/RULES.md @docs/DESIGN.md @docs/TASKS.md @docs/MEMORY.md
Task F1 only.
I have uploaded the Stitch export at design/stitch-export/. 
1. Inspect the export: list screens, colors, fonts, spacing, components you find.
2. Scaffold /frontend with Vite + React + TypeScript + Tailwind + react-router-dom + react-leaflet + leaflet.
3. Put the design tokens into tailwind.config (colors, radius, fonts) matching the Stitch export and docs/DESIGN.md.
4. Create routes (placeholder pages that match the Stitch screens): / (home), /listen, /review, /result, /location, /success/:id, /dashboard, /complaint/:id.
5. Build shared layout (header with language toggle placeholder, mobile container max-w 480 center on desktop).
6. Add .env.example for VITE_ variables.
Do not implement logic yet. Stop after F1. Update TASKS.md (F1) and MEMORY.md. Tell me how to run it.
```

## A2 (F2): i18n
```
@docs/RULES.md @docs/MEMORY.md
Task F2 only. Add lightweight i18n (react-i18next or a small custom context) with src/i18n/mr.json, hi.json, en.json. Move every UI string seen in design/stitch-export into these files (keep the exact Marathi text from Stitch; write Hindi equivalents). Add the language toggle (persist in localStorage, default mr). Update the Devanagari font loading (Noto Sans Devanagari via Google Fonts or @fontsource). Acceptance: switching language updates all visible text on all placeholder pages; no hardcoded strings remain.
```

## A3 (F3): API client + types
```
@docs/RULES.md @docs/ARCHITECTURE.md @docs/MEMORY.md
Task F3 only. Create src/lib/api.ts and src/types/api.ts that exactly match the API contract in ARCHITECTURE.md (health, transcribe, classify, upload/image, createComplaint, listComplaints, getComplaint, wardStats). Use fetch with VITE_API_BASE_URL, typed errors for the format {error:{code,message}}, 20s timeout, one retry on network failure. Add a warmUp() that pings /health on app start (Render cold start). Add a mock mode (VITE_USE_MOCK=true) returning realistic Marathi sample data so I can build UI without the backend. Acceptance: all functions typed; mock mode works for every endpoint.
```

## A4 (F4): Home + voice
```
@docs/RULES.md @docs/DESIGN.md @docs/MEMORY.md
Task F4 only. Build the Home and Listening screens exactly like Stitch. Implement a useSpeechRecognition hook using the Web Speech API (webkitSpeechRecognition) with lang mr-IN or hi-IN based on the selected language, interim results, stop/restart, and error handling (not-allowed, no-speech, unsupported). If unsupported or it fails, show the typed-input fallback and a "record audio" fallback that records with MediaRecorder and sends to POST /transcribe. Store the transcript in a ComplaintDraft context (transcript, lang, imageUrl, classification, location, citizen). Acceptance: speaking Marathi shows live text; Stop moves to /review with transcript; typed fallback works.
```

## A5 (F5): Photo
```
@docs/RULES.md @docs/MEMORY.md
Task F5 only. Add photo capture/upload (input type=file accept=image/* capture=environment), client-side compress to max 1280 px and about 500 KB, preview with remove, upload via POST /upload/image, store image_url in ComplaintDraft. Home "Take a photo" goes to /review with the photo. Acceptance: photo-only complaints can proceed (transcript may be empty); errors show a toast.
```

## A6 (F6): Review + Result
```
@docs/RULES.md @docs/DESIGN.md @docs/MEMORY.md
Task F6 only. Build /review (editable transcript, photo thumb, Analyze button) and /result (category chip with icon, severity badge, department card, summary in the selected language, documents checklist with checkboxes). Analyze calls POST /classify, shows skeleton loading, handles needs_more_info (show follow_up_question with a text input and re-call) and category "other" (friendly unsupported message with option to edit). Add a manual category override dropdown as safety net. Acceptance: all three categories display correctly with mock data; unsupported state works.
```

## A7 (F7): Location + details
```
@docs/RULES.md @docs/DESIGN.md @docs/MEMORY.md
Task F7 only. Build /location with react-leaflet (OSM tiles, correct default marker icons, fix Leaflet icon import issue in Vite), draggable pin, "Use my location" via navigator.geolocation (handle denied), default center Pune (18.5204, 73.8567). Show detected address and ward (from backend later; for now display coordinates and a placeholder). Add name (required) and phone (10-digit Indian mobile validation) inputs. Save to ComplaintDraft. Acceptance: pin drag updates lat/lng; validation messages in selected language; works on mobile width.
```

## A8 (F8): Submit + Success
```
@docs/RULES.md @docs/DESIGN.md @docs/MEMORY.md
Task F8 only. Implement submit: POST /complaints with the contract body, disable button while loading, handle errors with retry. Build /success/:id: reference number with copy button, "Download PDF" (open pdf_url), "Share on WhatsApp" (wa.me link with text containing ref no and tracking URL), "Track status" link, small PDF preview (iframe or image fallback). Clear the draft after success. Acceptance: full flow home -> success works end to end with mock mode.
```

## A9 (F9): Dashboard + track
```
@docs/RULES.md @docs/DESIGN.md @docs/MEMORY.md
Task F9 only. Build /dashboard: filters (ward, status, category), Leaflet map with marker clustering (react-leaflet-cluster) colored by status, stat tiles, ward table from GET /stats/wards, recent complaints list from GET /complaints. Build /complaint/:id with status timeline, map pin, photo, PDF link. Auto-refresh every 30 s. Never display phone or name. Acceptance: filters work together; map and table stay in sync; empty and error states handled.
```

## A10 (F10): Polish
```
@docs/RULES.md @docs/DESIGN.md @docs/MEMORY.md
Task F10 only. Polish: consistent loading/error/empty states, toasts, reduced-motion support, focus states, aria labels, check contrast, test at 360, 414 and 1280 px, fix layout bugs versus Stitch screenshots, add a favicon and page titles, add the warm-up ping on app start with a subtle "waking up server" hint if /health takes more than 3 s. Add a README in /frontend with run and env instructions. Final: run `npm run build` and fix all type errors and warnings. Update TASKS.md and MEMORY.md.
```

## A11 (optional): Compare with Stitch
```
Open each route at 390 px width and compare against the screenshots in design/stitch-export. List visual differences (spacing, colors, typography, icons) as a table with severity. Fix only high-severity items.
```
