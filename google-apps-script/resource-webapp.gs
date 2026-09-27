const SPREADSHEET_ID = "1k6Hq11F4LUt73e2fSIi1iV4RhHQmFg36N-2TQ3H-S74";
const PROJECTS_SPREADSHEET_ID = "1Fckp1WwVp8WM7d3tuu-yNyXviDVBn1zr0huhHiJTAP8";
const PROJECTS_SHEET_NAME = "活動總表";
const PROJECTS_HEADER_ROW = 5;
const SOP_FOLDER_ID = "12sV1AcbL9-7uTfuuKCx0Lh-XR9hh2cRT";
const SOP_FILE_SHARE_WITH_LINK = true;
const READABLE_SHEETS = ["projects", "inventory"];
const PRIVATE_READABLE_SHEETS = ["media"];
const SESSION_TTL_SECONDS = 21600;

function doPost(event) {
  try {
    const payload = JSON.parse(event.postData.contents || "{}");
    const result = payload.action === "login"
      ? handleLogin(payload)
      : payload.action === "readPrivateSheet"
        ? handlePrivateSheetRead(payload)
      : payload.action === "uploadSopFile"
        ? handleSopFileUpload(payload)
        : handleMutation(payload);
    return jsonResponse({ ok: true, result });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function handleLogin(payload) {
  const identifier = String(payload.identifier || "").trim().toLowerCase();
  const password = String(payload.password || "").trim();
  if (!identifier || !password) throw new Error("請輸入帳號與密碼");

  const accounts = readSheetRows("accounts");
  const account = accounts.find((row) => {
    const email = String(row.email || "").trim().toLowerCase();
    const emailAccount = email.split("@")[0];
    return [String(row.id || ""), String(row.name || ""), email, emailAccount]
      .map((value) => value.trim().toLowerCase())
      .includes(identifier);
  });

  if (!account || String(account.password || "").trim() !== password) {
    throw new Error("帳號或密碼不正確，請依 accounts 分頁確認");
  }
  if (["停用", "已停用", "disabled"].includes(String(account.status || "").trim().toLowerCase())) {
    throw new Error("此帳號已停用，請聯絡管理者");
  }

  const isManager = ["manager", "admin", "管理者"].includes(String(account.role || "").trim().toLowerCase());
  const sessionToken = createSessionToken(account.id);
  return {
    account,
    accounts: isManager ? accounts : [account],
    sessionToken,
    media: readSheetRows("media"),
  };
}

function createSessionToken(accountId) {
  const token = Utilities.getUuid();
  CacheService.getScriptCache().put(`resource-session:${token}`, String(accountId || ""), SESSION_TTL_SECONDS);
  return token;
}

function requireSession(sessionToken) {
  const token = String(sessionToken || "").trim();
  if (!token || !CacheService.getScriptCache().get(`resource-session:${token}`)) {
    throw new Error("登入狀態已失效，請重新登入");
  }
}

function handlePrivateSheetRead(payload) {
  requireSession(payload.sessionToken);
  const sheetName = String(payload.sheet || "");
  if (!PRIVATE_READABLE_SHEETS.includes(sheetName)) throw new Error("Sheet is not available for private reading");
  return { sheet: sheetName, rows: readSheetRows(sheetName) };
}

function doGet(event) {
  try {
    const action = event && event.parameter ? event.parameter.action : "";
    if (action === "read") {
      const sheetName = String(event.parameter.sheet || "");
      if (!READABLE_SHEETS.includes(sheetName)) throw new Error("Sheet is not available for public reading");
      const rows = sheetName === "projects" ? readProjectRows() : readSheetRows(sheetName);
      return jsonResponse({ ok: true, result: { sheet: sheetName, rows } });
    }
    return jsonResponse({ ok: true, name: "resource web app" });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function readProjectRows() {
  const spreadsheet = SpreadsheetApp.openById(PROJECTS_SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(PROJECTS_SHEET_NAME);
  if (!sheet) throw new Error(`Sheet not found: ${PROJECTS_SHEET_NAME}`);

  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow <= PROJECTS_HEADER_ROW || !lastColumn) return [];

  const values = sheet
    .getRange(PROJECTS_HEADER_ROW, 1, lastRow - PROJECTS_HEADER_ROW + 1, lastColumn)
    .getDisplayValues();
  const headers = values.shift().map(String);
  const nameColumn = headers.indexOf("活動名稱");

  return values
    .filter((row) => nameColumn >= 0 && String(row[nameColumn] || "").trim())
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
}

function readSheetRows(sheetName) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) throw new Error(`Sheet not found: ${sheetName}`);

  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];
  const headers = values[0].map(String);
  return values.slice(1)
    .filter((row) => row.some((value) => String(value).trim()))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])));
}

