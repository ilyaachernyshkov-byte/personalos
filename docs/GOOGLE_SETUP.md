# Подключение Google Sheets

1. В Google Cloud Console создайте новый проект, например Personal OS.
2. В APIs & Services → Library включите Google Sheets API.
3. В IAM & Admin → Service Accounts создайте Service Account. Права администратора Cloud-проекта не нужны.
4. Скопируйте email вида name@project.iam.gserviceaccount.com.
5. Откройте существующую таблицу Personal OS. В «Поделиться» добавьте email Service Account с правами Editor. В Phase 1 приложение запрашивает только read-only scope; Editor пригодится для будущего CRUD.
6. В Service Account → Keys → Add key → Create new key выберите JSON. Это секретный файл: храните безопасно вне репозитория. Не загружайте его в GitHub.
7. В локальный .env.local или Vercel Environment Variables перенесите:
   - client_email → GOOGLE_SERVICE_ACCOUNT_EMAIL
   - private_key → GOOGLE_PRIVATE_KEY
   - ID таблицы из URL → PERSONAL_OS_SPREADSHEET_ID
8. Для .env.local ключ можно вставить в двойных кавычках с буквальными `\n` между строками. Adapter заменяет `\n` на переносы. Vercel допускает настоящее многострочное значение; кавычки туда не включайте.

Пример без секрета:

```dotenv
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@example.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nREPLACE_WITH_YOUR_KEY\n-----END PRIVATE KEY-----\n"
PERSONAL_OS_SPREADSHEET_ID=your-spreadsheet-id
```

Задайте APP_PASSWORD, случайный SESSION_SECRET длиной минимум 32 символа и APP_TIMEZONE (IANA, например Europe/Saratov). Секрет можно сгенерировать локально командой `openssl rand -hex 32`. Не вставляйте его в документацию или commit.

После изменения ENV перезапустите dev server / повторно разверните Vercel. При полном подключении demo fixtures не используются. Частичные ENV считаются ошибкой. При недоступности Google приложение показывает ошибку, а не подменяет реальные данные демо.

Не переименовывайте листы и не меняйте порядок колонок. Диагностика: проверьте ID, включение API, права на таблицу и email аккаунта. Google API должен быть доступен из среды исполнения по HTTPS (oauth2.googleapis.com, sheets.googleapis.com).
