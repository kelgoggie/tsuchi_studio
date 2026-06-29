import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { bookingWindow } from "@/lib/booking"
import { BookingStatus } from "@/app/generated/prisma/client"

export const dynamic = "force-dynamic"

// Returns the workshop's capacity and, for the next 2 months, how many seats
// are already taken per date + session (PENDING + CONFIRMED count).
export async function GET(req: Request) {
  const workshopId = new URL(req.url).searchParams.get("w") ?? ""
  if (!workshopId) return NextResponse.json({ error: "Missing workshop." }, { status: 400 })

  const { min, max } = bookingWindow()
  try {
    const [workshop, grouped] = await Promise.all([
      prisma.workshop.findUnique({ where: { id: workshopId }, select: { capacity: true } }),
      prisma.booking.groupBy({
        by: ["date", "period"],
        where: {
          workshopId,
          status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
          date: { gte: min, lte: max },
        },
        _sum: { partySize: true },
      }),
    ])

    const booked: Record<string, Record<string, number>> = {}
    for (const g of grouped) {
      const key = g.date.toISOString().slice(0, 10)
      ;(booked[key] ??= {})[g.period] = g._sum.partySize ?? 0
    }
    return NextResponse.json({ capacity: workshop?.capacity ?? 0, booked })
  } catch (err) {
    console.error("Availability fetch failed:", err)
    return NextResponse.json({ capacity: 0, booked: {} })
  }
}
