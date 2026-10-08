# PERSONAL OS

Личная система проектов, задач, регулярных процессов и времени. Phase 1: read-only интерфейс с Google Sheets как source of truth, демо-adapter и single-user входом.

Стек: Next.js App Router, React, TypeScript strict, Tailwind CSS, shadcn/ui Button, Lucide, Recharts, Zod, googleapis, Vitest.

## Запуск

```sh
npm install
cp .env.example .env.local
npm run dev
```

Откройте http://localhost:3000. Без Sheets credentials в development и Vercel preview доступен небольшой demo dataset. При отсутствии APP_PASSWORD или SESSION_SECRET доступ разрешён без login gate, в том числе в production. Если оба заданы, используется сохранённая signed-cookie авторизация. Демо запрещено в production. Частичная конфигурация Sheets показывает ошибку.

ENV: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, PERSONAL_OS_SPREADSHEET_ID, APP_PASSWORD, SESSION_SECRET (32+ символа), APP_TIMEZONE (IANA; fallback UTC). Полная инструкция: [Google setup](docs/GOOGLE_SETUP.md).

## Проверки

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

Страницы: `/`, `/projects`, `/projects/PRJ-001` (demo), `/tasks`, `/processes`, `/plan-fact`, `/analytics`, `/settings`, `/login`.

## Архитектура

`src/types` — domain; `src/schemas` — row parsers; `src/repositories` — общий интерфейс и Google/demo adapters; `src/lib` — auth, даты, ID, аналитика; `src/features` — интерактивные фильтры и графики; `src/components` — layout и UI.

Sheets читается одним batchGet шести ranges, UNFORMATTED_VALUE + SERIAL_NUMBER. Request-level cache предотвращает повторное чтение; постоянного кеша нет. UI не знает координат колонок. Формульные значения проектов читаются как есть. Факт определяет реальное время; выполнение плана = связанный с plan_id Факт / План (может превышать 100%). Отклонение = весь Факт − План. Периоды включают сегодняшний день; неделя начинается в понедельник. Демо-даты относительны текущей дате APP_TIMEZONE.

## Будущий Vercel deploy

Импортируйте существующий GitHub repository в Vercel как Next.js project. Задайте ENV для Production, отдельно для Preview, затем deploy. Production требует настроенных auth и Sheets; домен добавляется в Vercel Domains. В этом проходе внешний deploy не выполняется.

Signed httpOnly cookie: HMAC-SHA256, 7 дней, SameSite=Lax, Secure в production. Server Actions имеют проверку Origin средствами Next.js. Ограничение попыток входа пока в памяти одного instance; для распределённого production нужен security review (Phase 4). Секреты никогда не отдаются клиенту. При смене SESSION_SECRET сессии аннулируются.

Будущий CRUD должен сохранять формульные колонки и выделять строки по ID, а не append. ID-утилиты подготовлены; конкурентные записи и повторная проверка ID — задача Phase 2.

[Полная спецификация и Phase 1–4](docs/PRODUCT_SPEC.md) · [Правила разработки](AGENTS.md).

## PHASE 2

CRUD/forms и запись Факта реализованы через server-side Apps Script mutations. Инструкция ручного обновления существующего deployment: [docs/PHASE_2.md](docs/PHASE_2.md). Полный backend: [apps-script/Code.gs](apps-script/Code.gs). Без APP_PASSWORD или SESSION_SECRET login gate не блокирует приложение. Live create/update требуют нового deployment и отдельной проверки. PHASE 3 не начата.
