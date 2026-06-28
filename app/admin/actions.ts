"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { isAdmin } from "@/lib/auth"
import { BookingStatus } from "@/app/generated/prisma/client"

export async function setBookingStatus(formData: FormData) {
  if (!(await isAdmin())) throw new Error("Unauthorized")
  const id = String(formData.get("id") ?? "")
  const next = String(formData.get("status") ?? "")
  if (!id || !(next in BookingStatus)) return
  await prisma.booking.update({
    where: { id },
    data: { status: BookingStatus[next as keyof typeof BookingStatus] },
  })
  revalidatePath("/admin")
}