function handleMutation(payload) {
  const action = payload.action;
  const sheetName = payload.sheet;
  const row = payload.row || {};

  if (!["create", "update", "delete"].includes(action)) throw new Error("Invalid action");
  if (!sheetName) throw new Error("Missing sheet");
  if (!row.id) throw new Error("Missing row id");
  if (sheetName === "projects") return handleProjectMutation(payload);
  if (PRIVATE_READABLE_SHEETS.includes(sheetName)) requireSession(payload.sessionToken);

  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) throw new Error(`Sheet not found: ${sheetName}`);

  const headers = getHeaders(sheet);
  if (!headers.length) throw new Error(`Sheet has no headers: ${sheetName}`);

  const rowIndex = findRowIndexById(sheet, headers, row.id);
  if (action === "delete") {
    if (rowIndex > 0) sheet.deleteRow(rowIndex);
    return { action, sheet: sheetName, id: row.id };
  }

  const values = headers.map((header) => row[header] !== undefined ? row[header] : "");
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, headers.length).setValues([values]);
  } else {
    sheet.appendRow(values);
  }
  return { action, sheet: sheetName, id: row.id };
}

function handleProjectMutation(payload) {
  if (payload.action !== "update") throw new Error("Projects only support closeout analysis updates");
  requireSession(payload.sessionToken);

  const row = payload.row || {};
  const spreadsheet = SpreadsheetApp.openById(PROJECTS_SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(PROJECTS_SHEET_NAME);
  if (!sheet) throw new Error(`Sheet not found: ${PROJECTS_SHEET_NAME}`);

  const lastColumn = sheet.getLastColumn();
  const headers = sheet.getRange(PROJECTS_HEADER_ROW, 1, 1, lastColumn).getDisplayValues()[0].map(String);
  const idColumn = headers.indexOf("活動編號") + 1;
  const successesColumn = headers.indexOf("成功經驗") + 1;
  const improvementsColumn = headers.indexOf("待改進事項") + 1;
  if (!idColumn || !successesColumn || !improvementsColumn) throw new Error("活動總表缺少結案分析欄位");

  const firstDataRow = PROJECTS_HEADER_ROW + 1;
  const lastRow = sheet.getLastRow();
  if (lastRow < firstDataRow) throw new Error("活動總表沒有專案資料");
  const ids = sheet.getRange(firstDataRow, idColumn, lastRow - firstDataRow + 1, 1).getDisplayValues();
  const projectId = String(row.code || row.id || "").trim();
  const offset = ids.findIndex((value) => String(value[0] || "").trim() === projectId);
  if (offset < 0) throw new Error(`Project not found: ${projectId}`);

  const rowIndex = firstDataRow + offset;
  sheet.getRange(rowIndex, successesColumn).setValue(String(row.successes || ""));
  sheet.getRange(rowIndex, improvementsColumn).setValue(String(row.improvements || ""));
  return { action: "update", sheet: "projects", id: projectId };
}

function handleSopFileUpload(payload) {
  const row = payload.row || {};
  const file = payload.file || {};
  if (!row.id) throw new Error("Missing row id");
  if (!file.name || !file.data) throw new Error("Missing SOP file");

  const folder = DriveApp.getFolderById(SOP_FOLDER_ID);
  const bytes = Utilities.base64Decode(file.data);
  const safeName = buildSopFileName(row, file.name);
  const blob = Utilities.newBlob(bytes, file.mimeType || "application/octet-stream", safeName);
  const driveFile = folder.createFile(blob);

  if (SOP_FILE_SHARE_WITH_LINK) {
    driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  }

  const nextRow = Object.assign({}, row, { fileUrl: driveFile.getUrl() });
  handleMutation({ action: "update", sheet: "sops", row: nextRow });
  return { action: "uploadSopFile", sheet: "sops", id: row.id, fileUrl: driveFile.getUrl() };
}

function buildSopFileName(row, originalName) {
  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmmss");
  const title = String(row.title || row.id || "sop").replace(/[\\/:*?"<>|#%{}~&]/g, "-").slice(0, 80);
  const name = String(originalName).replace(/[\\/:*?"<>|#%{}~&]/g, "-");
  return `${timestamp}-${title}-${name}`;
}

function getHeaders(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (!lastColumn) return [];
  return sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);
}

function findRowIndexById(sheet, headers, id) {
  const idColumn = headers.indexOf("id") + 1;
  if (!idColumn) throw new Error("Missing id header");
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const ids = sheet.getRange(2, idColumn, lastRow - 1, 1).getValues();
  const offset = ids.findIndex((value) => String(value[0]) === String(id));
  return offset >= 0 ? offset + 2 : -1;
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
