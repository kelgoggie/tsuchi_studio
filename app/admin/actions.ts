"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/auth"
import { forwardToSheet } from "@/lib/sheets"
import {
  createBooking,
  isMonday,
  parseDateOnly,
  remainingSeats,
  PERIODS,
  PERIOD_LABELS,
  SEAT_HOLDING,
} from "@/lib/booking"
import { ALL_WORKSHOPS } from "@/lib/constants"
import { fmtDay } from "@/lib/format"
import { BookingStatus, type Period } from "@/app/generated/prisma/client"

// How each booking status shows up in the Google Sheet's single status column.
const SHEET_STATUS: Record<string, string> = {
  CONFIRMED: "PAID - CONFIRMED",
  PENDING: "UNPAID",
  CANCELLED: "CANCELLED",
}

export async function setBookingStatus(formData: FormData) {
  if (!(await isAdmin())) throw new Error("Unauthorized")
  const id = String(formData.get("id") ?? "")
  const next = String(formData.get("status") ?? "")
  if (!id || !(next in BookingStatus)) return

  await prisma.booking.update({
    where: { id },
    data: { status: BookingStatus[next as keyof typeof BookingStatus] },
  })

  // Mirror the change into the Google Sheet (find the row by Booking ID).
  await forwardToSheet({ action: "update", id, bookingStatus: SHEET_STATUS[next] })

  revalidatePath("/admin")
}

/** Block or unblock a whole day. Booking logic already refuses closed dates. */
export async function toggleClosure(dateStr: string) {
  if (!(await isAdmin())) throw new Error("Unauthorized")
  const date = parseDateOnly(dateStr)
  if (!date) return

  const existing = await prisma.closure.findFirst({ where: { date, period: null } })
  if (existing) {
    await prisma.closure.delete({ where: { id: existing.id } })
  } else {
    await prisma.closure.create({ data: { date, period: null } })
  }

  revalidatePath("/admin/calendar")
}

/**
 * Open or re-close a single Monday. Mondays are closed by default, so an
 * Opening row is what makes one bookable.
 */
export async function toggleOpening(dateStr: string) {
  if (!(await isAdmin())) throw new Error("Unauthorized")
  const date = parseDateOnly(dateStr)
  if (!date || !isMonday(date)) return

  const existing = await prisma.opening.findUnique({ where: { date } })
  if (existing) {
    await prisma.opening.delete({ where: { id: existing.id } })
  } else {
    await prisma.opening.create({ data: { date } })
  }

  revalidatePath("/admin/calendar")
}

/**
 * Hold back N slots for a date/session (without a real booking). `workshopId`
 * may be ALL_WORKSHOPS, which blocks the session across every active workshop —
 * each one capped at its own capacity, since capacities differ.
 */
/** null until submitted; `blocked` is null when a whole session was closed. */
export type BlockState = { error: string } | { ok: true; blocked: number | null } | null

export async function blockSlots(_prev: BlockState, formData: FormData): Promise<BlockState> {
  if (!(await isAdmin())) throw new Error("Unauthorized")
  const workshopId = String(formData.get("workshopId") ?? "")
  const dateStr = String(formData.get("date") ?? "")
  const period = String(formData.get("period") ?? "") as Period
  const slots = Math.max(1, Number(formData.get("slots")) || 1)
  const reason = String(formData.get("reason") ?? "").trim() || null

  const date = parseDateOnly(dateStr)
  if (!workshopId || !date || !(PERIODS as readonly string[]).includes(period)) {
    return { error: "Please pick a workshop, session and date." }
  }

  let blocked: number | null = null

  if (workshopId === ALL_WORKSHOPS) {
    const workshops = await prisma.workshop.findMany({
      where: { active: true },
      select: { id: true, capacity: true },
    })
    const ids = workshops.map((w) => w.id)

    // Closing the session outright: every seat of every workshop. Existing holds
    // for this session are replaced, since a full block supersedes them.
    await prisma.$transaction([
      prisma.slotBlock.deleteMany({ where: { workshopId: { in: ids }, date, period } }),
      prisma.slotBlock.createMany({
        data: workshops.map((w) => ({ workshopId: w.id, date, period, slots: w.capacity, reason })),
      }),
    ])
  } else {
    // Never block more slots than the session actually has free — the form warns
    // about this, but a stale tab could still post an over-large number.
    const free = await remainingSeats(workshopId, date, period)
    if (free <= 0) return { error: "This session has no free slots left to block." }
    blocked = Math.min(slots, free)
    await prisma.slotBlock.create({
      data: { workshopId, date, period, slots: blocked, reason },
    })
  }

  revalidatePath("/admin/calendar")
  revalidatePath("/admin/schedule")
  return { ok: true, blocked }
}

