/**
 * Checks that a blocked slot shows on the Studio schedules timetable with an
 * Unblock control, and that the Calendar page no longer lists blocks.
 */
import "dotenv/config"
import pg from "pg"
import crypto from "crypto"

const BASE = "http://localhost:3000"
const token = crypto
  .createHmac("sha256", process.env.ADMIN_SECRET ?? "tsuchi-dev-secret-change-me")
  .update(process.env.ADMIN_PASSWORD ?? "")
  .digest("hex")
const cookie = { cookie: `tsuchi_admin=${token}` }

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

const results = []
const check = (label, pass) => { results.push(pass); console.log(`${pass ? "PASS" : "FAIL"}  ${label}`) }

const d = new Date()
d.setUTCHours(0, 0, 0, 0)
d.setUTCDate(d.getUTCDate() + 22)
while (d.getUTCDay() === 1) d.setUTCDate(d.getUTCDate() + 1)
const DATE = d.toISOString().slice(0, 10)
const id = `blkcheck_${Date.now()}`

try {
  await client.query(
    `insert into "SlotBlock" (id, "workshopId", date, period, slots, reason, "createdAt")
     values ($1,'handbuilding',$2::date,'MORNING',3,'BLKCHECK private group', now())`,
    [id, DATE]
  )

  const sched = (await (await fetch(`${BASE}/admin/schedule?d=${DATE}`, { headers: cookie })).text()).replaceAll("<!-- -->", "")
  check("schedule shows the blocked slots", sched.includes("3 slots blocked"))
  check("schedule shows the block reason", sched.includes("BLKCHECK private group"))
  check("schedule offers an Unblock button", sched.includes("Unblock"))

  const cal = await (await fetch(`${BASE}/admin/calendar`, { headers: cookie })).text()
  check("calendar no longer lists blocked slots", !cal.includes("Blocked slots"))
  check("calendar still has the Block slots form", cal.includes("Block slots"))

  // The block must still reduce real availability.
  const av = await (await fetch(`${BASE}/api/availability?w=handbuilding`)).json()
  const taken = av.booked?.[DATE]?.MORNING ?? 0
  check(`blocked slots still reduce availability (taken=${taken})`, taken >= 3)

  console.log(`\n${results.every(Boolean) ? "ALL CHECKS PASSED" : "SOME CHECKS FAILED"}`)
} finally {
  await client.query(`delete from "SlotBlock" where reason like 'BLKCHECK%'`)
  await client.end()
}
