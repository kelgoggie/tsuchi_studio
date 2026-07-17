/**
 * Tsuchi Studio — Google Sheets webhook.
 *
 * Paste this into the Apps Script editor bound to the bookings sheet, then:
 *   Deploy → Manage deployments → ✏️ Edit → Version: **New version** → Deploy
 * Saving alone is NOT enough — a deployment serves a pinned version, so without
 * publishing a new version the old code keeps running.
 *
 * The site sends two kinds of payload to the /exec URL:
 *   • a new booking            → appended as a new row
 *   • { action: "update", … }  → finds the row by Booking ID and rewrites it
 *
 * An update payload only contains the fields that changed, so we write just the
 * keys that are present. "Booked On" and "Booking ID" are never overwritten.
 */

// Column positions, 1-indexed, matching the sheet headers.
//
// The studio now takes FULL payment upfront, so the old "Remaining Fee" column
// is gone — delete it from the sheet so these positions line up again.
//
// NEW: the site now sends the booking notes (add-on marker + anything the
// guest typed). Add a "Notes" header in column O, then redeploy this script
// as a **New version** (see the header comment above).
var COLS = {
  bookedOn: 1,       // Booked On
  name: 2,           // Name
  id: 3,             // Booking ID
  workshop: 4,       // Workshop
  date: 5,           // Workshop Date
  day: 6,            // Day
  session: 7,        // Session
  slots: 8,          // Slots
  phone: 9,          // Contact No.
  email: 10,         // Email Address
  instagram: 11,     // Instagram
  invoiceVia: 12,    // Invoice Via  (EMAIL or INSTAGRAM — how they want the invoice)
  bookingFee: 13,    // Amount Paid  (the full class fee)
  bookingStatus: 14, // Booking Status
  notes: 15          // Notes  (add-on marker + guest notes)
};

var ID_COL = COLS.id;
var STATUS_COL = COLS.bookingStatus;

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var d = JSON.parse(e.postData.contents);

  if (d.action === "reset") return resetRows(sheet, d);
  return d.action === "update" ? updateRow(sheet, d) : appendRow(sheet, d);
}

/**
 * Wipe every data row (the header row stays) so the sheet can be rebuilt from
 * the database — used by scripts/rebuild-sheet.mjs. The confirm phrase keeps a
 * stray or malformed payload from emptying the sheet by accident.
 */
function resetRows(sheet, d) {
  if (d.confirm !== "yes-wipe-rows") return json({ ok: false, error: "missing confirm phrase" });
  var last = sheet.getLastRow();
  var cleared = Math.max(0, last - 1);
  if (cleared > 0) sheet.deleteRows(2, cleared);
  return json({ ok: true, cleared: cleared });
}

/** Row number of the booking with this ID, or 0 if it isn't in the sheet. */
function findRowById(sheet, id) {
  var last = sheet.getLastRow();
  if (last < 2) return 0; // headers only

  var ids = sheet.getRange(2, ID_COL, last - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2; // +2: skip header, 1-index
  }
  return 0;
}

function updateRow(sheet, d) {
  var row = findRowById(sheet, d.id);
  if (!row) return json({ ok: false, error: "Booking ID not found: " + d.id });

  // Write only the fields this payload carries. An empty string is meaningful
  // (it clears the cell); undefined/null means "leave this column alone".
  for (var key in COLS) {
    if (key === "bookedOn" || key === "id") continue; // never rewritten
    if (d[key] === undefined || d[key] === null) continue;
    sheet.getRange(row, COLS[key]).setValue(d[key]);
  }

  paintStatus(sheet, row);
  return json({ ok: true, row: row });
}

function appendRow(sheet, d) {
  sheet.appendRow([
    d.bookedOn ? new Date(d.bookedOn) : new Date(),
    d.name,
    d.id,
    d.workshop,
    d.date,
    d.day,
    d.session,
    d.slots,
    d.phone,
    d.email,
    d.instagram,
    d.invoiceVia || "EMAIL",
    d.bookingFee,
    d.bookingStatus || "UNPAID",
    d.notes || ""
  ]);

  paintStatus(sheet, sheet.getLastRow());
  return json({ ok: true });
}

/** Colour the status cell to match its value. */
function paintStatus(sheet, row) {
  var cell = sheet.getRange(row, STATUS_COL);
  cell.setBackground(statusColor(cell.getValue()));
}

function statusColor(s) {
  s = String(s).toUpperCase();
  if (s.indexOf("CANCEL") >= 0) return "#f4c7c3"; // red
  if (s.indexOf("PAID") === 0 || s.indexOf("CONFIRMED") >= 0) return "#c6efce"; // green
  return "#e0e0e0"; // gray — UNPAID
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