export type CapacityState = { error: string } | { ok: true } | null

/**
 * Change how many slots a workshop seats per session. This is the real capacity
 * in the database, so it immediately affects what customers can book.
 */
export async function updateCapacities(
  _prev: CapacityState,
  formData: FormData
): Promise<CapacityState> {
  if (!(await isAdmin())) throw new Error("Unauthorized")

  const workshops = await prisma.workshop.findMany({ select: { id: true, name: true, capacity: true } })

  const updates: { id: string; capacity: number }[] = []
  for (const w of workshops) {
    const raw = formData.get(`capacity_${w.id}`)
    if (raw == null || String(raw).trim() === "") continue

    const capacity = Number(raw)
    if (!Number.isInteger(capacity) || capacity < 1) {
      return { error: `${w.name}: slots must be a whole number of at least 1.` }
    }
    if (capacity !== w.capacity) updates.push({ id: w.id, capacity })
  }

  if (updates.length === 0) return { ok: true }

  await prisma.$transaction(
    updates.map((u) => prisma.workshop.update({ where: { id: u.id }, data: { capacity: u.capacity } }))
  )

  // Capacity feeds availability everywhere.
  revalidatePath("/admin/calendar")
  revalidatePath("/admin/schedule")
  revalidatePath("/admin")
  revalidatePath("/workshops")
  revalidatePath("/book")
  return { ok: true }
}

export async function removeSlotBlock(formData: FormData) {
  if (!(await isAdmin())) throw new Error("Unauthorized")
  const id = String(formData.get("id") ?? "")
  if (!id) return
  await prisma.slotBlock.delete({ where: { id } })
  revalidatePath("/admin/calendar")
  revalidatePath("/admin/schedule") // blocks are unblocked from the timetable
}

export type EditBookingState = { error: string } | { ok: true } | null

/**
 * Edit an existing booking. Capacity is re-checked in a transaction against the
 * target session, ignoring this booking's own seats so it can stay put or shrink.
 */
