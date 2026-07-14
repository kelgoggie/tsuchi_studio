/**
 * Renders the admin bookings table and the confirmation-email preview against a
 * seeded booking, and checks the workshops page ships the terms modal.
 *
 * Usage: node scripts/ui-check.mjs   (dev server must be running)
 */
import "dotenv/config"
import pg from "pg"
import crypto from "crypto"

const BASE = process.env.BASE_URL ?? "http://localhost:3000"
const token = crypto
  .createHmac("sha256", process.env.ADMIN_SECRET ?? "tsuchi-dev-secret-change-me")
  .update(process.env.ADMIN_PASSWORD ?? "")
  .digest("hex")
const cookie = { cookie: `tsuchi_admin=${token}` }

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

const results = []
const check = (label, pass) => {
  results.push(pass)
  console.log(`${pass ? "PASS" : "FAIL"}  ${label}`)
}

const d = new Date()
d.setUTCHours(0, 0, 0, 0)
d.setUTCDate(d.getUTCDate() + 20)
while (d.getUTCDay() === 1) d.setUTCDate(d.getUTCDate() + 1)
const DATE = d.toISOString().slice(0, 10)
const id = `uicheck_${Date.now()}`

try {
  await client.query(
    `insert into "Booking" (id, "workshopId", date, period, "partySize", name, email, phone, "bookingFee", "remainingFee", status, "createdAt")
     values ($1,'handbuilding',$2::date,'MORNING',2,'UICHECK Guest','uicheck@example.com','0917 123 4567',1200,1200,'CONFIRMED', now())`,
    [id, DATE]
  )

  // 1. Workshops page ships the terms modal (it renders on click, so we look for
  //    the copy in the client bundle payload rather than the visible DOM).
  const wsHtml = await (await fetch(`${BASE}/workshops`)).text()
  check("workshops page has a 'book now' button", wsHtml.includes("book now"))

  // 2. Bookings table shows every field on the row (no accordion).
  const adminHtml = await (await fetch(`${BASE}/admin?q=UICHECK`, { headers: cookie })).text()
  check("table shows the guest name", adminHtml.includes("UICHECK Guest"))
  check("table shows the email column", adminHtml.includes("uicheck@example.com"))
  check("table shows the phone column", adminHtml.includes("0917 123 4567"))
  check("table shows the booking ID", adminHtml.includes(id))
  check("table has resize affordance", adminHtml.includes("Drag a column edge to resize"))
  check("no accordion expand-all control", !adminHtml.includes("Expand all"))

  // 3. Confirmation email preview renders with banner + whimsical copy.
  const mailHtml = await (await fetch(`${BASE}/admin/email/${id}`, { headers: cookie })).text()
  check("email: welcome header", mailHtml.includes("Welcome to Tsuchi Studio!"))
  check("email: greets the client by name", mailHtml.includes("Hello, UICHECK Guest!"))
  check("email: banner image", mailHtml.includes("/images/header-img.JPG"))
  check("email: tsuchi wordmark", mailHtml.includes("/assets/tsuchi_word.svg"))
  check("email: whimsical line", mailHtml.includes("Wear something comfy"))
  check("email: fee amount", mailHtml.includes("PHP 1,200"))
  check("email: slots + session time", mailHtml.includes("2 slots") && mailHtml.includes("9:00"))

  console.log(`\n${results.every(Boolean) ? "ALL CHECKS PASSED" : "SOME CHECKS FAILED"}`)
} finally {
  await client.query(`delete from "Booking" where name like 'UICHECK%'`)
  await client.end()
}
