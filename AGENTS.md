# PERSONAL OS
Single-user Russian web app for projects, tasks, recurring processes, daily Plan and actual time log.

## Architecture
Next.js App Router, strict TypeScript, npm, Tailwind, shadcn/ui, Recharts. Server components authorize before reading. UI consumes domain objects from PersonalOsRepository. Google Sheets is the source of truth; demo fixtures are only development/preview fallback. Apps Script is the primary backend; server-side mutations only. Full deployment source: apps-script/Code.gs. Batch-read six ranges once per request; never perform a request per card. Credentials live only in ENV.

## Invariants
- Task and Activity are different entities. Actual time comes only from Факт.
- An Activity is planned only when plan_id is present. Never retrospectively attach unplanned work automatically.
- Project progress comes from checkpoint milestones / Sheets formulas, never from completed task count.
- Preserve existing sheet names. Preserve formula columns: Проекты F/K/L/M, План L/M, Факт M.
- Future insert: read ID column, find first empty ID row, allocate maximum numeric suffix + 1 (minimum three digits). Do not append based on formula-filled sheet extent.
- No writes in Phase 1. Future CRUD must update only explicitly writable cells, retain formula cells, serialize allocation and reread IDs; Sheets provides no transactional uniqueness guarantee.
- Do not add Supabase, another database, microservices, AI, voice, Calendar integration, Bitrix or multi-user auth in Phase 1.
- Never commit secrets, .env.local, credentials.json or private keys. Never change git remote or history.

## Validation
npm run lint; npm run typecheck; npm test; npm run build.
Phase 3 code is authorized. Stop before Phase 4. Calendar is read only: explicit server ENV selection, manual sync, dedup by calendar_id + calendar_event_id; Calendar sync writes only Plan and never Fact. Live Phase 2 completion requires real create/update verification after manual Apps Script deployment.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
