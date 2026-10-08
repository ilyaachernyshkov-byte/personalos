// PERSONAL OS PHASE 3. Replace the complete deployed Code.gs with this file.
// Script Properties: API_SECRET, SPREADSHEET_ID. Never place secrets here.
var CONFIG = {
  "project": {
    "sheet": "Проекты",
    "prefix": "PRJ",
    "fields": [
      "id",
      "name",
      "direction",
      "status",
      "priority",
      null,
      "current",
      "next",
      "start",
      "deadline",
      null,
      null,
      null,
      "blocker",
      "nextStep",
      "notes",
      "createdAt",
      "updatedAt"
    ],
    "headers": [
      "project_id",
      "Название проекта",
      "Направление",
      "Статус",
      "Приоритет",
      "Прогресс_%",
      "Текущая точка",
      "Следующая точка",
      "Дата старта",
      "Дедлайн",
      "Последняя активность",
      "Дней без движения",
      "Здоровье",
      "Блокер",
      "Следующий шаг",
      "Заметки",
      "created_at",
      "updated_at"
    ]
  },
  "milestone": {
    "sheet": "Этапы",
    "prefix": "MS",
    "fields": [
      "id",
      "projectId",
      "project",
      "order",
      "name",
      "checkpoint",
      "status",
      "plannedDate",
      "completedDate",
      "criteria",
      "result",
      "notes"
    ],
    "headers": [
      "milestone_id",
      "project_id",
      "Проект",
      "Порядок",
      "Этап",
      "checkpoint_%",
      "Статус",
      "Плановая дата",
      "Дата завершения",
      "Критерий готовности",
      "Результат",
      "Заметки"
    ]
  },
  "task": {
    "sheet": "Задачи",
    "prefix": "TSK",
    "fields": [
      "id",
      "name",
      "type",
      "projectId",
      "project",
      "processId",
      "process",
      "milestoneId",
      "milestone",
      "status",
      "priority",
      "plannedDate",
      "plannedMinutes",
      "deadline",
      "completedDate",
      "source",
      "owner",
      "result",
      "blocker",
      "notes",
      "createdAt",
      "updatedAt"
    ],
    "headers": [
      "task_id",
      "Задача",
      "Тип",
      "project_id",
      "Проект",
      "process_id",
      "Процесс",
      "milestone_id",
      "Этап",
      "Статус",
      "Приоритет",
      "Плановая дата",
      "План_мин",
      "Дедлайн",
      "Дата выполнения",
      "Источник",
      "Ответственный",
      "Результат",
      "Блокер",
      "Заметки",
      "created_at",
      "updated_at"
    ]
  },
  "process": {
    "sheet": "Процессы",
    "prefix": "PROC",
    "fields": [
      "id",
      "name",
      "category",
      "frequency",
      "rule",
      "time",
      "plannedMinutes",
      "active",
      "projectId",
      "project",
      "nextDate",
      "lastDate",
      "source",
      "notes",
      "createdAt",
      "updatedAt"
    ],
    "headers": [
      "process_id",
      "Процесс",
      "Категория",
      "Периодичность",
      "Правило/дни",
      "Время",
      "План_мин",
      "Активен",
      "project_id",
      "Проект",
      "Следующее выполнение",
      "Последнее выполнение",
      "Источник",
      "Заметки",
      "created_at",
      "updated_at"
    ]
  },
  "plan": {
    "sheet": "План",
    "prefix": "PLAN",
    "fields": [
      "id",
      "date",
      "start",
      "end",
      "minutes",
      "type",
      "sourceId",
      "name",
      "projectId",
      "project",
      "status",
      null,
      null,
      "source",
      "calendarId",
      "calendarEventId",
      "notes",
      "createdAt",
      "updatedAt"
    ],
    "headers": [
      "plan_id",
      "Дата",
      "Начало",
      "Конец",
      "План_мин",
      "Тип",
      "source_id",
      "Название",
      "project_id",
      "Проект",
      "Статус",
      "Факт_мин",
      "Отклонение_мин",
      "Источник",
      "calendar_id",
      "calendar_event_id",
      "Заметки",
      "created_at",
      "updated_at"
    ]
  },
  "activity": {
    "sheet": "Факт",
    "prefix": "ACT",
    "fields": [
      "id",
      "date",
      "start",
      "end",
      "minutes",
      "type",
      "name",
      "projectId",
      "project",
      "taskId",
      "processId",
      "planId",
      null,
      "result",
      "nextStep",
      "blocker",
      "source",
      "notes",
      "createdAt"
    ],
    "headers": [
      "activity_id",
      "Дата",
      "Начало",
      "Конец",
      "Факт_мин",
      "Тип активности",
      "Название",
      "project_id",
      "Проект",
      "task_id",
      "process_id",
      "plan_id",
      "План/внеплан",
      "Результат",
      "Следующий шаг",
      "Блокер",
      "Источник",
      "Заметки",
      "created_at"
    ]
  }
};

