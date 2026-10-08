# PHASE 2: код записи через Apps Script

Google Sheets остаётся source of truth. Основной backend — Google Apps Script. Физического удаления нет: используйте статусы или деактивацию. Google Calendar / PHASE 3 не реализованы.

## Ручное обновление deployment

1. Откройте существующий Google Apps Script проекта Personal OS.
2. Полностью замените текущий `Code.gs` содержимым `apps-script/Code.gs` из ветки `phase-2`.
3. В Script Properties должны существовать `API_SECRET` и `SPREADSHEET_ID`. Сохраните текущие значения; не вставляйте секреты в код.
4. Сохраните файл.
5. Deploy → Manage deployments → Edit существующий deployment → New version → Deploy. Сохраните прежний `/exec` URL, если Google позволяет. Если URL изменился, обновите только server ENV `PERSONAL_OS_API_URL`.
6. Следующая команда Codex: live verification create/update на настоящей таблице.

Кодовая готовность не означает PHASE 2 COMPLETE. Пока новый deployment и настоящие create/update не проверены, live writes не подтверждены.

## API

Все POST-запросы отправляются сервером, с `secret` из `PERSONAL_OS_API_SECRET`. Browser получает только Server Action reference и результаты, без API secret.

- `{secret, action: "snapshot"}` → `{ok: true, apiVersion: 2, data: {...}}`
- `{secret, action: "create", entity, data}` → `{ok: true, apiVersion: 2, id}`
- `{secret, action: "update", entity, id, data}` → `{ok: true, apiVersion: 2, id}`
- Ошибка: `{ok: false, error: {code, message}}`.

`entity`: project / milestone / task / process / plan / activity. `data` использует domain-поля camelCase из `src/schemas/mutations.ts`; их координаты совпадают с существующими листами. ID и timestamps создаются backend. Названия связей определяются по ID, присланные названия не являются авторитетными. Неизвестные поля отклоняются, computed/formula-поля игнорируются backend.

LockService сериализует поиск ID, валидацию и запись. CREATE читает A2:A по числу подготовленных строк, ищет первый пустой ID, назначает max suffix + 1. При заполнении всех подготовленных строк возвращает NO_FREE_ROW: пользователь добавляет строки с формулами в существующий лист. Новые листы и произвольные изменения структуры не создаются.

Проекты F/K/L/M, План L/M, Факт M никогда не записываются. Неожиданная формула в writable-cell вызывает ошибку до начала записи. Текст, начинающийся с символа формулы, записывается как текст. Даты записываются serial-числами, время — долей суток; это предотвращает timezone-сдвиг. Snapshot нормализует Date через timezone таблицы. Проверяются заголовки существующей структуры листов.

Завершение задачи меняет статус, дату и результат; не создаёт Факт. Task → Fact не закрывает задачу. Plan → Fact сохраняет явный planId, допускает несколько записей. Только Факт является источником actual time и аналитики. Процесс остаётся шаблоном.

После подтверждения API v2 Server Action вызывает revalidatePath('/', 'layout'): текущий экран и последующие Dashboard/Analytics получают свежие данные. Автоматического повтора записей нет. При timeout запись могла сохраниться: проверьте таблицу перед повторным нажатием. Sheets не предоставляет транзакционной записи в несколько ячеек.

Без APP_PASSWORD или SESSION_SECRET login gate обходится; существующая signed-cookie auth сохраняется для будущего включения. Demo и Service Account adapter не симулируют успешную запись: возвращают понятное сообщение, что mutations требуют Apps Script.

## Проверки

`npm run lint`, `npm run typecheck`, `npm test`, `npm run build -- --webpack`.

Тесты выполняют полный Code.gs в VM с моделированием Sheet/LockService и проверяют ID, свободные строки, формулы, allowed fields, даты/время, связи и результаты snapshot → edit → snapshot. Это локальная проверка контракта, а не реальных Google Sheets writes.
