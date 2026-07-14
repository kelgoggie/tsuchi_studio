/**
 * End-to-end check of the full-payment-upfront changes.
 *
 * Usage: node scripts/payment-check.mjs   (dev server must be running)
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
const check = (label, pass, extra = "") => {
  results.push(pass)
  console.log(`${pass ? "PASS" : "FAIL"}  ${label}${extra ? `  ${extra}` : ""}`)
}

const d = new Date()
d.setUTCHours(0, 0, 0, 0)
d.setUTCDate(d.getUTCDate() + 33)
while (d.getUTCDay() === 1) d.setUTCDate(d.getUTCDate() + 1)
const DATE = d.toISOString().slice(0, 10)

async function book(payload) {
  const res = await fetch(`${BASE}/api/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date: DATE, period: "EVENING", partySize: 1, ...payload }),
  })
  return { ok: res.ok, ...(await res.json().catch(() => ({}))) }
}

try {
  await client.query(`delete from "Booking" where name like 'PAYCHECK%'`)

  // --- rug tufting: two pools of 1, strictly one medium + one large ---
  const caps = {}
  for (const w of ["rug-tufting-medium", "rug-tufting-large"]) {
    caps[w] = (await (await fetch(`${BASE}/api/availability?w=${w}`)).json()).capacity
  }
  check("medium rug tufting seats 1", caps["rug-tufting-medium"] === 1)
  check("large rug tufting seats 1", caps["rug-tufting-large"] === 1)

  const m1 = await book({
    workshopId: "rug-tufting-medium",
    name: "PAYCHECK Med",
    email: "pay1@example.com",
    invoiceVia: "EMAIL",
    feeAmount: 1800,
  })
  check("1 medium rug books", m1.ok)
  await client.query(`update "Booking" set status='CONFIRMED' where name like 'PAYCHECK%'`)

  const m2 = await book({
    workshopId: "rug-tufting-medium",
    name: "PAYCHECK Med2",
    email: "pay2@example.com",
    invoiceVia: "EMAIL",
    feeAmount: 1800,
  })
  check("a SECOND medium is refused (only one medium gun)", !m2.ok, `→ ${m2.error ?? ""}`)

  const lg = await book({
    workshopId: "rug-tufting-large",
    name: "PAYCHECK Large",
    email: "pay3@example.com",
    invoiceVia: "EMAIL",
    feeAmount: 2500,
  })
  check("a large rug still books in the same session", lg.ok)

  // --- invoice via Instagram: no email at all ---
  const ig = await book({
    workshopId: "handbuilding",
    name: "PAYCHECK Insta",
    instagram: "@paycheck",
    invoiceVia: "INSTAGRAM",
    feeAmount: 1200,
  })
  check("an Instagram-only booking is accepted (no email)", ig.ok, `→ ${ig.error ?? ""}`)

  const igRow = (
    await client.query(`select email, instagram, "invoiceVia" from "Booking" where id = $1`, [ig.id])
  ).rows[0]
  check("…and it stores no email", igRow?.email === null)
  check("…with invoiceVia = INSTAGRAM", igRow?.invoiceVia === "INSTAGRAM")

  // --- neither channel given: rejected ---
  const none = await book({
    workshopId: "handbuilding",
    name: "PAYCHECK None",
    invoiceVia: "INSTAGRAM",
    feeAmount: 1200,
  })
  check("a booking with no contact channel is refused", !none.ok, `→ ${none.error ?? ""}`)

  // --- full payment upfront is what gets stored ---
  const full = await book({
    workshopId: "handbuilding",
    name: "PAYCHECK Full",
    email: "pay4@example.com",
    invoiceVia: "EMAIL",
    partySize: 2,
    feeAmount: 2400, // 1200 x 2, the whole fee
  })
  const fullRow = (
    await client.query(`select "bookingFee" from "Booking" where id = $1`, [full.id])
  ).rows[0]
  check("the full fee is stored (1200 x 2 = 2400)", fullRow?.bookingFee === 2400)

  // --- the request-payment email renders with QR codes ---
  const html = await (await fetch(`${BASE}/admin/email/${full.id}?type=request`, { headers: cookie })).text()
  check("request email: subject carries the booking ID", html.includes(`Booking ID ${full.id}`))
  check("request email: thanks-for-choosing copy", html.includes("Thank you for choosing Tsuchi Studio"))
  check("request email: asks for the full amount", html.includes("PHP 2,400"))
  check("request email: GCash QR", html.includes("/assets/Gcash.svg"))
  check("request email: Bank QR", html.includes("/assets/BPI.svg"))
  check("request email: Instagram link", html.includes("instagram.com/tsuchi.studio"))

  // --- admin table no longer has a Remaining Fee column ---
  const admin = await (await fetch(`${BASE}/admin?q=PAYCHECK`, { headers: cookie })).text()
  check("admin table: no Remaining Fee column", !admin.includes("Remaining Fee"))
  check("admin table: has a Request payment button", admin.includes("Request payment"))

  console.log(`\n${results.every(Boolean) ? "ALL CHECKS PASSED" : "SOME CHECKS FAILED"}`)
} finally {
  await client.query(`delete from "Booking" where name like 'PAYCHECK%'`)
  await client.end()
}
