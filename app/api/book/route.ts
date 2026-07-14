import { NextResponse } from "next/server"
import { bookingWindow, createBooking, isClosed, isDayOpen, parseDateOnly, PERIODS, PERIOD_LABELS } from "@/lib/booking"
import { forwardToSheet } from "@/lib/sheets"
import type { InvoiceVia, Period } from "@/app/generated/prisma/client"

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
  }

  const workshopId = String(body.workshopId ?? "").trim()
  const name = String(body.name ?? "").trim()
  const email = String(body.email ?? "").trim()
  const instagram = String(body.instagram ?? "").trim()
  const period = String(body.period ?? "") as Period
  const dateStr = String(body.date ?? "")

  // The customer chooses where their invoice goes; that channel is the one we
  // require, so an Instagram-only booking has no email at all.
  const invoiceVia: InvoiceVia = body.invoiceVia === "INSTAGRAM" ? "INSTAGRAM" : "EMAIL"

  if (!workshopId || !name) {
    return NextResponse.json({ error: "Name and workshop are required." }, { status: 400 })
  }
  if (invoiceVia === "EMAIL") {
    if (!email) {
      return NextResponse.json({ error: "Please enter the email for your invoice." }, { status: 400 })
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 })
    }
  } else if (!instagram) {
    return NextResponse.json(
      { error: "Please enter the Instagram handle for your invoice." },
      { status: 400 }
    )
  }
  if (!(PERIODS as readonly string[]).includes(period)) {
    return NextResponse.json({ error: "Please choose a session." }, { status: 400 })
  }
  const date = parseDateOnly(dateStr)
  if (!date) {
    return NextResponse.json({ error: "Please choose a valid date." }, { status: 400 })
  }
  if (!(await isDayOpen(date))) {
    return NextResponse.json({ error: "The studio is closed on Mondays." }, { status: 400 })
  }
  const { min, max } = bookingWindow()
  if (date < min) {
    return NextResponse.json({ error: "That date has already passed." }, { status: 400 })
  }
  if (date > max) {
    return NextResponse.json({ error: "Bookings can only be made up to 2 months in advance." }, { status: 400 })
  }
  if (await isClosed(date, period)) {
    return NextResponse.json({ error: "That session isn't available." }, { status: 400 })
  }

  const partySize = Math.max(1, Math.min(20, Number(body.partySize) || 1))
  const phone = body.phone ? String(body.phone).trim() : undefined
  const notes = body.notes ? String(body.notes).trim() : undefined

  // The class is paid in full upfront, so this is the whole fee.
  const feeAmount = Number(body.feeAmount) || 0
  const workshopLabel = String(body.workshopLabel ?? workshopId)
  const day = date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" })

  const result = await createBooking({
    workshopId,
    date,
    period,
    partySize,
    name,
    email: email || undefined,
    instagram: instagram || undefined,
    invoiceVia,
    phone,
    notes,
    bookingFee: feeAmount || null,
  })
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 })
  }

  await forwardToSheet({
    bookedOn: new Date().toISOString(),
    name,
    id: result.id,
    workshop: workshopLabel,
    date: dateStr,
    day,
    session: PERIOD_LABELS[period],
    slots: partySize,
    phone: phone ?? "",
    email,
    instagram,
    invoiceVia,
    bookingFee: feeAmount,
    bookingStatus: "UNPAID",
  })

  return NextResponse.json({ ok: true, id: result.id })
}
