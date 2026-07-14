import { prisma } from "@/lib/prisma"
import { BookingStatus, type Period } from "@/app/generated/prisma/client"

export const PERIODS = ["MORNING", "AFTERNOON", "EVENING"] as const

export const PERIOD_LABELS: Record<Period, string> = {
  MORNING: "Morning · 9:00–12:00",
  AFTERNOON: "Afternoon · 1:00–4:00",
  EVENING: "Evening · 4:00–7:00",
}

/** Just the hours, for prose ("…on Friday from 9:00–12:00"). */
export const PERIOD_TIMES: Record<Period, string> = {
  MORNING: "9:00–12:00",
  AFTERNOON: "1:00–4:00",
  EVENING: "4:00–7:00",
}

/**
 * Only confirmed bookings take up a seat — an unpaid (PENDING) booking doesn't
 * hold one, so seats stay open until the admin confirms payment.
 */
export const SEAT_HOLDING = [BookingStatus.CONFIRMED]

/** Parse a "YYYY-MM-DD" string into a UTC date-only Date (matches @db.Date). */
export function parseDateOnly(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const d = new Date(`${s}T00:00:00.000Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

export function isMonday(date: Date): boolean {
  return date.getUTCDay() === 1
}

/**
 * Studio is open Tue–Sun. Mondays are closed by default, but the owner can
 * open a specific Monday from the admin calendar (an Opening row).
 */
export async function isDayOpen(date: Date): Promise<boolean> {
  if (!isMonday(date)) return true
  return Boolean(await prisma.opening.findUnique({ where: { date } }))
}

/** Mondays the owner has opened, inside the booking window, as "YYYY-MM-DD". */
export async function openDates(): Promise<string[]> {
  const { min, max } = bookingWindow()
  const rows = await prisma.opening.findMany({
    where: { date: { gte: min, lte: max } },
    select: { date: true },
  })
  return rows.map((r) => r.date.toISOString().slice(0, 10))
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

// Used when the DB is unreachable so pages still render with sane numbers.
const DEFAULT_CAPACITY: Record<string, number> = {
  handbuilding: 8,
  "wheel-throwing": 2,
  "rug-tufting": 1, // only one tufting gun, so only one session at a time
  "ceramic-painting": 6,
}

/** Map of workshopId -> capacity, falling back to defaults if the DB is down. */
export async function getCapacities(): Promise<Record<string, number>> {
  try {
    const ws = await prisma.workshop.findMany({ select: { id: true, capacity: true } })
    if (ws.length) return Object.fromEntries(ws.map((w) => [w.id, w.capacity]))
  } catch (err) {
    console.error("Capacity fetch failed, using defaults:", err)
  }
  return DEFAULT_CAPACITY
}

export function capacityFor(map: Record<string, number>, workshopId: string): number {
  return map[workshopId] ?? DEFAULT_CAPACITY[workshopId] ?? 2
}

/** Has the owner blocked this whole day, or this specific session? */
export async function isClosed(date: Date, period: Period): Promise<boolean> {
  const c = await prisma.closure.findFirst({
    where: { date, OR: [{ period: null }, { period }] },
  })
  return Boolean(c)
}

/** Seats still available: capacity minus confirmed bookings minus admin-blocked slots. */
export async function remainingSeats(workshopId: string, date: Date, period: Period): Promise<number> {
  const workshop = await prisma.workshop.findUnique({ where: { id: workshopId } })
  if (!workshop || !workshop.active) return 0
  const [agg, blocked] = await Promise.all([
    prisma.booking.aggregate({
      where: { workshopId, date, period, status: { in: SEAT_HOLDING } },
      _sum: { partySize: true },
    }),
    prisma.slotBlock.aggregate({ where: { workshopId, date, period }, _sum: { slots: true } }),
  ])
  return Math.max(0, workshop.capacity - (agg._sum.partySize ?? 0) - (blocked._sum.slots ?? 0))
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
  bookingFee?: number | null
  remainingFee?: number | null
  status?: BookingStatus
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

    const [agg, blocked] = await Promise.all([
      tx.booking.aggregate({
        where: { workshopId: input.workshopId, date: input.date, period: input.period, status: { in: SEAT_HOLDING } },
        _sum: { partySize: true },
      }),
      tx.slotBlock.aggregate({
        where: { workshopId: input.workshopId, date: input.date, period: input.period },
        _sum: { slots: true },
      }),
    ])
    const remaining = workshop.capacity - (agg._sum.partySize ?? 0) - (blocked._sum.slots ?? 0)
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
        bookingFee: input.bookingFee ?? null,
        remainingFee: input.remainingFee ?? null,
        ...(input.status ? { status: input.status } : {}),
      },
    })
    return { ok: true as const, id: booking.id }
  })
}
