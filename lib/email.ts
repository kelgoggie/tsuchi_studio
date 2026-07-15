// Emails the studio sends from its own Gmail. We don't send from the server, so
// there are two shapes of the same message:
//
//   • plain text  → prefilled into a Gmail compose URL (one click, no images)
//   • HTML        → rendered on /admin/email/<id> and copied into Gmail — plain
//                   paragraphs with the important details in blue + bold
//
// Client-safe: no server-only imports.

import { PAYMENT_NOTICE } from "@/lib/constants"

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

/** Workshop / date / session details render blue + bold in the HTML email;
 * user info (name, slots, amount) is plain **bold**. */
const hl = (s: string) => `{blue|**${s}**}`

/** Strips the inline markup back to plain text (Gmail URL bodies, clipboard text). */
export function stripInline(raw: string): string {
  return raw
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\{[^|{}]+\|([^{}]+)\}/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
}

export const QR_ATTACHMENT_NOTE = "GCash and bank transfer QR codes are attached to this email."

/** Index of the payment-email paragraph the QR codes sit after. */
export const QR_AFTER_INDEX = 2

// ---------------------------------------------------------------- request payment

export const requestPaymentSubject = (b: BookingEmailData) => `Tsuchi Studio -- Booking ID ${b.id}`

/** Asks the customer to pay the full amount and send proof. */
export function requestPaymentParagraphs(b: BookingEmailData): string[] {
  return [
    `Hello **${b.name}**,`,
    "Thank you for choosing Tsuchi Studio to be a part of your creative journey!",
    `To confirm your **${slotWord(b.slots)}** for our ${hl(b.workshop)} Workshop on ${hl(
      `${b.date} from ${b.time}`
    )}, kindly pay the full amount of **${amountOf(
      b
    )}** through either of the online payment methods below and send us a screenshot of your transaction as proof of payment.`,
    "{red|Please note that workshop fees are non-refundable once the payment has been made.}",
    "To secure your reservation, please complete your payment within 24 hours of receiving this email. After the 24-hour grace period, your reservation will automatically be released, and the slot may be offered to another guest. If you would still like to join the workshop after the grace period, please submit a new booking request or contact us before making any payment.",
    "You may reply to this email with your proof of payment. Once we've verified your payment, you can expect to receive your booking confirmation email within 24 hours.",
    "Thank you, and we look forward to creating with you!",
  ]
}

export function requestPaymentEmail(b: BookingEmailData) {
  const paragraphs = requestPaymentParagraphs(b).map(stripInline)
  // Plain text can't embed the QR images, so point at the attachments instead.
  paragraphs.splice(QR_AFTER_INDEX + 1, 0, QR_ATTACHMENT_NOTE)
  return {
    to: b.email,
    subject: requestPaymentSubject(b),
    body: [...paragraphs, "", "— Tsuchi Studio"].join("\n\n"),
  }
}

// ------------------------------------------------------------------- confirmation

export const CONFIRMATION_SUBJECT = "Welcome to Tsuchi Studio!"

/** Sent once payment is verified. */
export function confirmationParagraphs(b: BookingEmailData): string[] {
  return [
    `Hi **${b.name}**!`,
    "Welcome to Tsuchi Studio! We're excited to have you join us.",
    `This email confirms that we've received your payment of **${amountOf(
      b
    )}** to reserve **${slotWord(b.slots)}** for our ${hl(b.workshop)} Workshop on ${hl(
      `${b.date} from ${b.time}`
    )}.`,
    "To help you make the most of your session, please arrive 10-15 minutes before your scheduled workshop. We also recommend wearing clothes that you're comfortable getting dirty, as our studio crafts can get messy.",
    "{red|Please note that your workshop is non-refundable. If you need to reschedule, you may do so up to one week before your workshop date, and your new booking date must fall within three months of your original reservation.}",
    "Thank you for choosing Tsuchi Studio to be a part of your creative journey. We can't wait to create with you!",
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
    `Hello **${b.name}**,`,
    `We regret to inform you that your reservation for **${slotWord(b.slots)}** for our ${hl(
      b.workshop
    )} Workshop on ${hl(`${b.date} from ${b.time}`)} has expired.`,
    `As we did not receive the required payment of **${amountOf(
      b
    )}** within the 24-hour reservation window, your reservation has been released and the slot may be offered to another guest now.`,
    "If you would still like to join a workshop at Tsuchi Studio, we'd love to have you! Simply submit a new booking through our official website. Once your new reservation is accepted, please complete your payment within the specified timeframe to secure your booking.",
    "Thank you for your understanding, and we hope to welcome you to the studio soon!",
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
    `Hello **${b.name}**,`,
    `Due to the high volume of bookings, we regret to inform you that the workshop schedule you have requested for **${slotWord(
      b.slots
    )}** of our ${hl(b.workshop)} Workshop on ${hl(`${b.date} from ${b.time}`)} is no longer available.`,
    "If you'd still like to join a workshop at Tsuchi Studio, we'd be delighted to have you! Please submit a new booking through our official website, where you can choose another available schedule that best fits your availability within the next three months.",
    "Thank you for your understanding. We look forward to welcoming you to Tsuchi Studio soon!",
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
