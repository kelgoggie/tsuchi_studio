/**
 * Checks that the Studio schedules page lists ONLY paid/confirmed bookings.
 * Seeds one PENDING + one CONFIRMED booking on the same session, renders the
 * page, and asserts only the confirmed guest shows up.
 *
 * Usage: node scripts/schedule-check.mjs   (dev server must be running)
 */
import "dotenv/config"
import pg from "pg"
import crypto from "crypto"

const BASE = process.env.BASE_URL ?? "http://localhost:3000"
const WORKSHOP = "handbuilding"
const PERIOD = "AFTERNOON"

const token = crypto
  .createHmac("sha256", process.env.ADMIN_SECRET ?? "tsuchi-dev-secret-change-me")
  .update(process.env.ADMIN_PASSWORD ?? "")
  .digest("hex")

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

const d = new Date()
d.setUTCHours(0, 0, 0, 0)
d.setUTCDate(d.getUTCDate() + 31)
while (d.getUTCDay() === 1) d.setUTCDate(d.getUTCDate() + 1)
const DATE = d.toISOString().slice(0, 10)

const seed = (id, name, status) =>
  client.query(
    `insert into "Booking" (id, "workshopId", date, period, "partySize", name, email, status, "createdAt")
     values ($1, $2, $3::date, $4::"Period", 1, $5, 'schedcheck@example.com', $6::"BookingStatus", now())`,
    [id, WORKSHOP, DATE, PERIOD, name, status]
  )

try {
  await seed(`schedcheck_p_${Date.now()}`, "SCHEDCHECK PENDING", "PENDING")
  await seed(`schedcheck_c_${Date.now()}`, "SCHEDCHECK CONFIRMED", "CONFIRMED")

  const res = await fetch(`${BASE}/admin/schedule?d=${DATE}`, {
    headers: { cookie: `tsuchi_admin=${token}` },
  })
  const html = await res.text()

  const showsConfirmed = html.includes("SCHEDCHECK CONFIRMED")
  const showsPending = html.includes("SCHEDCHECK PENDING")

  console.log(`date=${DATE}  status=${res.status}\n`)
  console.log(`${showsConfirmed ? "PASS" : "FAIL"}  confirmed booking IS on the schedule`)
  console.log(`${!showsPending ? "PASS" : "FAIL"}  pending booking is NOT on the schedule`)
  console.log(`\n${showsConfirmed && !showsPending ? "ALL CHECKS PASSED" : "SOME CHECKS FAILED"}`)
} finally {
  await client.query(`delete from "Booking" where name like 'SCHEDCHECK%'`)
  await client.end()
}
