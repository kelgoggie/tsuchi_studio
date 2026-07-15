// Renders an email as an HTML string, so both the admin preview and the
// one-click "copy + open Gmail" button produce the exact same email: plain
// paragraphs with the important details in blue + bold. No images — pasted
// image-heavy emails were coming out blank in Gmail.
//
// Client-safe: no server-only imports.

import {
  ALREADY_FILLED_SUBJECT,
  alreadyFilledParagraphs,
  CONFIRMATION_SUBJECT,
  confirmationParagraphs,
  EXPIRED_SUBJECT,
  expiredParagraphs,
  QR_ATTACHMENT_NOTE,
  requestPaymentParagraphs,
  requestPaymentSubject,
  stripInline,
  type BookingEmailData,
} from "@/lib/email"

export type EmailKind = "request" | "confirmation" | "expired" | "filled"

export const EMAIL_KINDS: EmailKind[] = ["request", "confirmation", "expired", "filled"]

export const EMAIL_TAB_LABEL: Record<EmailKind, string> = {
  request: "Payment",
  confirmation: "Confirmation",
  expired: "Expired",
  filled: "Filled",
}

/** Subject and paragraphs for one email — the single switch. The payment email
 * gets the QR note right after the intro, same spot the plain body puts it. */
export function emailMeta(kind: EmailKind, data: BookingEmailData) {
  switch (kind) {
    case "request": {
      const [greeting, intro, ...rest] = requestPaymentParagraphs(data)
      return {
        subject: requestPaymentSubject(data),
        paragraphs: [greeting, intro, QR_ATTACHMENT_NOTE, ...rest],
      }
    }
    case "expired":
      return { subject: EXPIRED_SUBJECT, paragraphs: expiredParagraphs(data) }
    case "filled":
      return { subject: ALREADY_FILLED_SUBJECT, paragraphs: alreadyFilledParagraphs(data) }
    default:
      return { subject: CONFIRMATION_SUBJECT, paragraphs: confirmationParagraphs(data) }
  }
}

// Inline styles — email clients strip <style> blocks and class names.
const ST = {
  outer: "font-family:Arial,Helvetica,sans-serif;color:#1b1a17;padding:20px 24px",
  p: "margin:0 0 16px;font-size:14px;line-height:1.7",
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

// Named brand colors you can use in the markup below (or write any #hex).
const COLORS: Record<string, string> = {
  olive: "#6f7440",
  sage: "#5e5e3c",
  muted: "#6b675c",
  red: "#b23b3b",
  ink: "#1b1a17",
}

/**
 * Lightweight, safe inline formatting for email paragraph text:
 *   **bold**            → bold
 *   __italic__          → italic
 *   {olive|text}        → colored text (named color or a #hex)
 *
 * The raw text is escaped FIRST, so anything a customer typed (a name, notes)
 * can never inject HTML — only these three markers become real tags.
 */
export function formatInline(raw: string): string {
  let s = esc(raw)
  s = s.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
  s = s.replace(/__(.+?)__/g, "<i>$1</i>")
  s = s.replace(/\{([^|{}]+)\|([^{}]+)\}/g, (whole, name: string, text: string) => {
    const key = name.trim().toLowerCase()
    const color = name.trim().startsWith("#") ? name.trim() : COLORS[key]
    return color ? `<span style="color:${color}">${text}</span>` : whole
  })
  return s
}

/** Strips the markup back to plain text (for the clipboard's plain-text copy). */
export function stripInline(raw: string): string {
  return raw
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\{[^|{}]+\|([^{}]+)\}/g, "$1")
}

function qrBlock(origin: string): string {
  // PNG, not SVG — Gmail blocks SVG images, so the QR wouldn't show otherwise.
  const cells = [
    { label: "GCash", src: "/assets/Gcash.png" },
    { label: "Bank", src: "/assets/BPI.png" },
  ]
    .map(
      (q) =>
        `<div style="${ST.qrCell}"><span style="${ST.qrLabel}">${q.label}</span>` +
        `<img src="${origin}${q.src}" alt="${q.label} QR code" style="${ST.qrImg}"/></div>`
    )
    .join("")
  return `<div style="${ST.qrRow}">${cells}</div>`
}

/** Full HTML for the email body — identical to what the preview shows. */
export function renderEmailHtml(kind: EmailKind, data: BookingEmailData, origin: string): string {
  const { heading, paragraphs, showQr } = emailMeta(kind, data)

  const body = paragraphs
    .map((text, i) => {
      const para = `<p style="${ST.p}">${formatInline(text)}</p>`
      // QR codes sit right after the "portals below" line.
      return showQr && i === 1 ? para + qrBlock(origin) : para
    })
    .join("")

  return (
    `<div style="${ST.outer}"><div style="${ST.wrap}">` +
    `<img src="${origin}/images/header-img.JPG" alt="Tsuchi Studio" style="${ST.banner}"/>` +
    `<h1 style="${ST.title}">${esc(heading)}</h1>` +
    `<div style="${ST.body}">${body}</div>` +
    `<div style="${ST.footer}">` +
    `<img src="${origin}/assets/tsuchi%20wordmark.png" alt="Tsuchi Studio" style="${ST.wordmark}"/>` +
    `</div>` +
    `</div></div>`
  )
}

/** Plain-text fallback (strips markup) for the clipboard's text/plain flavor. */
export function emailPlainText(kind: EmailKind, data: BookingEmailData): string {
  return emailMeta(kind, data).paragraphs.map(stripInline).join("\n\n") + "\n\n— Tsuchi Studio"
}
