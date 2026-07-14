/**
 * End-to-end check of seat accounting.
 *
 * Drives the real /api/availability endpoint (the same one the booking calendar
 * and both admin forms read) while flipping a test booking's status directly in
 * the database. Proves that seats drop on confirm and come back on cancel.
 *
 * Usage: node scripts/slot-check.mjs     (dev server must be running)
 */
import "dotenv/config"
import pg from "pg"

const BASE = process.env.BASE_URL ?? "http://localhost:3000"
const WORKSHOP = "wheel-throwing" // capacity 2 — small, so changes are obvious
const PERIOD = "MORNING"
const PARTY = 2

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

// A date inside the booking window that isn't a Monday, isn't closed, and has no blocks.
function pickDate() {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + 30)
  while (d.getUTCDay() === 1) d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}
const DATE = pickDate()

async function seatsTaken() {
  const res = await fetch(`${BASE}/api/availability?w=${WORKSHOP}`)
  const d = await res.json()
  if (typeof d.capacity !== "number") throw new Error("bad availability response")
  const taken = d.booked?.[DATE]?.[PERIOD] ?? 0
  return { capacity: d.capacity, taken, left: d.capacity - taken }
}

const results = []
const check = (label, actual, expected) => {
  const pass = actual === expected
  results.push(pass)
  console.log(`${pass ? "PASS" : "FAIL"}  ${label}: seats left = ${actual} (expected ${expected})`)
}

try {
  console.log(`workshop=${WORKSHOP}  date=${DATE}  session=${PERIOD}  party=${PARTY}\n`)

  const base = await seatsTaken()
  console.log(`capacity ${base.capacity}, baseline seats left ${base.left}\n`)

  // 1. A PENDING booking must NOT hold a seat (first-come-first-served by receipt).
  const ins = await client.query(
    `insert into "Booking" (id, "workshopId", date, period, "partySize", name, email, status, "createdAt")
     values ($1, $2, $3::date, $4::"Period", $5, 'SLOT CHECK', 'slotcheck@example.com', 'PENDING', now())
     returning id`,
    [`slotcheck_${Date.now()}`, WORKSHOP, DATE, PERIOD, PARTY]
  )
  const id = ins.rows[0].id
  check("PENDING booking does not hold seats", (await seatsTaken()).left, base.left)

  // 2. Confirming it must take the seats.
  await client.query(`update "Booking" set status = 'CONFIRMED' where id = $1`, [id])
  check("CONFIRMED booking takes seats", (await seatsTaken()).left, base.left - PARTY)

  // 3. Cancelling must give them back.
  await client.query(`update "Booking" set status = 'CANCELLED' where id = $1`, [id])
  check("CANCELLED booking releases seats", (await seatsTaken()).left, base.left)

  // 4. Re-confirming takes them again (status is not one-way).
  await client.query(`update "Booking" set status = 'CONFIRMED' where id = $1`, [id])
  check("re-CONFIRMED takes seats again", (await seatsTaken()).left, base.left - PARTY)

  // 5. Deleting the booking restores the baseline.
  await client.query(`delete from "Booking" where id = $1`, [id])
  check("deleted booking releases seats", (await seatsTaken()).left, base.left)

  console.log(`\n${results.every(Boolean) ? "ALL CHECKS PASSED" : "SOME CHECKS FAILED"}`)
} finally {
  // Never leave a test booking behind.
  await client.query(`delete from "Booking" where name = 'SLOT CHECK'`)
  await client.end()
}
