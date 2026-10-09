# 03 CURSOR BACKEND PROMPTS (point-wise, one prompt per task)

Setup: copy `docs/RULES.md` to `.cursor/rules/nagrik.mdc` (add frontmatter `alwaysApply: true`). Use Agent mode. One prompt = one chat. Always attach `@docs/RULES.md @docs/ARCHITECTURE.md @docs/TASKS.md @docs/MEMORY.md`.

Footer to add to every prompt (already included below as "Finish"): update TASKS.md checkbox + append MEMORY.md, then stop.

---

## C0: Context loader (run once at the start of each new chat)
```
Read docs/PRD.md, docs/ARCHITECTURE.md, docs/RULES.md, docs/TASKS.md, docs/MEMORY.md. You are the backend engineer for Nagrik Mitra (FastAPI, Supabase, WeasyPrint). Summarize in 6 bullets: stack, API endpoints, categories, rules you must follow, current progress, next task. Do not write code.
```

## B1: Scaffold, config, health
```
Task B1 only. In /backend create a FastAPI app (Python 3.11).
- app/main.py with router prefix /api, lifespan, CORS from ALLOWED_ORIGINS (comma separated).
- app/config.py using pydantic-settings reading all env vars in .env.example.
- app/routers/health.py: GET /api/health -> {"status":"ok"}.
- Global exception handlers returning {"error":{"code","message"}} for validation, HTTP and unexpected errors.
- requirements.txt (fastapi, uvicorn[standard], pydantic-settings, httpx, supabase, weasyprint, jinja2, python-multipart, slowapi, pytest, pytest-asyncio, respx), backend/.env.example, backend/README.md with run instructions.
Acceptance: `uvicorn app.main:app --reload` runs, /api/health returns ok, /docs loads, a 404 and a validation error return the standard error format.
Finish: update TASKS.md (B1) and MEMORY.md. Stop.
```

## B2: Supabase + data layer
```
Task B2 only. Create app/services/db.py with a singleton Supabase client (service role) and typed helper functions: get_department(key), list_departments(), list_wards(), insert_complaint(data), update_complaint(id, data), get_complaint(id), list_public_complaints(filters), insert_status_event(...), get_status_events(complaint_id).
Use the schema in supabase/schema.sql exactly. List endpoints read from the public_complaints view; never select citizen_name or citizen_phone for public reads.
Create app/data/departments.json mirroring the seed in schema.sql (used as offline fallback for documents).
Acceptance: a small script scripts/check_db.py prints departments and wards from the live Supabase; unit tests with mocked client for each helper.
Finish: update TASKS.md (B2) and MEMORY.md. Stop.
```

## B3: Schemas
```
Task B3 only. Create Pydantic v2 models in app/schemas/: ClassifyRequest, ClassifyResponse (exactly the JSON in ARCHITECTURE.md; category and severity as Literal types), ComplaintCreate (exactly the Submission body, with validators: lat in 8..37, lng in 68..98, phone matches ^[6-9]\d{9}$ optional, transcript 3..2000 chars, lang in mr/hi/en), ComplaintPublic (no PII), ComplaintDetail (public + status_events), StatusUpdate, WardStat.
Acceptance: unit tests for validators (valid, invalid phone, out-of-range lat/lng, empty transcript).
Finish: update TASKS.md (B3) and MEMORY.md. Stop.
```

## B4: LLM classification (text)
```
Task B4 only. Create app/services/llm.py with a provider interface and two implementations selected by LLM_PROVIDER: Gemini (google-genai or REST via httpx) and Anthropic (REST via httpx). Implement classify_text(text, lang) -> ClassifyResponse.
- System prompt: classify a civic complaint written in Marathi/Hindi/English (transliterated or Devanagari) into exactly one of pothole, garbage, ration_card, other; map to department_key (pmc_road, pmc_swm, food_civil_supplies, none); severity; write summary_en and summary_local (in the citizen's language, 1 to 2 formal sentences); set needs_more_info + follow_up_question if the text is too vague.
- Force JSON output, parse and validate with ClassifyResponse. On parse/validation failure retry once with the error appended. If still failing or provider errors/timeouts (10 s), use keyword_fallback(text) with Marathi/Hindi/English keywords (खड्डा, खड्डे, गड्ढा, pothole, road; कचरा, घाण, garbage, dump; रेशन, राशन, ration card) and confidence 0.5.
- Keep prompts in app/services/prompts.py.
Acceptance: pytest with mocked HTTP covering valid JSON, bad JSON then good, provider failure -> fallback, and 6 sample sentences (2 per category) via fallback.
Finish: update TASKS.md (B4) and MEMORY.md. Stop.
```

