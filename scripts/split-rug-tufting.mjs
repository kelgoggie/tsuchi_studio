/**
 * Rug tufting used to be ONE pool of 2 (two guns, either size).
 * The studio now wants strictly 1 medium + 1 large per session, so it becomes
 * TWO pools of 1 — a booking for a medium rug can no longer eat the large slot.
 *
 * The 15 existing rug-tufting bookings were test data and are deleted (confirmed
 * with the studio), which lets the old shared workshop row go away cleanly.
 *
 * Run once: node scripts/split-rug-tufting.mjs
 */
import "dotenv/config"
import pg from "pg"

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

try {
  await client.query("begin")

  const { rows: before } = await client.query(
    `select count(*)::int as n from "Booking" where "workshopId" = 'rug-tufting'`
  )
  console.log(`deleting ${before[0].n} old rug-tufting bookings (test data)`)

  await client.query(`delete from "Booking" where "workshopId" = 'rug-tufting'`)
  await client.query(`delete from "SlotBlock" where "workshopId" = 'rug-tufting'`)

  // Two independent pools of one.
  await client.query(
    `insert into "Workshop" (id, slug, name, "durationMin", capacity, active, "sortOrder", "createdAt")
     values
       ('rug-tufting-medium','rug-tufting-medium','Medium Rug Tufting',150,1,true,4, now()),
       ('rug-tufting-large','rug-tufting-large','Large Rug Tufting',180,1,true,5, now())
     on conflict (id) do update set capacity = excluded.capacity, active = true`
  )

  await client.query(`delete from "Workshop" where id = 'rug-tufting'`)

  await client.query("commit")

  const { rows } = await client.query(
    `select id, name, capacity, active from "Workshop" order by "sortOrder"`
  )
  console.table(rows)
  console.log("done")
} catch (err) {
  await client.query("rollback")
  console.error("rolled back:", err.message)
  process.exitCode = 1
} finally {
  await client.end()
}
