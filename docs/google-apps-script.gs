const SHEET_NAME = "Activity";

function doGet(e) {
  try {
    const sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME) ||
      SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);

    // Create the headers if the sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Name",
        "Time Started",
        "Time Closed"
      ]);

      sheet.getRange("B:C").setNumberFormat("yyyy-MM-dd HH:mm:ss");
    }

    const p = e.parameter || {};

    // If someone simply opens the Web App URL
    if (!p.action) {
      return ContentService
        .createTextOutput("Rise tracker is working.")
        .setMimeType(ContentService.MimeType.TEXT);
    }

    const name = p.name || "";
    const sessionId = p.sessionId || "";
    const action = p.action;

    if (!name || !sessionId) {
      return ContentService
        .createTextOutput("Missing name or session ID")
        .setMimeType(ContentService.MimeType.TEXT);
    }

    // Look for this session
    const lastRow = sheet.getLastRow();
    let existingRow = -1;

    if (lastRow > 1) {
      const sessionIds = sheet
        .getRange(2, 4, lastRow - 1, 1)
        .getValues();

      for (let i = 0; i < sessionIds.length; i++) {
        if (String(sessionIds[i][0]) === String(sessionId)) {
          existingRow = i + 2;
          break;
        }
      }
    }

    // START
    if (action === "start") {
      if (existingRow === -1) {
        sheet.appendRow([
          name,
          new Date(),
          "",
          sessionId
        ]);
      }

      return ContentService
        .createTextOutput("START OK")
        .setMimeType(ContentService.MimeType.TEXT);
    }

    // CLOSE
    if (action === "close") {
      if (existingRow !== -1) {
        sheet.getRange(existingRow, 3).setValue(new Date());
      }

      return ContentService
        .createTextOutput("CLOSE OK")
        .setMimeType(ContentService.MimeType.TEXT);
    }

    return ContentService
      .createTextOutput("Unknown action")
      .setMimeType(ContentService.MimeType.TEXT);

  } catch (err) {
    return ContentService
      .createTextOutput("ERROR: " + String(err))
      .setMimeType(ContentService.MimeType.TEXT);
  }
}