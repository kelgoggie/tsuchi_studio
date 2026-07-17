/**
 * Delete test bookings from the database.
 *
 * ALWAYS dry-runs first: without --delete it only LISTS what would go.
 *
 *   node scripts/delete-bookings.mjs --before=2026-07-16      bookings created before this date
 *   node scripts/delete-bookings.mjs <id> <id> …              specific booking IDs
 *   node scripts/delete-bookings.mjs --before=2026-07-16 <id> both, combined
 *
 * Review the list, then re-run the same command with --delete appended.
 */
import "dotenv/config"
import pg from "pg"

const args = process.argv.slice(2)
const doDelete = args.includes("--delete")
const before = args.find((a) => a.startsWith("--before="))?.slice(9)
const ids = args.filter((a) => !a.startsWith("--"))

if (!before && ids.length === 0) {
  console.error("Nothing to match — pass --before=YYYY-MM-DD and/or booking IDs. See the header comment.")
  process.exit(1)
}
if (before && !/^\d{4}-\d{2}-\d{2}$/.test(before)) {
  console.error(`--before must be YYYY-MM-DD, got "${before}"`)
  process.exit(1)
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

try {
  const conds = []
  const params = []
  if (before) {
    params.push(before)
    conds.push(`"createdAt" < $${params.length}::date`)
  }
  if (ids.length) {
    params.push(ids)
    conds.push(`id = any($${params.length})`)
  }
  const where = conds.join(" or ")

  const { rows } = await client.query(
    `select id, name, email, status, "createdAt" from "Booking" where ${where} order by "createdAt" asc`,
    params
  )

  if (rows.length === 0) {
    console.log("No bookings match.")
  } else {
    for (const b of rows) {
      console.log(`${b.createdAt.toISOString().slice(0, 16)}  ${b.status.padEnd(9)}  ${b.name}  <${b.email ?? "no email"}>  ${b.id}`)
    }
    console.log(`\n${rows.length} booking(s) matched.`)

    if (doDelete) {
      // EmailMark rows go with their booking via the FK cascade.
      const res = await client.query(`delete from "Booking" where ${where}`, params)
      console.log(`Deleted ${res.rowCount} booking(s). Now run: node scripts/rebuild-sheet.mjs`)
    } else {
      console.log("Dry run — nothing deleted. Re-run with --delete to remove them.")
    }
  }
} finally {
  await client.end()
}
