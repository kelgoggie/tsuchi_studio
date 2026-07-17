/**
 * Rebuild the Google Sheet from the database (the source of truth).
 *
 * Wipes every data row in the sheet (headers stay), then re-appends every
 * booking in the database, oldest first — same payload shape the live site
 * sends, so the columns land exactly like organic rows.
 *
 * Usage: node scripts/rebuild-sheet.mjs
 *
 * Prereqs:
 *   • the updated Code.gs (with the "reset" action) is deployed as a NEW version
 *   • the sheet has the "Notes" header in column O
 *   • tip: duplicate the sheet tab first as a backup
 */
import "dotenv/config"
import pg from "pg"

const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL
if (!url) {
  console.error("GOOGLE_SHEETS_WEBHOOK_URL is not set.")
  process.exit(1)
}

// Mirrors PERIOD_LABELS / SHEET_STATUS in the app.
const SESSION = { MORNING: "Morning · 9:00–12:00", AFTERNOON: "Afternoon · 1:00–4:00", EVENING: "Evening · 4:00–7:00" }
const STATUS = { CONFIRMED: "PAID - CONFIRMED", PENDING: "UNPAID", CANCELLED: "CANCELLED" }

async function post(payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return res.json()
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()
const { rows } = await client.query(`
  select b.*, w.name as workshop_name
  from "Booking" b
  join "Workshop" w on w.id = b."workshopId"
  order by b."createdAt" asc
`)
await client.end()

const wiped = await post({ action: "reset", confirm: "yes-wipe-rows" })
if (!wiped.ok) {
  console.error("Reset failed — is the new Code.gs version deployed?", wiped)
  process.exit(1)
}
console.log(`Cleared ${wiped.cleared} row(s). Re-appending ${rows.length} booking(s)…`)

let failed = 0
for (const b of rows) {
  const res = await post({
    bookedOn: b.createdAt.toISOString(),
    name: b.name,
    id: b.id,
    workshop: b.workshop_name,
    date: b.date.toISOString().slice(0, 10),
    day: b.date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }),
    session: SESSION[b.period] ?? b.period,
    slots: b.partySize,
    phone: b.phone ?? "",
    email: b.email ?? "",
    instagram: b.instagram ?? "",
    invoiceVia: b.invoiceVia ?? (b.email ? "EMAIL" : "INSTAGRAM"),
    bookingFee: b.bookingFee ?? "",
    bookingStatus: STATUS[b.status] ?? b.status,
    notes: b.notes ?? "",
  })
  if (res.ok) {
    console.log(`  ✓ ${b.createdAt.toISOString().slice(0, 10)}  ${b.name}`)
  } else {
    failed++
    console.error(`  ✗ ${b.id}: ${JSON.stringify(res)}`)
  }
}

console.log(failed ? `Done with ${failed} failure(s) — see above.` : "Done — sheet rebuilt cleanly.")
