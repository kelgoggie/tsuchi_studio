// Prefilled Gmail drafts for the admin. We don't send mail from the server —
// these open Gmail in a new tab with everything written, so the studio reviews
// and sends from its own account (and replies come back to it).
//
// Client-safe: no server-only imports.

import { DOWN_PAYMENT_NOTICE } from "@/lib/constants"

export type BookingEmailData = {
  name: string
  email: string
  workshop: string
  /** Already formatted for humans, e.g. "Fri, Jul 17, 2026". */
  date: string
  /** e.g. "Morning · 9:00–12:00". */
  session: string
  slots: number
  bookingFee: number | null
  remainingFee: number | null
}

const peso = (n: number) => `PHP ${n.toLocaleString()}`

/** Gmail's compose URL. Newlines in `body` survive the encoding. */
export function gmailComposeUrl({ to, subject, body }: { to: string; subject: string; body: string }): string {
  const params = new URLSearchParams({ view: "cm", fs: "1", to, su: subject, body })
  return `https://mail.google.com/mail/?${params.toString()}`
}

function detailLines(b: BookingEmailData): string[] {
  return [
    `Workshop: ${b.workshop}`,
    `Date: ${b.date}`,
    `Session: ${b.session}`,
    `Slots: ${b.slots}`,
  ]
}

/** Sent when the studio approves a reservation — payment instructions + QR. */
export function confirmationEmail(b: BookingEmailData) {
  const lines = [
    `Hi ${b.name},`,
    "",
    "Good news — your reservation request has been approved! Here are your booking details:",
    "",
    ...detailLines(b),
    ...(b.bookingFee != null ? [`Down payment: ${peso(b.bookingFee)}`] : []),
    ...(b.remainingFee != null ? [`Remaining balance: ${peso(b.remainingFee)} (payable at the studio)`] : []),
    "",
    "To secure your slot, please settle your down payment via GCash or bank transfer using the QR code attached to this email, then reply with a screenshot of your receipt.",
    "",
    DOWN_PAYMENT_NOTICE,
    "",
    "See you at the studio!",
    "",
    "Warmly,",
    "Tsuchi Studio",
  ]

  return {
    to: b.email,
    subject: `Your Tsuchi Studio reservation is approved — ${b.workshop}`,
    body: lines.join("\n"),
  }
}

/** The full run-of-show for the customer's session. */
export function scheduleEmail(b: BookingEmailData) {
  const lines = [
    `Hi ${b.name},`,
    "",
    "Here's the full schedule for your upcoming workshop:",
    "",
    ...detailLines(b),
    "",
    "Please arrive 10-15 minutes before your session starts so we can get you settled in. Wear clothes you don't mind getting messy — clay and dye don't always come out in the wash. All tools and materials are provided.",
    "",
    "If you need to reschedule, just reply to this email and let us know.",
    "",
    "See you soon!",
    "",
    "Warmly,",
    "Tsuchi Studio",
  ]

  return {
    to: b.email,
    subject: `Your workshop schedule — ${b.workshop}`,
    body: lines.join("\n"),
  }
}
