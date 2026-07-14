// Emails the studio sends from its own Gmail. We don't send from the server, so
// there are two shapes of the same message:
//
//   • plain text  → prefilled into a Gmail compose URL (one click, no images)
//   • HTML        → rendered on /admin/email/<id> and copied into Gmail, which
//                   keeps the banner image and styling
//
// Client-safe: no server-only imports.

export type BookingEmailData = {
  name: string
  email: string
  workshop: string
  /** Already formatted for humans, e.g. "Fri, Jul 17, 2026". */
  date: string
  /** Session label, e.g. "Morning · 9:00–12:00". */
  session: string
  /** Just the hours, e.g. "9:00–12:00". */
  time: string
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

const slotWord = (n: number) => `${n} slot${n === 1 ? "" : "s"}`

/** The confirmation email's prose, shared by the plain-text and HTML versions. */
export function confirmationParagraphs(b: BookingEmailData): string[] {
  const paid = b.bookingFee != null ? peso(b.bookingFee) : "your booking fee"

  return [
    `Hello, ${b.name}!`,
    `Welcome to Tsuchi Studio! We're sending you this email to confirm your payment of ${paid} to reserve ${slotWord(
      b.slots
    )} for "${b.workshop}" on ${b.date} from ${b.time}. Wear something comfy, bring your favorite drink, and get ready to build something new with us!`,
    "Please note that the booking fee paid is non-refundable, and you may only change your schedule up to a week before your scheduled workshop, and only within the next three months of your initial booking. To maximize your timeslot, please make sure to arrive at least 10-15 minutes before your schedule.",
    "Thank you for deciding to join us at our studio!",
    "See you soon!",
  ]
}

export const CONFIRMATION_SUBJECT = "Welcome to Tsuchi Studio!"

/** Plain-text confirmation, for the one-click Gmail draft. */
export function confirmationEmail(b: BookingEmailData) {
  return {
    to: b.email,
    subject: CONFIRMATION_SUBJECT,
    body: [...confirmationParagraphs(b), "", "— Tsuchi Studio"].join("\n\n"),
  }
}

/** The full run-of-show for the customer's session. */
export function scheduleEmail(b: BookingEmailData) {
  const lines = [
    `Hi ${b.name},`,
    "",
    "Here's the full schedule for your upcoming workshop:",
    "",
    `Workshop: ${b.workshop}`,
    `Date: ${b.date}`,
    `Session: ${b.session}`,
    `Slots: ${b.slots}`,
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
