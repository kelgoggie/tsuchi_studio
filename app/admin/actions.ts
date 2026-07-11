"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/auth"
import { forwardToSheet } from "@/lib/sheets"
import { BookingStatus } from "@/app/generated/prisma/client"

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
