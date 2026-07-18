const SPREADSHEET_ID = "1k6Hq11F4LUt73e2fSIi1iV4RhHQmFg36N-2TQ3H-S74";

function doPost(event) {
  try {
    const payload = JSON.parse(event.postData.contents || "{}");
    const result = handleMutation(payload);
    return jsonResponse({ ok: true, result });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function doGet() {
  return jsonResponse({ ok: true, name: "resource web app" });
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
