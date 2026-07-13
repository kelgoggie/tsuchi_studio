import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { bookingWindow, SEAT_HOLDING } from "@/lib/booking"

export const dynamic = "force-dynamic"

// Returns the workshop's capacity and, for the next 2 months, how many seats
// are already taken per date + session (only CONFIRMED bookings count).
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams
  const workshopId = params.get("w") ?? ""
  // When the admin edits a booking, its own seats mustn't count against itself.
  const excludeId = params.get("exclude") ?? undefined
  const past = params.get("past") === "1" // admin edits can reach past dates
  if (!workshopId) return NextResponse.json({ error: "Missing workshop." }, { status: 400 })

  const window = bookingWindow()
  const min = past ? new Date("2000-01-01") : window.min
  const max = window.max
  try {
    const [workshop, grouped, closures, blocks, openings] = await Promise.all([
      prisma.workshop.findUnique({ where: { id: workshopId }, select: { capacity: true } }),
      prisma.booking.groupBy({
        by: ["date", "period"],
        where: {
          workshopId,
          status: { in: SEAT_HOLDING }, // unpaid bookings don't hold a seat
          date: { gte: min, lte: max },
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        _sum: { partySize: true },
      }),
      // days the studio has blocked off in the admin calendar
      prisma.closure.findMany({
        where: { date: { gte: min, lte: max }, period: null },
        select: { date: true },
      }),
      // slots the admin has held back for specific sessions
      prisma.slotBlock.groupBy({
        by: ["date", "period"],
        where: { workshopId, date: { gte: min, lte: max } },
        _sum: { slots: true },
      }),
      // Mondays the admin has opened (they're closed by default)
      prisma.opening.findMany({
        where: { date: { gte: min, lte: max } },
        select: { date: true },
      }),
    ])

    // Blocked slots count as "taken", so the client's remaining math just works.
    const booked: Record<string, Record<string, number>> = {}
    for (const g of grouped) {
      const key = g.date.toISOString().slice(0, 10)
      ;(booked[key] ??= {})[g.period] = g._sum.partySize ?? 0
    }
    for (const b of blocks) {
      const key = b.date.toISOString().slice(0, 10)
      const bucket = (booked[key] ??= {})
      bucket[b.period] = (bucket[b.period] ?? 0) + (b._sum.slots ?? 0)
    }
    const closedDates = closures.map((c) => c.date.toISOString().slice(0, 10))
    const openDates = openings.map((o) => o.date.toISOString().slice(0, 10))

    return NextResponse.json({ capacity: workshop?.capacity ?? 0, booked, closedDates, openDates })
  } catch (err) {
    console.error("Availability fetch failed:", err)
    return NextResponse.json({ capacity: 0, booked: {}, closedDates: [], openDates: [] })
  }
}