export async function updateBooking(
  _prev: EditBookingState,
  formData: FormData
): Promise<EditBookingState> {
  if (!(await isAdmin())) throw new Error("Unauthorized")

  const id = String(formData.get("id") ?? "")
  const workshopId = String(formData.get("workshopId") ?? "")
  const dateStr = String(formData.get("date") ?? "")
  const period = String(formData.get("period") ?? "") as Period
  const partySize = Math.max(1, Number(formData.get("partySize")) || 1)
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim() || null
  const instagram = String(formData.get("instagram") ?? "").trim() || null
  const notes = String(formData.get("notes") ?? "").trim() || null
  const feeRaw = String(formData.get("bookingFee") ?? "").trim()
  const statusRaw = String(formData.get("status") ?? "PENDING")

  const date = parseDateOnly(dateStr)
  if (!id) return { error: "Missing booking." }
  if (!workshopId) return { error: "Choose a workshop." }
  if (!date) return { error: "Choose a valid date." }
  if (!(PERIODS as readonly string[]).includes(period)) return { error: "Choose a session." }
  if (!name) return { error: "A name is required." }
  if (!email && !instagram) return { error: "Add an email or an Instagram handle." }

  const status = statusRaw in BookingStatus
    ? BookingStatus[statusRaw as keyof typeof BookingStatus]
    : BookingStatus.PENDING

  const result = await prisma.$transaction(async (tx) => {
    const workshop = await tx.workshop.findUnique({ where: { id: workshopId } })
    if (!workshop || !workshop.active) return { error: "That workshop isn't available." }

    // Only a confirmed booking occupies seats, so an edit only needs to fit if
    // it's landing (or staying) in the CONFIRMED state.
    if (status === BookingStatus.CONFIRMED) {
      const [agg, blocked] = await Promise.all([
        tx.booking.aggregate({
          where: {
            workshopId,
            date,
            period,
            status: { in: SEAT_HOLDING },
            id: { not: id }, // this booking's own seats don't block itself
          },
          _sum: { partySize: true },
        }),
        tx.slotBlock.aggregate({ where: { workshopId, date, period }, _sum: { slots: true } }),
      ])
      const remaining = workshop.capacity - (agg._sum.partySize ?? 0) - (blocked._sum.slots ?? 0)
      if (partySize > remaining) {
        return {
          error:
            remaining <= 0
              ? "That session is already full."
              : `Only ${remaining} slot(s) left for that session.`,
        }
      }
    }

    await tx.booking.update({
      where: { id },
      data: {
        workshopId,
        date,
        period,
        partySize,
        name,
        email,
        phone,
        instagram,
        notes,
        bookingFee: feeRaw ? Number(feeRaw) : null,
        status,
      },
    })
    return { ok: true as const }
  })

  if ("error" in result) return result

  const workshop = await prisma.workshop.findUnique({ where: { id: workshopId }, select: { name: true } })

  // Keep the sheet row in step with the edit.
  await forwardToSheet({
    action: "update",
    id,
    name,
    workshop: workshop?.name ?? workshopId,
    date: dateStr,
    day: fmtDay(date),
    session: PERIOD_LABELS[period],
    slots: partySize,
    phone: phone ?? "",
    email,
    instagram: instagram ?? "",
    invoiceVia: email ? "EMAIL" : "INSTAGRAM",
    bookingFee: feeRaw ? Number(feeRaw) : "",
    bookingStatus: SHEET_STATUS[statusRaw] ?? "UNPAID",
  })

  revalidatePath("/admin")
  revalidatePath("/admin/schedule")
  return { ok: true }
}

export type NewBookingState = { error: string } | null

/** Admin-entered booking. Goes through the same capacity checks + Sheet sync. */
export async function createAdminBooking(
  _prev: NewBookingState,
  formData: FormData
): Promise<NewBookingState> {
  if (!(await isAdmin())) throw new Error("Unauthorized")

  const workshopId = String(formData.get("workshopId") ?? "")
  const dateStr = String(formData.get("date") ?? "")
  const period = String(formData.get("period") ?? "") as Period
  const partySize = Math.max(1, Number(formData.get("partySize")) || 1)
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim() || undefined
  const instagram = String(formData.get("instagram") ?? "").trim() || undefined
  const notes = String(formData.get("notes") ?? "").trim() || undefined
  const feeRaw = String(formData.get("bookingFee") ?? "").trim()
  const statusRaw = String(formData.get("status") ?? "PENDING")

  const date = parseDateOnly(dateStr)
  if (!workshopId) return { error: "Choose a workshop." }
  if (!date) return { error: "Choose a valid date." }
  if (!(PERIODS as readonly string[]).includes(period)) return { error: "Choose a session." }
  if (!name) return { error: "A name is required." }
  if (!email && !instagram) return { error: "Add an email or an Instagram handle." }

  const status = statusRaw in BookingStatus
    ? BookingStatus[statusRaw as keyof typeof BookingStatus]
    : BookingStatus.PENDING

  const result = await createBooking({
    workshopId,
    date,
    period,
    partySize,
    name,
    email,
    phone,
    instagram,
    notes,
    bookingFee: feeRaw ? Number(feeRaw) : null,
    status,
  })
  if (!result.ok) return { error: result.error }

  const workshop = await prisma.workshop.findUnique({
    where: { id: workshopId },
    select: { name: true },
  })

  await forwardToSheet({
    bookedOn: new Date().toISOString(),
    name,
    id: result.id,
    workshop: workshop?.name ?? workshopId,
    date: dateStr,
    day: date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }),
    session: PERIOD_LABELS[period],
    slots: partySize,
    phone: phone ?? "",
    email,
    instagram: instagram ?? "",
    invoiceVia: email ? "EMAIL" : "INSTAGRAM",
    bookingFee: feeRaw ? Number(feeRaw) : "",
    bookingStatus: SHEET_STATUS[statusRaw] ?? "UNPAID",
  })

  revalidatePath("/admin")
  redirect("/admin")
}
