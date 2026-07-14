// Emails the studio sends from its own Gmail. We don't send from the server, so
// there are two shapes of the same message:
//
//   • plain text  → prefilled into a Gmail compose URL (one click, no images)
//   • HTML        → rendered on /admin/email/<id> and copied into Gmail, which
//                   keeps the banner, the QR codes and the styling
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

// ---------------------------------------------------------------- request payment

export const requestPaymentSubject = (b: BookingEmailData) => `Tsuchi Studio -- Booking ID ${b.id}`

/** Asks the customer to pay the full amount and send proof. */
export function requestPaymentParagraphs(b: BookingEmailData): string[] {
  return [
    `Hello, ${b.name}!`,
    `Thank you for choosing Tsuchi Studio to be a part of your creative journey! To confirm your ${slotWord(
      b.slots
    )} for ${b.workshop} on ${b.date} at ${b.time}, kindly pay the full amount of ${amountOf(
      b
    )} through either of the online payment portals below, and send us a screenshot of your transaction details as proof of payment.`,
    `You may reply to this email with your proof of payment, or send it to us via Instagram: ${INSTAGRAM_URL}. Afterwards, you may expect your confirmation email within 24 hours.`,
    "Thank you so much!",
  ]
}

export function requestPaymentEmail(b: BookingEmailData) {
  const [greeting, intro, proof, thanks] = requestPaymentParagraphs(b)
  return {
    to: b.email,
    subject: requestPaymentSubject(b),
    body: [
      greeting,
      "",
      intro,
      "",
      "GCash and bank transfer QR codes are attached to this email.",
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
    `Welcome to Tsuchi Studio! We're sending you this email to confirm your payment of ${amountOf(
      b
    )} to reserve ${slotWord(b.slots)} for "${b.workshop}" on ${b.date} from ${
      b.time
    }. Wear something comfy, bring your favorite drink, and get ready to build something new with us!`,
    "Please note that the fee paid is non-refundable, and you may only change your schedule up to a week before your scheduled workshop, and only within the next three months of your initial booking. To maximize your timeslot, please make sure to arrive at least 10-15 minutes before your schedule.",
    "Thank you for deciding to join us at our studio!",
    "See you soon!",
  ]
}

export function confirmationEmail(b: BookingEmailData) {
  return {
    to: b.email,
    subject: CONFIRMATION_SUBJECT,
    body: [...confirmationParagraphs(b), "", "— Tsuchi Studio"].join("\n\n"),
  }
}

export { PAYMENT_NOTICE }
