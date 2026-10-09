# PROMPT PLAYBOOK: Nagrik Mitra

Ye file batati hai **kis order mein, kaunsa tool, kaunsa prompt**. Prompts English mein hain (AI tools ko better samajh aata hai), instructions Hinglish mein.

## Big picture
```
Stitch (design) --zip--> Antigravity (frontend)      Cursor (backend)
        \                         |                       |
         \------ docs/ folder ----+-----------------------+
                                  v
                    Supabase (DB)  +  Render (API)  +  Vercel (web)
```

## Order of work
| Step | Tool | File to use | Output |
|---|---|---|---|
| 0 | You | `docs/` folder ko repo mein daalo | Repo ready |
| 1 | Supabase | `supabase/schema.sql` | DB + buckets |
| 2 | **Stitch** | `prompts/01_STITCH_PROMPTS.md` | Screens + **export zip** |
| 3 | **Antigravity** | `prompts/02_ANTIGRAVITY_PLAN_PROMPTS.md` (Prompt A0 se start) | Frontend |
| 4 | **Cursor** | `prompts/03_CURSOR_BACKEND_PROMPTS.md` | Backend |
| 5 | You | `prompts/04_DEPLOY_PROMPTS.md` | Render + Vercel live |
| 6 | You | Section "Demo checklist" below | Demo ready |

Step 3 aur 4 **parallel** chal sakte hain. Frontend ko backend ka API contract `ARCHITECTURE.md` mein already mil jata hai, isliye wait nahi karna.

## Antigravity flow (jaisa tumne bola)
1. Antigravity mein project folder kholo jisme `docs/` hai.
2. **Plan pehle Antigravity mein daalo** (Planning mode): `prompts/02_ANTIGRAVITY_PLAN_PROMPTS.md` ka **Prompt A0 (Master plan)** paste karo. Wo plan banayega aur tasks mein todega.
3. Plan approve karne ke baad, **Stitch ki exported zip upload karo** (zip ko `design/stitch-export/` mein extract/drop karo ya chat mein attach karo).
4. Phir **Prompt A1 (Stitch import)** paste karo. Uske baad F2, F3 ... F10 ek ek karke (Prompt A2 se A10).
5. Har task ke baad: app chalao, check karo, phir next prompt.

## Cursor flow
1. Cursor mein repo kholo. `RULES.md` ko `.cursor/rules/nagrik.mdc` mein copy karo (alwaysApply: true).
2. Chat mein pehle **Prompt C0 (Context loader)** paste karo.
3. Phir **B1 se B17 tak ek-ek prompt**, alag alag chat/composer session mein ya ek ke baad ek. Ek time pe sirf ek.
4. Har prompt ke end mein acceptance check hai. Pass hone par hi aage badho.

## Golden rules for prompting
- Hamesha `@docs/RULES.md @docs/ARCHITECTURE.md @docs/TASKS.md @docs/MEMORY.md` attach karo.
- "Do only task X, then stop" likho. Agent ko aage bhagne mat do.
- Kuch toote to naya prompt mat likho, pehle error paste karo aur bolo "fix only this".
- Har task ke baad `MEMORY.md` update karwao. Context lose hone par yehi bachayega.
- Naya chat shuru karo jab agent confuse ho; `MEMORY.md` se context wapas aa jayega.

## Reusable helper prompts
**Fix a bug**
```
@docs/RULES.md @docs/MEMORY.md
Bug: <paste exact error or describe behavior>
Expected: <what should happen>
Find the root cause first and explain it in 2 lines. Then fix only this bug with the smallest change. Do not refactor. Update docs/MEMORY.md gotchas.
```
**Review before moving on**
```
Review the work done for task <ID> against its acceptance criteria in docs/TASKS.md and the API contract in docs/ARCHITECTURE.md. List mismatches only. Do not change code.
```
**Context refresh (new chat)**
```
Read docs/PRD.md, docs/ARCHITECTURE.md, docs/RULES.md, docs/TASKS.md, docs/MEMORY.md. Summarize in 8 bullets: current progress, next task, any open issues. Do not write code yet.
```
**Contract sync (frontend vs backend)**
```
Compare frontend/src/lib/api.ts types with the API contract in docs/ARCHITECTURE.md and backend/app/schemas. Report any field name/type mismatches as a table. Do not change code.
```

## Demo checklist
- [ ] Backend warm (open `/api/health` 2 minutes before)
- [ ] Mic permission granted, Chrome on Android/desktop tested
- [ ] 15 utterances tested (5 per category, Marathi and Hindi)
- [ ] Marathi PDF opens correctly on phone
- [ ] Dashboard has 20 to 30 seeded complaints across wards
- [ ] Backup: screen recording of full flow, typed-input fallback ready
- [ ] Phone hotspot as WiFi backup
