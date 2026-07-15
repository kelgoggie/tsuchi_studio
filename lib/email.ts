// Emails the studio sends from its own Gmail. We don't send from the server, so
// there are two shapes of the same message:
//
//   • plain text  → prefilled into a Gmail compose URL (one click, no images)
//   • HTML        → rendered on /admin/email/<id> and copied into Gmail — plain
//                   paragraphs with the important details in blue + bold
//
// Client-safe: no server-only imports.

import { INSTAGRAM_URL, PAYMENT_NOTICE } from "@/lib/constants"

export type BookingEmailData = {
  id: string
  name: string
  email: string | null
  workshop: string
  /** Already formatted for humans, e.g. "Fri, Jul 17, 2026". */
  date: string
  /** Session label, e.g. "Morning · 9:00–12:00". */
  session: string
  /** Just the hours, e.g. "9:00–12:00". */
  time: string
  slots: number
  /** The full class fee, paid upfront. */
  bookingFee: number | null
}

const peso = (n: number) => `PHP ${n.toLocaleString()}`

/** Gmail's compose URL. Newlines in `body` survive the encoding. */
export function gmailComposeUrl({
  to,
  subject,
  body,
}: {
  to: string | null
  subject: string
  body: string
}): string {
  const params = new URLSearchParams({ view: "cm", fs: "1", to: to ?? "", su: subject, body })
  return `https://mail.google.com/mail/?${params.toString()}`
}

const slotWord = (n: number) => `${n} slot${n === 1 ? "" : "s"}`
const amountOf = (b: BookingEmailData) =>
  b.bookingFee != null ? peso(b.bookingFee) : "the full class fee"

/** Marks an important detail so the HTML email renders it blue + bold. */
const hl = (s: string) => `{blue|**${s}**}`

/** Strips the inline markup back to plain text (Gmail URL bodies, clipboard text). */
export function stripInline(raw: string): string {
  return raw
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\{[^|{}]+\|([^{}]+)\}/g, "$1")
}

export const QR_ATTACHMENT_NOTE = "GCash and bank transfer QR codes are attached to this email."

// ---------------------------------------------------------------- request payment

export const requestPaymentSubject = (b: BookingEmailData) => `Tsuchi Studio -- Booking ID ${b.id}`

/** Asks the customer to pay the full amount and send proof. */
export function requestPaymentParagraphs(b: BookingEmailData): string[] {
  return [
    `Hello, ${b.name}!`,
    `Thank you for choosing Tsuchi Studio to be a part of your creative journey! To confirm your ${hl(
      slotWord(b.slots)
    )} for ${hl(b.workshop)} on ${hl(`${b.date} at ${b.time}`)}, kindly pay the full amount of ${hl(
      amountOf(b)
    )} through either of the online payment portals below, and send us a screenshot of your transaction details as proof of payment.`,
    `You may reply to this email with your proof of payment, or send it to us via Instagram: ${INSTAGRAM_URL}. Afterwards, you may expect your confirmation email within 24 hours.`,
    "Thank you so much!",
  ]
}

export function requestPaymentEmail(b: BookingEmailData) {
  const [greeting, intro, proof, thanks] = requestPaymentParagraphs(b).map(stripInline)
  return {
    to: b.email,
    subject: requestPaymentSubject(b),
    body: [
      greeting,
      "",
      intro,
      "",
      QR_ATTACHMENT_NOTE,
      "",
      proof,
      "",
      thanks,
      "",
      "— Tsuchi Studio",
    ].join("\n"),
  }
}

// ------------------------------------------------------------------- confirmation

export const CONFIRMATION_SUBJECT = "Welcome to Tsuchi Studio!"

/** Sent once payment is verified. */
export function confirmationParagraphs(b: BookingEmailData): string[] {
  return [
    `Hello, ${b.name}!`,
    `Welcome to Tsuchi Studio! We're sending you this email to confirm your payment of ${hl(
      amountOf(b)
    )} to reserve ${hl(slotWord(b.slots))} for ${hl(b.workshop)} on ${hl(
      `${b.date} from ${b.time}`
    )}. Wear something comfy, and get ready to build something new with us!`,
    "Please note that the fee paid is {red|non-refundable}, and you may only change your schedule up to a week before your scheduled workshop, and only within the next three months of your initial booking. To maximize your timeslot, please make sure to arrive at least 10-15 minutes before your schedule.",
    "Thank you for deciding to join us at our studio!",
    "See you soon!",
  ]
}

export function confirmationEmail(b: BookingEmailData) {
  return {
    to: b.email,
    subject: CONFIRMATION_SUBJECT,
    body: [...confirmationParagraphs(b).map(stripInline), "", "— Tsuchi Studio"].join("\n\n"),
  }
}

// ----------------------------------------------------------------------- expired

export const EXPIRED_SUBJECT = "Your Tsuchi Studio reservation has expired"

/** Sent when payment isn't made within the 24-hour window. */
export function expiredParagraphs(b: BookingEmailData): string[] {
  return [
    `Hello, ${b.name}!`,
    `We regret to inform you that your reservation for ${hl(slotWord(b.slots))} for ${hl(
      b.workshop
    )} on ${hl(`${b.date} at ${b.time}`)} has expired. The booking fee of ${hl(
      amountOf(b)
    )} was not paid within the 24 hour reservation window, and your booking has automatically been cancelled.`,
    "If you would like to book another session at Tsuchi Studio, kindly submit another booking through our official website and be sure to pay the required amount within the set timeframe.",
    "Thank you so much, and we are hoping for your understanding!",
  ]
}

export function expiredEmail(b: BookingEmailData) {
  return {
    to: b.email,
    subject: EXPIRED_SUBJECT,
    body: [...expiredParagraphs(b).map(stripInline), "", "— Tsuchi Studio"].join("\n\n"),
  }
}

// ------------------------------------------------------------------ already filled

export const ALREADY_FILLED_SUBJECT = "An update on your Tsuchi Studio reservation"

/** Sent when the slot filled up before this booking could be confirmed. */
export function alreadyFilledParagraphs(b: BookingEmailData): string[] {
  return [
    `Hello, ${b.name}!`,
    `Due to the high volume of bookings, we regret to inform you that your reservation for ${hl(
      slotWord(b.slots)
    )} for ${hl(b.workshop)} on ${hl(`${b.date} at ${b.time}`)} has already been filled by another client.`,
    "We would be happy to reassign you to our next available booking, or coordinate with you according to your availability within the next three months. To reschedule, kindly reply to this email or contact us via our Instagram or Facebook page.",
    "Thank you so much! We look forward to assisting you!",
  ]
}

export function alreadyFilledEmail(b: BookingEmailData) {
  return {
    to: b.email,
    subject: ALREADY_FILLED_SUBJECT,
    body: [...alreadyFilledParagraphs(b).map(stripInline), "", "— Tsuchi Studio"].join("\n\n"),
  }
}

export { PAYMENT_NOTICE }
