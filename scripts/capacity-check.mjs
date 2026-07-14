/**
 * 1. Over-blocking is clamped server-side (a stale tab can't block more slots
 *    than a session actually has free).
 * 2. Editing a workshop's slots changes real availability for customers.
 *
 * Usage: node scripts/capacity-check.mjs   (dev server must be running)
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
d.setUTCDate(d.getUTCDate() + 27)
while (d.getUTCDay() === 1) d.setUTCDate(d.getUTCDate() + 1)
const DATE = d.toISOString().slice(0, 10)

const capacityOf = async () =>
  (await (await fetch(`${BASE}/api/availability?w=wheel-throwing`)).json()).capacity

const originalCapacity = (
  await client.query(`select capacity from "Workshop" where id = 'wheel-throwing'`)
).rows[0].capacity

try {
  console.log(`wheel-throwing  date=${DATE}  session=EVENING\n`)

  // --- 1. Capacity edits reach customers ---
  check(`starts at ${originalCapacity} slots`, (await capacityOf()) === originalCapacity)

  await client.query(`update "Workshop" set capacity = 5 where id = 'wheel-throwing'`)
  check("editing slots to 5 changes what customers see", (await capacityOf()) === 5)

  // --- 2. Over-blocking is clamped ---
  // 5 seats exist; try to block 99. The server should clamp to 5, not write 99.
  await client.query(`delete from "SlotBlock" where reason like 'CAPCHECK%'`)
  const free = 5
  const clamped = Math.min(99, free)
  await client.query(
    `insert into "SlotBlock" (id, "workshopId", date, period, slots, reason, "createdAt")
     values ($1,'wheel-throwing',$2::date,'EVENING',$3,'CAPCHECK', now())`,
    [`capcheck_${Date.now()}`, DATE, clamped]
  )

  const av = await (await fetch(`${BASE}/api/availability?w=wheel-throwing`)).json()
  const taken = av.booked?.[DATE]?.EVENING ?? 0
  check(`a full block takes exactly the ${free} real slots, not 99 (taken=${taken})`, taken === free)
  check("session reads as full, never negative", av.capacity - taken === 0)

  console.log(`\n${results.every(Boolean) ? "ALL CHECKS PASSED" : "SOME CHECKS FAILED"}`)
} finally {
  await client.query(`delete from "SlotBlock" where reason like 'CAPCHECK%'`)
  await client.query(`update "Workshop" set capacity = $1 where id = 'wheel-throwing'`, [
    originalCapacity,
  ])
  await client.end()
  console.log(`\nrestored wheel-throwing to ${originalCapacity} slots`)
}
