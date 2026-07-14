/**
 * Wipes all bookings and seeds ~50 fake ones across July–September 2026.
 *
 * Respects the real rules so the admin/schedule pages show believable data:
 *   • never books a Monday (unless the studio opened that one)
 *   • never books a date the studio has closed
 *   • CONFIRMED bookings never exceed a session's capacity (they hold seats;
 *     PENDING ones don't, so those can sit on top)
 *   • bookingFee is the FULL class fee (price x slots), paid upfront
 *
 * Usage: node scripts/seed-bookings.mjs
 */
import "dotenv/config"
import pg from "pg"

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

const PERIODS = ["MORNING", "AFTERNOON", "EVENING"]

// Price per person, matching lib/workshops.ts.
const PRICE = {
  handbuilding: 1200,
  "wheel-throwing": 1800,
  "ceramic-painting": 500,
  "rug-tufting-medium": 1800,
  "rug-tufting-large": 2500,
}

const FIRST = [
  "Maria", "Jose", "Andrea", "Miguel", "Sofia", "Gabriel", "Isabella", "Rafael",
  "Camille", "Paolo", "Bianca", "Lorenzo", "Danica", "Enzo", "Trisha", "Marco",
  "Althea", "Kiko", "Rhea", "Nico", "Jasmine", "Diego", "Patricia", "Emman",
  "Reese", "Carlo", "Nadine", "Vincent", "Kaye", "Adrian",
]
const LAST = [
  "Santos", "Reyes", "Cruz", "Bautista", "Ocampo", "Villanueva", "Mendoza",
  "Garcia", "Torres", "Ramos", "Aquino", "Del Rosario", "Fernandez", "Castillo",
  "Navarro", "Gonzales", "Dela Cruz", "Lim", "Tan", "Uy",
]
const NOTES = [
  null, null, null, null,
  "First time trying pottery!",
  "Celebrating a birthday",
  "Please seat us together",
  "Coming with a friend",
  "Allergic to latex gloves",
  "Might arrive 10 mins late",
]

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const int = (min, max) => min + Math.floor(Math.random() * (max - min + 1))

function phone() {
  return `09${int(10, 99)}${String(int(0, 9999999)).padStart(7, "0")}`
}

try {
  const { rows: workshops } = await client.query(
    `select id, capacity from "Workshop" where active = true order by "sortOrder"`
  )
  const { rows: closures } = await client.query(
    `select to_char(date,'YYYY-MM-DD') as d from "Closure" where period is null`
  )
  const { rows: openings } = await client.query(
    `select to_char(date,'YYYY-MM-DD') as d from "Opening"`
  )
  const closed = new Set(closures.map((r) => r.d))
  const openMondays = new Set(openings.map((r) => r.d))

  // Every bookable day in Jul–Sep 2026.
  const days = []
  for (let d = new Date(Date.UTC(2026, 6, 1)); d < new Date(Date.UTC(2026, 9, 1)); d.setUTCDate(d.getUTCDate() + 1)) {
    const s = d.toISOString().slice(0, 10)
    if (closed.has(s)) continue
    if (d.getUTCDay() === 1 && !openMondays.has(s)) continue // closed Mondays
    days.push(s)
  }

  await client.query(`delete from "Booking"`)
  console.log("deleted all existing bookings")

  // Seats already committed by CONFIRMED bookings, keyed date|period|workshop.
  const taken = new Map()
  const key = (d, p, w) => `${d}|${p}|${w}`

  const rows = []
  let attempts = 0

  while (rows.length < 50 && attempts < 2000) {
    attempts++

    const date = pick(days)
    const period = pick(PERIODS)
    const w = pick(workshops)

    // Weighted: mostly confirmed/pending, a few cancelled.
    const roll = Math.random()
    const status = roll < 0.5 ? "CONFIRMED" : roll < 0.85 ? "PENDING" : "CANCELLED"

    // Party size can't exceed the workshop's capacity.
    const slots = int(1, Math.min(w.capacity, 3))

    // Only CONFIRMED bookings hold seats, so only they need to fit.
    if (status === "CONFIRMED") {
      const k = key(date, period, w.id)
      const used = taken.get(k) ?? 0
      if (used + slots > w.capacity) continue // session is full — try elsewhere
      taken.set(k, used + slots)
    }

    const first = pick(FIRST)
    const last = pick(LAST)
    const name = `${first} ${last}`
    const handle = `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, "")

    // Most want email; some want their invoice over Instagram instead.
    const viaInstagram = Math.random() < 0.25
    const email = viaInstagram ? null : `${handle.replace(/\./g, "")}@example.com`
    const instagram = viaInstagram ? `@${handle}` : Math.random() < 0.4 ? `@${handle}` : null

    // Booked some days before the class, in the past relative to the workshop.
    const createdAt = new Date(`${date}T00:00:00Z`)
    createdAt.setUTCDate(createdAt.getUTCDate() - int(1, 30))
    createdAt.setUTCHours(int(8, 20), int(0, 59), 0, 0)

    rows.push({
      id: `seed_${rows.length + 1}_${Math.random().toString(36).slice(2, 8)}`,
      workshopId: w.id,
      date,
      period,
      slots,
      name,
      email,
      instagram,
      invoiceVia: viaInstagram ? "INSTAGRAM" : "EMAIL",
      phone: phone(),
      notes: pick(NOTES),
      fee: PRICE[w.id] * slots, // full amount, paid upfront
      status,
      createdAt: createdAt.toISOString(),
    })
  }

  for (const r of rows) {
    await client.query(
      `insert into "Booking"
        (id, "workshopId", date, period, "partySize", name, email, instagram, "invoiceVia",
         phone, notes, "bookingFee", status, "createdAt")
       values ($1,$2,$3::date,$4::"Period",$5,$6,$7,$8,$9::"InvoiceVia",$10,$11,$12,$13::"BookingStatus",$14::timestamptz)`,
      [
        r.id, r.workshopId, r.date, r.period, r.slots, r.name, r.email, r.instagram,
        r.invoiceVia, r.phone, r.notes, r.fee, r.status, r.createdAt,
      ]
    )
  }

  console.log(`seeded ${rows.length} bookings across Jul–Sep 2026\n`)

  const { rows: summary } = await client.query(
    `select w.name as workshop, b.status, count(*)::int as bookings, sum(b."partySize")::int as slots
     from "Booking" b join "Workshop" w on w.id = b."workshopId"
     group by 1,2 order by 1,2`
  )
  console.table(summary)

  const { rows: months } = await client.query(
    `select to_char(date,'YYYY-MM') as month, count(*)::int as bookings
     from "Booking" group by 1 order by 1`
  )
  console.table(months)

  const { rows: over } = await client.query(
    `select w.name, b.date, b.period, sum(b."partySize")::int as confirmed, w.capacity
     from "Booking" b join "Workshop" w on w.id = b."workshopId"
     where b.status = 'CONFIRMED'
     group by w.name, b.date, b.period, w.capacity
     having sum(b."partySize") > w.capacity`
  )
  console.log(over.length === 0 ? "no session is overbooked ✓" : "OVERBOOKED SESSIONS:")
  if (over.length) console.table(over)
} finally {
  await client.end()
}