function getSafeTimeZone(book) {
  var timezone;
  try { timezone = book.getSpreadsheetTimeZone(); } catch (_) {}
  if (typeof timezone === 'string' && timezone.trim()) return timezone.trim();
  try { timezone = Session.getScriptTimeZone(); } catch (_) {}
  return typeof timezone === 'string' && timezone.trim() ? timezone.trim() : 'UTC';
}

function fail(code, message) {
  var error = new Error(message);
  error.code = code;
  throw error;
}
function jsonResponse(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
var diagnosticStage = "request";
function doPost(e) {
  diagnosticStage = "request";
  try {
    var props = PropertiesService.getScriptProperties();
    var secret = props.getProperty('API_SECRET');
    var spreadsheetId = props.getProperty('SPREADSHEET_ID');
    if (!secret || !spreadsheetId) fail('CONFIGURATION', 'Настройте API_SECRET и SPREADSHEET_ID в Script Properties');
    var request;
    try { request = JSON.parse(e.postData.contents); } catch (_) { fail('INVALID_JSON', 'Ожидается JSON'); }
    if (!request || typeof request !== 'object' || request.secret !== secret) fail('UNAUTHORIZED', 'Доступ запрещён');
    if (['snapshot', 'read', 'create', 'update', 'calendarSync', 'calendarStatus'].indexOf(request.action) < 0) fail('INVALID_ACTION', 'Неизвестное действие');
    diagnosticStage = "open-spreadsheet";
    var book = SpreadsheetApp.openById(spreadsheetId);
    if (request.action === 'snapshot' || request.action === 'read') return jsonResponse({ok: true, apiVersion: 2, data: snapshot(book)});
    if (request.action === 'calendarStatus') return jsonResponse({ok: true, apiVersion: 2, lastSuccess: props.getProperty('CALENDAR_LAST_SUCCESS') || null});
    diagnosticStage = "write-lock";
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(20000)) fail('BUSY', 'Запись занята. Попробуйте позже');
    try {
      return jsonResponse(request.action === 'calendarSync' ? syncCalendar(book, request) : mutate(book, request));
    } finally { lock.releaseLock(); }
  } catch (error) {
    // Log internal exceptions only in Apps Script Executions, never in API responses.
    if (!error.code) console.error('PERSONAL OS at ' + diagnosticStage + ': ' + (error.stack || error.message));
    return jsonResponse({ok: false, apiVersion: 2, error: {code: error.code || 'BACKEND_ERROR', stage: diagnosticStage, message: error.code ? error.message : 'Ошибка Apps Script. Проверьте журнал выполнения'}});
  }
}
function sheetFor(book, entity) {
  var config = CONFIG[entity];
  if (!Object.prototype.hasOwnProperty.call(CONFIG, entity)) fail('INVALID_ENTITY', 'Неизвестная сущность');
  var sheet = book.getSheetByName(config.sheet);
  if (!sheet) fail('INVALID_SHEET', 'Не найден лист ' + config.sheet);
  var headers = sheet.getRange(1, 1, 1, config.headers.length).getValues()[0];
  if (headers.some(function(header, i) { return String(header).trim() !== config.headers[i]; }))
    fail('INVALID_HEADERS', 'Структура листа ' + config.sheet + ' отличается от контракта');
  return sheet;
}
function readRows(sheet, width) {
  return sheet.getMaxRows() > 1 ? sheet.getRange(2, 1, sheet.getMaxRows() - 1, width).getValues() : [];
}
function serializeCell(value, display, timezone, isTime) {
  if (isTime) {
    if (value === '' || value == null) return '';
    // Sheets time-only Dates use 1899 and can carry historical timezone offsets.
    // Displayed HH:mm is the workbook's wall-clock time; do not timezone-convert it.
    var time = String(display || '').trim().match(/^(\d{1,2}):([0-5]\d)(?::[0-5]\d)?$/);
    if (time) return time[1].padStart(2, '0') + ':' + time[2];
    if (typeof value === 'number' && value >= 0 && value < 1) {
      var minutes = Math.round(value * 1440) % 1440;
      return String(Math.floor(minutes / 60)).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0');
    }
    if (isTimeValue(value)) return value;
    fail('VALIDATION', 'Время в таблице должно отображаться как HH:mm');
  }
  if (value instanceof Date) {
    var date = String(display || '').trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s|$)/);
    if (date) return date[3] + '-' + date[2].padStart(2, '0') + '-' + date[1].padStart(2, '0');
    var iso = String(display || '').trim().slice(0, 10);
    if (isDate(iso)) return iso;
    return Utilities.formatDate(value, timezone, 'yyyy-MM-dd');
  }
  return value;
}
function isTimeValue(value) { return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value); }
function snapshot(book) {
  var result = {};
  Object.keys(CONFIG).forEach(function(entity) {
    var config = CONFIG[entity];
    diagnosticStage = 'snapshot:' + entity + ':sheet';
    var sheet = sheetFor(book, entity);
    var timezone = getSafeTimeZone(book);
    diagnosticStage = 'snapshot:' + entity + ':read';
    var rows = readRows(sheet, config.headers.length);
    var displays = rows.length ? sheet.getRange(2, 1, rows.length, config.headers.length).getDisplayValues() : [];
    result[config.sheet] = rows.map(function(row, rowIndex) {
      if (!String(row[0]).trim()) return null;
      diagnosticStage = 'snapshot:' + entity + ':serialize';
      var item = {};
      config.headers.forEach(function(header, i) {
        item[header] = serializeCell(row[i], displays[rowIndex][i], timezone, ['Начало', 'Конец', 'Время'].indexOf(header) >= 0);
      });
      return item;
    }).filter(function(row) { return row !== null; });
  });
  return result;
}
function nextId(ids, prefix) {
  var pattern = new RegExp('^' + prefix + '-(\\d+)$');
  var max = ids.reduce(function(maximum, id) { var match = String(id).match(pattern); return match ? Math.max(maximum, Number(match[1])) : maximum; }, 0);
  return prefix + '-' + String(max + 1).padStart(3, '0');
}
function firstEmptyIdRow(ids) {
  var index = ids.findIndex(function(id) { return !String(id == null ? '' : id).trim(); });
  return (index < 0 ? ids.length : index) + 2;
}
function isDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  var parsed = new Date(value + 'T00:00:00Z');
  return !isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
