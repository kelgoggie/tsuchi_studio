import { prisma } from "@/lib/prisma"
import { BookingStatus, type Period } from "@/app/generated/prisma/client"

export const PERIODS = ["MORNING", "AFTERNOON", "EVENING"] as const

export const PERIOD_LABELS: Record<Period, string> = {
  MORNING: "Morning · 9:00–12:00",
  AFTERNOON: "Afternoon · 1:00–4:00",
  EVENING: "Evening · 4:00–8:00",
}

const ACTIVE = [BookingStatus.PENDING, BookingStatus.CONFIRMED]

/** Parse a "YYYY-MM-DD" string into a UTC date-only Date (matches @db.Date). */
export function parseDateOnly(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const d = new Date(`${s}T00:00:00.000Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Studio is open Tue–Sun (closed Mondays). */
export function isOpenDay(date: Date): boolean {
  return date.getUTCDay() !== 1
}

/** Bookings are allowed from today up to 2 months ahead (the maximum window). */
export function bookingWindow(): { min: Date; max: Date } {
  const now = new Date()
  const min = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const max = new Date(min)
  max.setUTCMonth(max.getUTCMonth() + 2)
  return { min, max }
}

/** "YYYY-MM-DD" two months out — for the date input's `max` attribute. */
export function maxBookingDateStr(): string {
  return bookingWindow().max.toISOString().slice(0, 10)
}

/** Has the owner blocked this whole day, or this specific session? */
export async function isClosed(date: Date, period: Period): Promise<boolean> {
  const c = await prisma.closure.findFirst({
    where: { date, OR: [{ period: null }, { period }] },
  })
  return Boolean(c)
}

/** Seats still available for a workshop in a given date + session. */
export async function remainingSeats(workshopId: string, date: Date, period: Period): Promise<number> {
  const workshop = await prisma.workshop.findUnique({ where: { id: workshopId } })
  if (!workshop || !workshop.active) return 0
  const agg = await prisma.booking.aggregate({
    where: { workshopId, date, period, status: { in: ACTIVE } },
    _sum: { partySize: true },
  })
  return Math.max(0, workshop.capacity - (agg._sum.partySize ?? 0))
}

export type CreateBookingInput = {
  workshopId: string
  date: Date
  period: Period
  partySize: number
  name: string
  email: string
  phone?: string
  instagram?: string
  notes?: string
}

/**
 * Create a booking, re-checking capacity inside a transaction so two people
 * can't overbook the last seats of the same session at the same time.
 */
export async function createBooking(
  input: CreateBookingInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  return prisma.$transaction(async (tx) => {
    const workshop = await tx.workshop.findUnique({ where: { id: input.workshopId } })
    if (!workshop || !workshop.active) return { ok: false as const, error: "That workshop isn't available." }

    const agg = await tx.booking.aggregate({
      where: { workshopId: input.workshopId, date: input.date, period: input.period, status: { in: ACTIVE } },
      _sum: { partySize: true },
    })
    const remaining = workshop.capacity - (agg._sum.partySize ?? 0)
    if (input.partySize > remaining) {
      return {
        ok: false as const,
        error: remaining <= 0 ? "That session is fully booked." : `Only ${remaining} spot(s) left for that session.`,
      }
    }

    const booking = await tx.booking.create({
      data: {
        workshopId: input.workshopId,
        date: input.date,
        period: input.period,
        partySize: input.partySize,
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        instagram: input.instagram || null,
        notes: input.notes || null,
      },
    })
    return { ok: true as const, id: booking.id }
  })
}
