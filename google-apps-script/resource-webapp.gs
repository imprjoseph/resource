const SPREADSHEET_ID = "1k6Hq11F4LUt73e2fSIi1iV4RhHQmFg36N-2TQ3H-S74";
const SOP_FOLDER_ID = "12sV1AcbL9-7uTfuuKCx0Lh-XR9hh2cRT";
const SOP_FILE_SHARE_WITH_LINK = true;
const READABLE_SHEETS = ["inventory"];

function doPost(event) {
  try {
    const payload = JSON.parse(event.postData.contents || "{}");
    const result = payload.action === "login"
      ? handleLogin(payload)
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
  return {
    account,
    accounts: isManager ? accounts : [account],
  };
}

function doGet(event) {
  try {
    const action = event && event.parameter ? event.parameter.action : "";
    if (action === "read") {
      const sheetName = String(event.parameter.sheet || "");
      if (!READABLE_SHEETS.includes(sheetName)) throw new Error("Sheet is not available for public reading");
      return jsonResponse({ ok: true, result: { sheet: sheetName, rows: readSheetRows(sheetName) } });
    }
    return jsonResponse({ ok: true, name: "resource web app" });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error && error.message ? error.message : error) });
  }
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