## B5: LLM vision
```
Task B5 only. Extend app/services/llm.py with classify_image(image_url, text, lang). Download the image with httpx (max 5 MB, allowed types jpeg/png/webp), send to the vision-capable model with the same JSON contract. If both image and text are present, combine them; if they conflict, prefer the image and lower confidence. Fall back to classify_text when only text is available or vision fails.
Acceptance: tests with mocked downloads and responses; oversize/invalid type returns a clean error.
Finish: update TASKS.md (B5) and MEMORY.md. Stop.
```

## B6: /classify router
```
Task B6 only. Create app/routers/classify.py: POST /api/classify using ClassifyRequest (text and/or image_url required, lang). Call llm service, then overwrite `documents` from the departments table (fallback departments.json) based on category, so the checklist is deterministic and not LLM-written. If category is other, department_key = none and documents = [].
Add slowapi rate limit 20/min per IP.
Acceptance: curl with Marathi, Hindi and English examples returns correct category, department, documents; request with neither text nor image returns 422 in the standard error format.
Finish: update TASKS.md (B6) and MEMORY.md. Stop.
```

## B7: Speech-to-text fallback
```
Task B7 only. Create app/services/stt.py using Groq Whisper (whisper-large-v3-turbo) via httpx multipart. Create POST /api/transcribe (multipart audio + lang). Accept webm/ogg/mp3/wav/m4a up to 10 MB, pass language hint (mr or hi), return {"text"}. Handle provider errors with a clean 502 in the standard format.
Acceptance: test with mocked Groq; reject wrong content type and oversize files.
Finish: update TASKS.md (B7) and MEMORY.md. Stop.
```

## B8: Storage + image upload
```
Task B8 only. Create app/services/storage.py using Supabase Storage: upload_image(bytes, content_type) -> public URL in IMAGE_BUCKET, upload_pdf(bytes, filename) -> public URL in PDF_BUCKET. Create POST /api/upload/image (multipart file): validate type (jpeg/png/webp), size max 5 MB, sniff magic bytes, random uuid filename, return {"url"}.
Acceptance: tests with a mocked storage client; invalid file rejected.
Finish: update TASKS.md (B8) and MEMORY.md. Stop.
```

## B9: Geo service
```
Task B9 only. Create app/services/geo.py:
- haversine(lat1,lng1,lat2,lng2).
- find_ward(lat,lng): nearest ward from the wards table (cache wards in memory for 10 min); return None if farther than 25 km (outside Pune area).
- reverse_geocode(lat,lng): Nominatim via httpx with User-Agent "NagrikMitra/1.0 (contact: <env CONTACT_EMAIL>)", accept-language mr,hi,en, round coordinates to 4 decimals for an in-memory LRU cache, global limiter of 1 request per second, 5 s timeout, return a short formatted address or None on failure (never raise).
Acceptance: tests for haversine, ward matching on 3 known Pune points, cache hit avoids a second HTTP call, failure returns None.
Finish: update TASKS.md (B9) and MEMORY.md. Stop.
```

## B10: PDF service (most important)
```
Task B10 only. Create the complaint PDF generator.
- Put NotoSansDevanagari Regular and Bold .ttf files in app/fonts/ (download from Google Fonts / notofonts GitHub, mention source in README) and reference them with @font-face using absolute file:// paths resolved at runtime.
- Templates in app/templates/: base.css, complaint_mr.html, complaint_hi.html (Jinja2). A4, 12pt body, layout from docs/DESIGN.md "PDF design": To: department name (in that language) Pune; Date; Ref no; Subject line; Citizen name/phone; location block (address, ward, lat/lng, OpenStreetMap link text https://www.openstreetmap.org/?mlat=..&mlon=..); formal body paragraph written from summary_local + transcript; severity; "Documents enclosed" list; photo (if image_url, embed downloaded image scaled to 8 cm width); signature line; footer "Generated by Nagrik Mitra".
- app/services/pdf.py: render_pdf(complaint, department, ward) -> bytes using WeasyPrint, run inside run_in_threadpool by callers. Fall back to mr template for en.
- scripts/make_sample_pdf.py generating samples for pothole (mr), garbage (hi), ration_card (mr) into /backend/samples/.
Acceptance: the three sample PDFs open and show perfectly shaped Devanagari conjuncts (क्ष, ज्ञ, श्र, द्य); text is selectable; file size under 500 KB without photo. Show me the three file paths so I can inspect them.
Finish: update TASKS.md (B10) and MEMORY.md. Stop.
```