function isTime(value) { return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value); }
function fieldKind(entity, field) {
  if (['minutes', 'plannedMinutes', 'order', 'checkpoint'].indexOf(field) >= 0) return 'number';
  if (field === 'active') return 'boolean';
  if (['time'].indexOf(field) >= 0 || (['plan', 'activity'].indexOf(entity) >= 0 && ['start', 'end'].indexOf(field) >= 0)) return 'time';
  if (['date', 'start', 'deadline', 'plannedDate', 'completedDate', 'nextDate', 'lastDate'].indexOf(field) >= 0) return 'date';
  return 'string';
}
function validateData(entity, data, create) {
  var config = CONFIG[entity];
  if (!Object.prototype.hasOwnProperty.call(CONFIG, entity)) fail('INVALID_ENTITY', 'Неизвестная сущность');
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail('VALIDATION', 'data должен быть объектом');
  var clean = {};
  var formulas = {project: ['progress', 'lastActivity', 'idleDays', 'health', 'Прогресс_%', 'Последняя активность', 'Дней без движения', 'Здоровье'], plan: ['actualMinutes', 'deviation', 'Факт_мин', 'Отклонение_мин'], activity: ['classification', 'План/внеплан']};
  Object.keys(data).forEach(function(field) {
    if ((formulas[entity] || []).indexOf(field) >= 0) return;
    if (config.fields.indexOf(field) < 0 || ['id', 'createdAt', 'updatedAt', 'source', 'calendarId', 'calendarEventId', 'lastDate'].indexOf(field) >= 0)
      fail('VALIDATION', 'Недопустимое поле ' + field);
    var value = data[field], kind = fieldKind(entity, field);
    if (kind === 'number') {
      if (typeof value !== 'number' || !isFinite(value) || value < 0 || (field === 'checkpoint' && value > 100)) fail('VALIDATION', 'Некорректное число: ' + field);
    } else if (kind === 'boolean') {
      if (typeof value !== 'boolean') fail('VALIDATION', 'Ожидается boolean: ' + field);
    } else {
      if (typeof value !== 'string' || value.length > 10000) fail('VALIDATION', 'Ожидается строка: ' + field);
      value = value.trim();
      if (value && kind === 'date' && !isDate(value)) fail('VALIDATION', 'Некорректная дата: ' + field);
      if (value && kind === 'time' && !isTime(value)) fail('VALIDATION', 'Некорректное время: ' + field);
    }
    clean[field] = value;
  });
  if ((create || 'name' in clean) && !clean.name) fail('VALIDATION', 'Укажите название');
  if (create && ['plan', 'activity'].indexOf(entity) >= 0 && !clean.date) fail('VALIDATION', 'Укажите дату');
  if ('date' in clean && !clean.date && ['plan', 'activity'].indexOf(entity) >= 0) fail('VALIDATION', 'Укажите дату');
  return clean;
}
function rowData(entity, row, timezone, displayRow) {
  var item = {};
  CONFIG[entity].fields.forEach(function(field, i) {
    if (!field) return;
    var value = row[i];
    value = serializeCell(value, displayRow ? displayRow[i] : '', timezone, fieldKind(entity, field) === 'time');
    // Date/time serials may be returned as numbers depending on existing formatting.
    if (typeof value === 'number' && fieldKind(entity, field) === 'date') value = new Date(Date.UTC(1899, 11, 30) + Math.floor(value) * 86400000).toISOString().slice(0,10);
    item[field] = value;
  });
  return item;
}
function findRelated(book, entity, id) {
  if (typeof id !== 'string' || !(new RegExp('^' + CONFIG[entity].prefix + '-\\d{3,}$')).test(id)) fail('VALIDATION', 'Некорректный ID связи');
  var sheet = sheetFor(book, entity);
  var rows = readRows(sheet, CONFIG[entity].fields.length);
  var matches = rows.filter(function(row) { return String(row[0]).trim() === id; });
  if (matches.length !== 1) fail('INVALID_LINK', 'Связь не существует или ID дублируется: ' + id);
  return rowData(entity, matches[0], getSafeTimeZone(book), sheet.getRange(rows.indexOf(matches[0]) + 2, 1, 1, CONFIG[entity].fields.length).getDisplayValues()[0]);
}
function resolveLinks(book, entity, clean, merged) {
  var links = {projectId: ['project', 'project'], processId: ['process', 'process'], milestoneId: ['milestone', 'milestone'], taskId: ['task', null], planId: ['plan', null]};
  Object.keys(links).forEach(function(field) {
    if (CONFIG[entity].fields.indexOf(field) < 0) return;
    var id = merged[field], target = links[field], linked = id ? findRelated(book, target[0], id) : null;
    if (linked && linked.projectId && linked.projectId !== merged.projectId) fail('INVALID_LINK', 'Связанная запись относится к другому проекту');
    if (target[1] && CONFIG[entity].fields.indexOf(target[1]) >= 0) clean[target[1]] = linked ? linked.name : '';
  });
  if (entity === 'milestone' && !merged.projectId) fail('VALIDATION', 'Этапу требуется проект');
  if (merged.sourceId) {
    var target = Object.keys(CONFIG).find(function(key) { return key !== 'activity' && key !== 'plan' && merged.sourceId.indexOf(CONFIG[key].prefix + '-') === 0; });
    if (!target) fail('INVALID_LINK', 'Некорректный source_id');
    var source = findRelated(book, target, merged.sourceId);
    if (source.projectId && source.projectId !== merged.projectId) fail('INVALID_LINK', 'source_id относится к другому проекту');
  }
}
function toCell(entity, field, value) {
  if (value === '') return '';
  var kind = fieldKind(entity, field);
  if (kind === 'boolean') return value ? 'Да' : 'Нет';
  if (kind === 'date') return (Date.parse(value + 'T00:00:00Z') - Date.UTC(1899, 11, 30)) / 86400000;
  if (kind === 'time') { var parts = value.split(':').map(Number); return (parts[0] * 60 + parts[1]) / 1440; }
  // Escape formula-like user text; Sheets displays it as text, never executes it.
  if (typeof value === 'string' && /^[=+\-@]/.test(value)) return "'" + value;
  return value;
}
function validatedCellValue(cell, entity, field, value) {
  var adapted = fieldKind(entity, field) === 'boolean' ? (value ? 'Да' : 'Нет') : value;
  var rule = cell.getDataValidation();
  if (adapted !== '' && rule && !rule.getAllowInvalid()) {
    var criteria = String(rule.getCriteriaType());
    var allowed;
    if (criteria === 'VALUE_IN_LIST') allowed = rule.getCriteriaValues()[0].map(String);
    if (criteria === 'VALUE_IN_RANGE') allowed = rule.getCriteriaValues()[0].getDisplayValues().reduce(function(all, row) { return all.concat(row); }, []);
    if (allowed && allowed.indexOf(String(adapted)) < 0) fail('VALIDATION', 'Значение поля ' + field + ' не разрешено выпадающим списком таблицы');
  }
  return toCell(entity, field, value);
}
function mutate(book, request) {
  var entity = request.entity, config = CONFIG[entity];
  if (!Object.prototype.hasOwnProperty.call(CONFIG, entity)) fail('INVALID_ENTITY', 'Неизвестная сущность');
  diagnosticStage = "write:" + entity + ":validate";
  var sheet = sheetFor(book, entity), create = request.action === 'create';
  var clean = validateData(entity, request.data, create);
  // ID allocation and lookup happen under the same ScriptLock as all writes.
  var ids = sheet.getMaxRows() > 1 ? sheet.getRange(2, 1, sheet.getMaxRows() - 1, 1).getValues().map(function(row) { return row[0]; }) : [];
  diagnosticStage = "write:" + entity + ":allocate";
  var id, row, merged;
  if (create) {
    if (request.id !== undefined) fail('VALIDATION', 'ID создаётся backend');
    id = nextId(ids, config.prefix); row = firstEmptyIdRow(ids); merged = Object.assign({}, clean);
  } else {
    id = request.id;
    if (typeof id !== 'string' || !(new RegExp('^' + config.prefix + '-\\d{3,}$')).test(id)) fail('VALIDATION', 'Некорректный ID');
    var matches = ids.reduce(function(result, value, i) { if (String(value).trim() === id) result.push(i + 2); return result; }, []);
    if (matches.length !== 1) fail('NOT_FOUND', 'ID не найден или дублируется');
    row = matches[0];
    merged = Object.assign(rowData(entity, sheet.getRange(row, 1, 1, config.fields.length).getValues()[0], getSafeTimeZone(book), sheet.getRange(row, 1, 1, config.fields.length).getDisplayValues()[0]), clean);
  }
  diagnosticStage = "write:" + entity + ":links";
  resolveLinks(book, entity, clean, merged);
  if (entity === 'project' && merged.start && merged.deadline && merged.deadline < merged.start) fail('VALIDATION', 'Дедлайн раньше даты старта');
  if (entity === 'task' && merged.plannedDate && merged.deadline && merged.deadline < merged.plannedDate) fail('VALIDATION', 'Дедлайн раньше плановой даты');
  diagnosticStage = "write:" + entity + ":timestamp";
  var now = Utilities.formatDate(new Date(), getSafeTimeZone(book), 'yyyy-MM-dd HH:mm:ss');
  if (create) {
    // Require provisioned row with prefilled formulas; do not invent workbook structure.
    if (row > sheet.getMaxRows()) fail('NO_FREE_ROW', 'Добавьте свободные строки с формулами в существующий лист');
    config.fields.forEach(function(field) {
      if (!field || field === 'id') return;
      if (!(field in clean)) clean[field] = field === 'active' ? true : ['minutes', 'plannedMinutes', 'order', 'checkpoint'].indexOf(field) >= 0 ? 0 : '';
    });
    clean.createdAt = now;
    if (config.fields.indexOf('source') >= 0) clean.source = 'Ручной ввод';
  }
  if (config.fields.indexOf('updatedAt') >= 0) clean.updatedAt = now;
  diagnosticStage = "write:" + entity + ":preflight";
  var writes = [];
  config.fields.forEach(function(field, i) {
    if (!field || field === 'id' || !(field in clean)) return;
    var cell = sheet.getRange(row, i + 1);
    // Also refuse to overwrite unexpected formulas in editable cells.
    if (cell.getFormula()) fail('FORMULA_PROTECTED', 'Формула в редактируемой колонке ' + (i + 1));
    writes.push({cell: cell, field: field, value: validatedCellValue(cell, entity, field, clean[field])});
  });
  // All validation finishes before any changes. ID is written last for creates.
  diagnosticStage = "write:" + entity + ":cells";
  writes.forEach(function(write) {
    write.cell.setValue(write.value);
    var kind = fieldKind(entity, write.field);
    if (kind === 'date') write.cell.setNumberFormat('dd.MM.yyyy');
    if (kind === 'time') write.cell.setNumberFormat('HH:mm');
  });
  if (create) sheet.getRange(row, 1).setValue(id);
  SpreadsheetApp.flush();
  return {ok: true, apiVersion: 2, id: id};
}

