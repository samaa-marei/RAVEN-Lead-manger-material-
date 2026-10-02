/*
Google Apps Script backend for the Rise tracking layer.

1. Create a Google Sheet.
2. Extensions -> Apps Script.
3. Replace the default code with this.
4. Deploy -> New deployment -> Web app.
5. Execute as: Me.
6. Who has access: Anyone.
7. Copy the Web app URL into tracker-config.js.

The first row will be created automatically.
*/

const SHEET_NAME = "Activity";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || "{}");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Server time",
        "Course ID",
        "Session ID",
        "Name",
        "Event",
        "Client timestamp",
        "Started at",
        "Active seconds"
      ]);
    }

    sheet.appendRow([
      new Date(),
      data.courseId || "",
      data.sessionId || "",
      data.name || "",
      data.event || "",
      data.timestamp || "",
      data.startedAt || "",
      Number(data.activeSeconds || 0)
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