## B11: Create complaint
```
Task B11 only. Create POST /api/complaints in app/routers/complaints.py. Flow: validate ComplaintCreate -> verify department matches category (use departments table) -> find_ward -> reverse_geocode if address empty -> generate ref_no `NM-PUNE-YYYYMMDD-XXXX` (4 random digits, retry on unique conflict up to 5 times) -> insert complaint with status submitted -> insert status_event "submitted" -> render PDF (threadpool) -> upload_pdf -> update pdf_url -> return {id, ref_no, pdf_url}. If PDF generation fails, still return the complaint with pdf_url null and error logged, and add a POST /api/complaints/{id}/pdf/regenerate endpoint.
Rate limit 5/min per IP. Never log phone numbers.
Acceptance: end-to-end test with all external services mocked; manual curl creates a real row and a downloadable PDF.
Finish: update TASKS.md (B11) and MEMORY.md. Stop.
```

## B12: Read endpoints
```
Task B12 only. Add GET /api/complaints (filters ward_id, status, category, limit default 100 max 500, order created_at desc), GET /api/complaints/{id} (public detail + status_events), GET /api/complaints/{id}/pdf (307 redirect to pdf_url, 404 if none). Use only the public view; assert in tests that responses never contain citizen_name or citizen_phone.
Acceptance: tests for filters, 404, PII absence.
Finish: update TASKS.md (B12) and MEMORY.md. Stop.
```

## B13: Admin status update
```
Task B13 only. Add PATCH /api/complaints/{id}/status protected by header X-Admin-Key == ADMIN_KEY (constant-time compare). Body {status, note}. Update complaint, insert status_event, return the public detail. Block invalid transitions only if obviously wrong (e.g. from resolved back to submitted).
Acceptance: tests for 401 without key, 403 wrong key, success, invalid status 422.
Finish: update TASKS.md (B13) and MEMORY.md. Stop.
```

## B14: Ward stats
```
Task B14 only. Add GET /api/stats/wards returning [{ward_id, name, lat, lng, total, by_status:{submitted,in_review,in_progress,resolved,rejected}}] including wards with zero complaints, plus a top-level GET /api/stats/summary {total, pending, resolved_last_7_days}. Cache for 15 seconds in memory.
Acceptance: tests with fixture data; zero-complaint ward appears with zeros.
Finish: update TASKS.md (B14) and MEMORY.md. Stop.
```

## B15: Hardening
```
Task B15 only. Review the whole backend against docs/RULES.md and this checklist: slowapi limits applied (classify 20/min, complaints 5/min, upload 10/min, transcribe 10/min); request size limits; strict CORS; security headers; no secrets or PII in logs; structured logging with request id; timeouts on every outbound call; graceful handling when Supabase/LLM/Groq is down. Fix issues you find and list them in MEMORY.md.
Acceptance: pytest passes; a short written report of what changed.
Finish: update TASKS.md (B15) and MEMORY.md. Stop.
```

## B16: Tests + demo data
```
Task B16 only. (1) Create tests/test_utterances.py with 15 utterances (5 per category, mixed Marathi/Hindi/Hinglish) asserting expected category via the keyword fallback and, when RUN_LIVE_LLM=1, via the real provider. (2) Create scripts/seed_demo.py that inserts 30 realistic complaints across all wards, mixed categories and statuses, using real code paths (no PDF needed for seeds, set pdf_url null). (3) Add `pytest -q` instructions to README.
Acceptance: all tests pass offline; seed script is idempotent-safe (tag seeds with transcript prefix "[demo]" and add --reset flag deleting only those).
Finish: update TASKS.md (B16) and MEMORY.md. Stop.
```

## B17: Docker + Render
```
Task B17 only. Create backend/Dockerfile (python:3.11-slim) installing libpango-1.0-0, libpangoft2-1.0-0, libharfbuzz0b, libffi-dev, shared-mime-info, fonts-noto-core; non-root user; `CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}`. Add .dockerignore, a render.yaml (docker runtime, health check /api/health, env var keys without values, free plan). Build and run the container locally, call /api/health, and generate a sample Marathi PDF inside the container to prove fonts work.
Acceptance: docker build succeeds; PDF generated in container shows correct Devanagari.
Finish: update TASKS.md (B17) and MEMORY.md. Stop.
```

---
## Handy follow-ups
- **Contract check:** "Generate an OpenAPI summary table of all routes and compare it to the contract in ARCHITECTURE.md. List mismatches only."
- **Speed:** "Profile /classify and /complaints end to end and list the 3 biggest latency contributors with fixes. Do not change code."
- **Postman:** "Create docs/postman_collection.json for all endpoints with example bodies."