// Calendar API calls are GET only. No calendar writes and no Activity mutations.
function calendarGet(path, params, missingAllowed) {
  var query = Object.keys(params || {}).map(function(key) {
    return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
  }).join('&');
  var response = UrlFetchApp.fetch('https://www.googleapis.com/calendar/v3/calendars/' + path + (query ? '?' + query : ''), {
    method: 'get', headers: {Authorization: 'Bearer ' + ScriptApp.getOAuthToken()}, muteHttpExceptions: true
  });
  var code = response.getResponseCode();
  if (missingAllowed && (code === 404 || code === 410)) return {status: 'cancelled'};
  if (code !== 200) fail('CALENDAR_ACCESS', 'Calendar API недоступен (' + code + '). Проверьте Calendar API, readonly-разрешение и доступ владельца к выбранным календарям. План мог частично сохраниться; повтор безопасен.');
  try { return JSON.parse(response.getContentText()); } catch (_) { fail('CALENDAR_ACCESS', 'Некорректный ответ Calendar API'); }
}
function calendarMapping(event, calendarId, timezone) {
  if (!event.id) fail('CALENDAR_DATA', 'Calendar Event без instance ID');
  if (event.status === 'cancelled') return {calendarId: calendarId, calendarEventId: event.id, status: 'Отменено'};
  if (!event.start || !event.end) fail('CALENDAR_DATA', 'Calendar Event без дат');
  var allDay = Boolean(event.start.date), start, end, date;
  if (allDay) {
    date = event.start.date;
    if (!isDate(date) || !isDate(event.end.date) || event.end.date <= date) fail('CALENDAR_DATA', 'Некорректная дата Calendar Event');
  } else {
    // Require an explicit RFC3339 offset; never interpret event times in host timezone.
    if (!/(?:[zZ]|[+-]\d\d:\d\d)$/.test(event.start.dateTime || '') || !/(?:[zZ]|[+-]\d\d:\d\d)$/.test(event.end.dateTime || '')) fail('CALENDAR_DATA', 'Calendar time требует timezone offset');
    start = new Date(event.start.dateTime); end = new Date(event.end.dateTime);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) fail('CALENDAR_DATA', 'Некорректное время Calendar Event');
    date = Utilities.formatDate(start, timezone, 'yyyy-MM-dd');
  }
  return {
    date: date, start: allDay ? '' : Utilities.formatDate(start, timezone, 'HH:mm'),
    end: allDay ? '' : Utilities.formatDate(end, timezone, 'HH:mm'),
    minutes: allDay ? 0 : Math.round((end - start) / 60000),
    name: String(event.summary || 'Без названия').slice(0, 10000), status: 'Запланировано',
    calendarId: calendarId, calendarEventId: event.id, source: 'Импорт'
  };
}
function calendarAllowed(cell) {
  var rule = cell.getDataValidation();
  if (!rule) return null;
  var kind = String(rule.getCriteriaType());
  if (kind === 'VALUE_IN_LIST') return rule.getCriteriaValues()[0].map(String);
  if (kind === 'VALUE_IN_RANGE') return rule.getCriteriaValues()[0].getDisplayValues().reduce(function(all, row) {return all.concat(row.map(String));}, []);
  fail('VALIDATION', 'Неподдерживаемая validation Calendar-поля. Проверьте dropdown План');
}
function calendarChoice(cell, candidates, field) {
  var allowed = calendarAllowed(cell);
  // Use established Phase 2 values only, and inspect even allow-invalid dropdowns.
  var choice = candidates.find(function(value) {return !allowed || allowed.indexOf(value) >= 0;});
  if (!choice) fail('VALIDATION', 'В План нет допустимого значения ' + field + ': ' + candidates.join(', '));
  return choice;
}
function syncCalendar(book, request) {
  diagnosticStage = 'calendar:configuration';
  var ids = request.calendarIds;
  if (!Array.isArray(ids) || !ids.length || ids.length > 20 || ids.some(function(id) {return typeof id !== 'string' || !id.trim() || id.length > 500;}) || new Set(ids).size !== ids.length)
    fail('VALIDATION', 'Укажите 1–20 уникальных выбранных calendar IDs');
  var past = request.pastDays, future = request.futureDays;
  if (!Number.isInteger(past) || past < 0 || past > 90 || !Number.isInteger(future) || future < 1 || future > 180) fail('VALIDATION', 'Окно Calendar: past 0–90, future 1–180 дней');
  var timezone = getSafeTimeZone(book), now = new Date();
  var min = new Date(now.getTime() - past * 86400000).toISOString(), max = new Date(now.getTime() + future * 86400000).toISOString();
  var sheet = sheetFor(book, 'plan'), config = CONFIG.plan;
  var rows = readRows(sheet, config.fields.length);
  var displays = rows.length ? sheet.getRange(2, 1, rows.length, config.fields.length).getDisplayValues() : [];
  var index = {}, existing = [];
  rows.forEach(function(row, i) {
    if (!String(row[0]).trim() || !row[14] || !row[15]) return;
    var key = JSON.stringify([String(row[14]), String(row[15])]);
    if (index[key]) fail('VALIDATION', 'Дубли calendar_id + calendar_event_id в План');
    var record = {row: i + 2, data: rowData('plan', row, timezone, displays[i])};
    index[key] = record; existing.push(record);
  });
  if (existing.filter(function(record) {return ids.indexOf(record.data.calendarId) >= 0;}).length > 1000) fail('CALENDAR_DATA', 'Превышен лимит 1000 импортированных Plan для выбранных календарей');
  // Complete every read before writes, so access/pagination failure cannot imply deletion.
  var events = {}, count = 0;
  ids.forEach(function(id) {
    diagnosticStage = 'calendar:read';
    var token, pages = {}, pageCount = 0;
    do {
      if (++pageCount > 100 || (token && pages[token])) fail('CALENDAR_DATA', 'Превышен лимит страниц Calendar; уменьшите окно');
      if (token) pages[token] = true;
      var params = {timeMin: min, timeMax: max, singleEvents: true, showDeleted: true, maxResults: 2500, timeZone: timezone};
      if (token) params.pageToken = token;
      var page = calendarGet(encodeURIComponent(id) + '/events', params, false);
      if (!Array.isArray(page.items)) fail('CALENDAR_DATA', 'Calendar API не вернул events');
      page.items.forEach(function(event) {
        if (++count > 10000) fail('CALENDAR_DATA', 'Слишком много событий; уменьшите окно');
        var mapped = calendarMapping(event, id, timezone);
        events[JSON.stringify([id, event.id])] = mapped;
      });
      token = page.nextPageToken;
    } while (token);
  });
  // Existing imported rows are individually checked, including moved/deleted instances
  // outside this window. Never cancel by absence from a bounded list.
  existing.forEach(function(record) {
    var data = record.data, key = JSON.stringify([String(data.calendarId), String(data.calendarEventId)]);
    if (ids.indexOf(data.calendarId) < 0 || events[key]) return;
    var event = calendarGet(encodeURIComponent(data.calendarId) + '/events/' + encodeURIComponent(data.calendarEventId), {}, true);
    if (!event.id) event.id = data.calendarEventId;
    events[key] = calendarMapping(event, data.calendarId, timezone);
  });
  var result = {created: 0, updated: 0, canceled: 0, skipped: 0};
  var planIds = rows.map(function(row) {return row[0];});
  Object.keys(events).forEach(function(key) {
    diagnosticStage = 'calendar:write';
    var data = events[key], record = index[key], cancelled = data.status === 'Отменено';
    if (cancelled && !record) {result.skipped++; return;}
    var create = !record, row = record ? record.row : firstEmptyIdRow(planIds);
    if (row > sheet.getMaxRows()) fail('NO_FREE_ROW', 'Добавьте свободные строки с формулами в План; повтор sync безопасен');
    data.status = calendarChoice(sheet.getRange(row, 11), [cancelled ? 'Отменено' : 'Запланировано'], 'Статус');
    if (!cancelled) data.source = calendarChoice(sheet.getRange(row, 14), ['Импорт'], 'Источник');
    if (create) {
      data.type = calendarChoice(sheet.getRange(row, 6), ['Встреча', 'Другое'], 'Тип');
      config.fields.forEach(function(field) {
        if (field && field !== 'id' && !(field in data)) data[field] = '';
      });
    }
    // Calendar owns no project/sourceId/notes/type on resync. Only cancellation
    // status changes for tombstones; previous event details and IDs are retained.
    var changed = create || Object.keys(data).some(function(field) {return String(data[field]) !== String(record.data[field]);});
    if (!changed) {result.skipped++; return;}
    var timestamp = Utilities.formatDate(now, timezone, 'yyyy-MM-dd HH:mm:ss');
    data.updatedAt = timestamp;
    if (create) data.createdAt = timestamp;
    var writes = [];
    Object.keys(data).forEach(function(field) {
      var col = config.fields.indexOf(field) + 1;
      if (col < 1) fail('VALIDATION', 'Недопустимое Calendar поле');
      var cell = sheet.getRange(row, col);
      if (cell.getFormula()) fail('FORMULA_PROTECTED', 'Формула в Calendar-owned колонке ' + col);
      writes.push({cell: cell, field: field, value: validatedCellValue(cell, 'plan', field, data[field])});
    });
    var id = create ? nextId(planIds, 'PLAN') : record.data.id;
    if (create && sheet.getRange(row, 1).getFormula()) fail('FORMULA_PROTECTED', 'Формула в plan_id');
    writes.forEach(function(write) {
      write.cell.setValue(write.value);
      var kind = fieldKind('plan', write.field);
      if (kind === 'date') write.cell.setNumberFormat('dd.MM.yyyy');
      if (kind === 'time') write.cell.setNumberFormat('HH:mm');
    });
    if (create) {sheet.getRange(row, 1).setValue(id); planIds[row - 2] = id; result.created++;}
    else if (cancelled) result.canceled++;
    else result.updated++;
  });
  SpreadsheetApp.flush();
  var lastSuccess = now.toISOString();
  PropertiesService.getScriptProperties().setProperty('CALENDAR_LAST_SUCCESS', lastSuccess);
  return {ok: true, apiVersion: 2, result: result, lastSuccess: lastSuccess};
}

// Run once from the Apps Script editor after applying the readonly manifest.
function authorizeCalendarReadOnly() {
  ScriptApp.getOAuthToken();
}
