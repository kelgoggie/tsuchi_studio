"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/auth"
import { forwardToSheet } from "@/lib/sheets"
import { createBooking, isMonday, parseDateOnly, PERIODS, PERIOD_LABELS } from "@/lib/booking"
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

/** Hold back N slots for one workshop/date/session (without a real booking). */
export async function blockSlots(formData: FormData) {
  if (!(await isAdmin())) throw new Error("Unauthorized")
  const workshopId = String(formData.get("workshopId") ?? "")
  const dateStr = String(formData.get("date") ?? "")
  const period = String(formData.get("period") ?? "") as Period
  const slots = Math.max(1, Number(formData.get("slots")) || 1)
  const reason = String(formData.get("reason") ?? "").trim() || null

  const date = parseDateOnly(dateStr)
  if (!workshopId || !date || !(PERIODS as readonly string[]).includes(period)) return

  await prisma.slotBlock.create({ data: { workshopId, date, period, slots, reason } })
  revalidatePath("/admin/calendar")
}

export async function removeSlotBlock(formData: FormData) {
  if (!(await isAdmin())) throw new Error("Unauthorized")
  const id = String(formData.get("id") ?? "")
  if (!id) return
  await prisma.slotBlock.delete({ where: { id } })
  revalidatePath("/admin/calendar")
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
  const remRaw = String(formData.get("remainingFee") ?? "").trim()
  const statusRaw = String(formData.get("status") ?? "PENDING")

  const date = parseDateOnly(dateStr)
  if (!workshopId) return { error: "Choose a workshop." }
  if (!date) return { error: "Choose a valid date." }
  if (!(PERIODS as readonly string[]).includes(period)) return { error: "Choose a session." }
  if (!name || !email) return { error: "Name and email are required." }

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
    remainingFee: remRaw ? Number(remRaw) : null,
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
    bookingFee: feeRaw ? Number(feeRaw) : "",
    remaining: remRaw ? Number(remRaw) : "",
    bookingStatus: SHEET_STATUS[statusRaw] ?? "UNPAID",
  })

  revalidatePath("/admin")
  redirect("/admin")
}
