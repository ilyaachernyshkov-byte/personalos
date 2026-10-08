# PHASE 3 — Google Calendar read only

Status: code ready; **live verification pending**. Phase 4 is not started.

## Architecture and permissions

Settings button → authenticated Next.js Server Action → server repository → existing Apps Script API v2 `calendarSync` → Google Calendar GET → План in Google Sheets. Calendar REST calls use the script owner's OAuth token. The manifest grants `calendar.readonly`, spreadsheets and external requests. It never grants Calendar write scope. Advanced Calendar service enables Calendar API in the default Apps Script Cloud project; actual reads use REST to distinguish HTTP 404/410 from access failures. No new credentials, database, auto-sync, jobs or webhooks.

Google Sheets remains source of truth. Calendar sync never writes Факт, even after an event ends. Quick Fact and Plan/Task/Process → Fact remain the only existing mechanisms for actual work.

## Server ENV

- `PERSONAL_OS_API_URL`, `PERSONAL_OS_API_SECRET`: existing Apps Script web app.
- `PERSONAL_OS_CALENDAR_IDS`: explicit comma-separated IDs, trimmed and deduplicated, maximum 20. Empty disables sync. No automatic calendar discovery, including Bitrix calendars.
- `PERSONAL_OS_CALENDAR_PAST_DAYS`: default 7, integer 0–90.
- `PERSONAL_OS_CALENDAR_FUTURE_DAYS`: default 30, integer 1–180.

Never use NEXT_PUBLIC for these settings. IDs are not returned to the browser. Settings shows configured/count, persisted last successful sync (UTC), loading, created/updated/canceled/skipped and access errors. Opening Settings only reads `calendarStatus`, never syncs.

## Manual setup of the existing Apps Script

1. Open the existing Google Sheet → Extensions → Apps Script. Replace the **complete** `Code.gs` with `apps-script/Code.gs` from branch `phase-3`.
2. Apps Script → Project Settings (gear) → enable **Show appsscript.json manifest file in editor**. Open `appsscript.json`, apply `apps-script/appsscript.json`. Preserve any existing web app/deployment settings if present; keep only the listed OAuth scopes for this backend. Spreadsheet timezone, rather than manifest timezone, controls imported Plan time.
3. Editor → Services **+** → **Google Calendar API** → v3 → Add. For a default Cloud project this enables the Calendar API automatically. For a standard linked Cloud project: Project Settings → Google Cloud Platform project link → APIs & Services → Library → Google Calendar API → Enable.
4. Run `authorizeCalendarReadOnly` from the function picker → Review permissions → select the existing script owner → Allow. This only requests permission/reads no Calendar events. The owner must have read access to every explicitly selected calendar.
5. Deploy → Manage deployments → edit (pencil) the existing web app → Version **New version** → Deploy. Keep **Execute as: Me** and the existing working access setting and URL. Preserve `API_SECRET` and `SPREADSHEET_ID` Script Properties.
6. In Google Calendar → Settings → selected calendar → Integrate calendar → copy Calendar ID. Set `PERSONAL_OS_CALENDAR_IDS` in the app's server environment, not in Script Properties. Set the optional window ENV, then redeploy/restart the app. For Cloud live verification, set these same ENV in this Cloud environment too.
7. Personal OS → Settings → Google Calendar → **Синхронизировать календарь**.

## Mapping, identity and history

New event uses first empty plan_id row and max PLAN suffix + 1 under the existing ScriptLock shared with CRUD. The row must already exist; no append or formula regeneration. New rows initialize writable cells like normal creation. План L/M and unexpected formulas are protected.

| Calendar | План |
| --- | --- |
| selected calendar ID + instance `event.id` | calendar_id + calendar_event_id (strict pair dedup) |
| summary, fallback Без названия | Название |
| start instant converted to spreadsheet timezone | Дата, Начало |
| end instant converted to spreadsheet timezone | Конец |
| actual elapsed end−start minutes | План_мин |
| active / cancelled | Запланировано / Отменено, only if the row dropdown permits |
| import | Источник = Импорт, only if dropdown permits |

For a new row Тип uses Встреча, otherwise Другое if allowed by the actual row's dropdown. No new dropdown values are introduced; unsupported/missing accepted values fail clearly. Existing Тип, project_id, Проект, source_id, Заметки and other manual context are preserved on resync. Active events refresh Calendar-owned status even if previously manually changed; this does not create or erase Facts.

`singleEvents=true` expands recurring instances; use `event.id`, never iCalUID or recurringEventId. Paginate `nextPageToken`; `showDeleted=true` retains tombstones. Unchanged rows count as skipped, including repeated cancellations; counts are per sync.

