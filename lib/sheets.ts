/**
 * Forward a booking to Google Sheets via a Google Apps Script web app.
 *
 * Setup (owner-friendly, no Google Cloud project needed):
 *  1. In the target Google Sheet: Extensions > Apps Script.
 *  2. Paste a doPost(e) that appends JSON.parse(e.postData.contents) as a row.
 *  3. Deploy > New deployment > Web app > Execute as "Me", access "Anyone".
 *  4. Put the deployment URL in GOOGLE_SHEETS_WEBHOOK_URL.
 *
 * Fire-and-forget: a Sheets failure must never block a booking.
 */
export async function forwardToSheet(payload: Record<string, unknown>): Promise<void> {
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL
  if (!url) return
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.error("Google Sheets forward failed:", err)
  }
}
