/**
 * Rug tufting: medium + large share ONE pool of 2 tufting guns.
 * A session can be 2 medium, 2 large, or one of each — never 4.
 *
 * Books through the real /api/book endpoint so the server's capacity rules are
 * the thing under test, not a re-implementation of them.
 *
 * Usage: node scripts/tufting-check.mjs   (dev server must be running)
 */
import "dotenv/config"
import pg from "pg"

const BASE = process.env.BASE_URL ?? "http://localhost:3000"
const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

const results = []
const check = (label, pass) => {
  results.push(pass)
  console.log(`${pass ? "PASS" : "FAIL"}  ${label}`)
}

const d = new Date()
d.setUTCHours(0, 0, 0, 0)
d.setUTCDate(d.getUTCDate() + 25)
while (d.getUTCDay() === 1) d.setUTCDate(d.getUTCDate() + 1)
const DATE = d.toISOString().slice(0, 10)

/** Books via the real API. Returns { ok, error }. */
async function book(label, slots) {
  const res = await fetch(`${BASE}/api/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      workshopId: "rug-tufting", // both tiers map to this one pool
      workshopLabel: label,
      name: `TUFTCHECK ${label}`,
      email: "tuftcheck@example.com",
      date: DATE,
      period: "AFTERNOON",
      partySize: slots,
      feeAmount: 900,
      remaining: 900,
    }),
  })
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok, error: json.error }
}

/** Seats a session still has, straight from the availability API. */
async function seatsLeft() {
  const d = await (await fetch(`${BASE}/api/availability?w=rug-tufting`)).json()
  return d.capacity - (d.booked?.[DATE]?.AFTERNOON ?? 0)
}

/** Bookings only hold seats once CONFIRMED. */
const confirmAll = () =>
  client.query(`update "Booking" set status='CONFIRMED' where name like 'TUFTCHECK%'`)

try {
  await client.query(`delete from "Booking" where name like 'TUFTCHECK%'`)
  console.log(`date=${DATE}  session=AFTERNOON\n`)

  check(`capacity is 2 guns (got ${await seatsLeft()})`, (await seatsLeft()) === 2)

  // 1 medium rug takes one gun.
  const a = await book("Medium Rug Tufting", 1)
  check("booking 1 medium rug succeeds", a.ok)
  await confirmAll()
  check(`1 gun left after 1 medium (got ${await seatsLeft()})`, (await seatsLeft()) === 1)

  // A LARGE rug must draw from the SAME pool — this is the whole point.
  const b = await book("Large Rug Tufting", 1)
  check("booking 1 large rug succeeds (1 med + 1 large = 2 guns)", b.ok)
  await confirmAll()
  check(`0 guns left after 1 medium + 1 large (got ${await seatsLeft()})`, (await seatsLeft()) === 0)

  // A third tufter of EITHER size must be refused — there is no third gun.
  const c = await book("Large Rug Tufting", 1)
  check("a 3rd tufter is refused (no 3rd gun)", !c.ok)
  console.log(`        server said: ${c.error}`)

  // And a party of 3 in one booking must also be refused.
  await client.query(`delete from "Booking" where name like 'TUFTCHECK%'`)
  const e = await book("Medium Rug Tufting", 3)
  check("a party of 3 tufters is refused", !e.ok)
  console.log(`        server said: ${e.error}`)

  // 2 medium in one booking is fine (exactly 2 guns).
  const f = await book("Medium Rug Tufting", 2)
  check("a party of 2 tufters is allowed", f.ok)

  console.log(`\n${results.every(Boolean) ? "ALL CHECKS PASSED" : "SOME CHECKS FAILED"}`)
} finally {
  await client.query(`delete from "Booking" where name like 'TUFTCHECK%'`)
  await client.end()
}