Canceled/deleted events retain their row, ID, Calendar IDs, previous details and manual context; only cancellation status/timestamp change. Unknown canceled instances are skipped. Events absent from the window are individually GET-checked for **previously imported selected-calendar rows**, including outside the window; only cancelled status or event GET 404/410 means cancellation. A move outside the window updates the existing Plan; list/access failures never imply deletion. Unselected calendars' rows are untouched.

## Timezone, all-day and multi-day

Use `getSafeTimeZone(book)`; RFC3339 timed start/end require explicit offsets and convert once into spreadsheet wall-clock strings. Write numeric date/time serials with dd.MM.yyyy and HH:mm formats, and retain Phase 2 snapshot getDisplayValues handling. APP_TIMEZONE should match the Google Sheet timezone for consistent UI date boundaries; Calendar display timezone can differ.

All-day events (including multi-day all-day) produce **one** Plan on the start date, empty start/end and 0 minutes. Calendar all-day end is exclusive. Timed multi-day events produce one Plan on the start date, start/end clock values and full elapsed duration, even if duration >24h. End date is not stored separately; duration is authoritative. No daily splitting. DST uses elapsed instant duration, not subtraction of displayed HH:mm.

## Limits and failure behavior

Bounded new-event window is an elapsed 24-hour-day interval around now, not entire Calendar history. Previously imported events are still checked to catch moves/deletions. Maximum 1000 imported selected-calendar rows, 100 pages per calendar and 10000 listed events; fail explicitly beyond these limits. Apps Script execution/URLFetch quotas and hosting action timeouts still apply; use a smaller window if necessary. Next.js request timeout is 120 seconds. A shared ScriptLock serializes allocation and sync with CRUD.

Read all selected calendars and existing missing IDs before Sheet changes. Each row's validation completes before its writes. Sheets has no transactional batch guarantee: later validation/timeout can leave earlier rows saved. Retry is safe by pair dedup, and lastSuccess advances only on full success. No rollback or recovery job is added. Settings errors advise checking the Sheet. Pages `/`, `/plan-fact`, `/analytics`, `/settings` refresh on success and failure; Project pages currently do not consume Plans and need no revalidation.

## Verification

Automated coverage executes the complete Code.gs in the existing fake Sheet integration harness, including snapshot parsing, recurring instances/pagination/multiple calendars, timed offsets/midnight, all-day, unchanged resync, updates preserving manual context, tombstone and 410 cancellation, move outside window, dropdown validation, formula protection and no Fact writes. Existing Phase 2 tests remain.

Live verification is **not yet performed**; unit tests are not evidence of production deployment. After setup, use two explicitly selected calendars:

1. Manually create timed event `Personal OS PHASE 3 live A` today in calendar A, e.g. 15:00–15:30 in the Sheet timezone; create `Personal OS PHASE 3 live B` in calendar B. Record Calendar IDs and Sheet timezone without exposing secrets.
2. Click sync; inspect Sheet rows, Apps Script snapshot and Plan/Fact UI: same date/HH:mm, distinct IDs/pairs, source Импорт, no new Fact. Verify План L/M formulas unchanged.
3. Sync again: same PLAN IDs, no duplicates.
4. In Calendar change A to 16:00–16:45 and change title; sync: same PLAN, updated date/time/title/minutes. Enrich Plan with project/source/notes before resync and confirm preservation.
5. In Calendar delete B; sync: same row/IDs, allowed Отменено, no Fact. Check both calendars were handled.
6. In existing UI use Plan → Fact on A; confirm it creates exactly one explicitly requested Activity with matching time and plan_id.
7. Verify Phase 2 create/update for all six entities and Task/Process → Fact still work; retain existing formula protections. Record actual PLAN/ACT IDs, timestamps, counts and evidence here before declaring COMPLETE.

Required checks: npm run lint; npm run typecheck; npm test; npm run build -- --webpack.

### Code-ready verification, 2026-10-08

- lint: PASS; typecheck: PASS; tests: 50 PASS; webpack production build: PASS.
- Updated origin/main and confirmed Phase 2 merge d73a35f88a241fd87e585687a7e072103f05719a; implementation branch phase-3.
- Existing live Apps Script snapshot: ok=true, apiVersion=2. New calendarStatus was not confirmed by deployed API; response was not valid JSON. No Calendar IDs are configured in this Cloud environment.
- Calendar → Sheet → snapshot → UI verification remains pending manual deployment/readonly authorization/explicit calendar configuration. No COMPLETE claim and no merge.
