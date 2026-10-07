// PERSONAL OS PHASE 2. Replace the complete deployed Code.gs with this file.
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

function fail(code, message) {
  var error = new Error(message);
  error.code = code;
  throw error;
}
function jsonResponse(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function doPost(e) {
  try {
    var props = PropertiesService.getScriptProperties();
    var secret = props.getProperty('API_SECRET');
    var spreadsheetId = props.getProperty('SPREADSHEET_ID');
    if (!secret || !spreadsheetId) fail('CONFIGURATION', 'Настройте API_SECRET и SPREADSHEET_ID в Script Properties');
    var request;
    try { request = JSON.parse(e.postData.contents); } catch (_) { fail('INVALID_JSON', 'Ожидается JSON'); }
    if (!request || typeof request !== 'object' || request.secret !== secret) fail('UNAUTHORIZED', 'Доступ запрещён');
    if (['snapshot', 'read', 'create', 'update'].indexOf(request.action) < 0) fail('INVALID_ACTION', 'Неизвестное действие');
    var book = SpreadsheetApp.openById(spreadsheetId);
    if (request.action === 'snapshot' || request.action === 'read') return jsonResponse({ok: true, apiVersion: 2, data: snapshot(book)});
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(20000)) fail('BUSY', 'Запись занята. Попробуйте позже');
    try {
      return jsonResponse(mutate(book, request));
    } finally { lock.releaseLock(); }
  } catch (error) {
    // Do not return internal exceptions: they may contain deployment details.
    return jsonResponse({ok: false, error: {code: error.code || 'BACKEND_ERROR', message: error.code ? error.message : 'Ошибка Apps Script. Проверьте журнал выполнения'}});
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
function snapshot(book) {
  var result = {};
  Object.keys(CONFIG).forEach(function(entity) {
    var config = CONFIG[entity];
    var sheet = sheetFor(book, entity);
    var timezone = book.getSpreadsheetTimeZone();
    result[config.sheet] = readRows(sheet, config.headers.length).filter(function(row) { return String(row[0]).trim(); }).map(function(row) {
      var item = {};
      config.headers.forEach(function(header, i) {
        var value = row[i];
        if (value instanceof Date) {
          var isTime = ['Начало', 'Конец', 'Время'].indexOf(header) >= 0;
          value = Utilities.formatDate(value, timezone, isTime ? 'HH:mm' : 'yyyy-MM-dd');
        }
        item[header] = value;
      });
      return item;
    });
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
function rowData(entity, row, timezone) {
  var item = {};
  CONFIG[entity].fields.forEach(function(field, i) {
    if (!field) return;
    var value = row[i];
    if (value instanceof Date) value = Utilities.formatDate(value, timezone, fieldKind(entity, field) === 'time' ? 'HH:mm' : 'yyyy-MM-dd');
    // Date/time serials may be returned as numbers depending on existing formatting.
    if (typeof value === 'number' && fieldKind(entity, field) === 'date') value = new Date(Date.UTC(1899, 11, 30) + Math.floor(value) * 86400000).toISOString().slice(0,10);
    item[field] = value;
  });
  return item;
}
function findRelated(book, entity, id) {
  if (typeof id !== 'string' || !(new RegExp('^' + CONFIG[entity].prefix + '-\\d{3,}$')).test(id)) fail('VALIDATION', 'Некорректный ID связи');
  var rows = readRows(sheetFor(book, entity), CONFIG[entity].fields.length);
  var matches = rows.filter(function(row) { return String(row[0]).trim() === id; });
  if (matches.length !== 1) fail('INVALID_LINK', 'Связь не существует или ID дублируется: ' + id);
  return rowData(entity, matches[0], book.getSpreadsheetTimeZone());
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
  if (kind === 'date') return (Date.parse(value + 'T00:00:00Z') - Date.UTC(1899, 11, 30)) / 86400000;
  if (kind === 'time') { var parts = value.split(':').map(Number); return (parts[0] * 60 + parts[1]) / 1440; }
  // Escape formula-like user text; Sheets displays it as text, never executes it.
  if (typeof value === 'string' && /^[=+\-@]/.test(value)) return "'" + value;
  return value;
}
function mutate(book, request) {
  var entity = request.entity, config = CONFIG[entity];
  if (!Object.prototype.hasOwnProperty.call(CONFIG, entity)) fail('INVALID_ENTITY', 'Неизвестная сущность');
  var sheet = sheetFor(book, entity), create = request.action === 'create';
  var clean = validateData(entity, request.data, create);
  // ID allocation and lookup happen under the same ScriptLock as all writes.
  var ids = sheet.getMaxRows() > 1 ? sheet.getRange(2, 1, sheet.getMaxRows() - 1, 1).getValues().map(function(row) { return row[0]; }) : [];
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
    merged = Object.assign(rowData(entity, sheet.getRange(row, 1, 1, config.fields.length).getValues()[0], book.getSpreadsheetTimeZone()), clean);
  }
  resolveLinks(book, entity, clean, merged);
  if (entity === 'project' && merged.start && merged.deadline && merged.deadline < merged.start) fail('VALIDATION', 'Дедлайн раньше даты старта');
  if (entity === 'task' && merged.plannedDate && merged.deadline && merged.deadline < merged.plannedDate) fail('VALIDATION', 'Дедлайн раньше плановой даты');
  var now = Utilities.formatDate(new Date(), book.getSpreadsheetTimeZone(), 'yyyy-MM-dd HH:mm:ss');
  if (create) {
    // Require provisioned row with prefilled formulas; do not invent workbook structure.
    if (row > sheet.getMaxRows()) fail('NO_FREE_ROW', 'Добавьте свободные строки с формулами в существующий лист');
    config.fields.forEach(function(field) {
      if (!field || field === 'id') return;
      if (!(field in clean)) clean[field] = field === 'active' ? true : ['minutes', 'plannedMinutes', 'order', 'checkpoint'].indexOf(field) >= 0 ? 0 : '';
    });
    clean.createdAt = now;
    if (config.fields.indexOf('source') >= 0) clean.source = 'Вручную';
  }
  if (config.fields.indexOf('updatedAt') >= 0) clean.updatedAt = now;
  var writes = [];
  config.fields.forEach(function(field, i) {
    if (!field || field === 'id' || !(field in clean)) return;
    var cell = sheet.getRange(row, i + 1);
    // Also refuse to overwrite unexpected formulas in editable cells.
    if (cell.getFormula()) fail('FORMULA_PROTECTED', 'Формула в редактируемой колонке ' + (i + 1));
    writes.push({cell: cell, field: field, value: toCell(entity, field, clean[field])});
  });
  // All validation finishes before any changes. ID is written last for creates.
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
