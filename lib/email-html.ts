// Renders an email as an HTML string, so both the admin preview and the
// one-click "copy + open Gmail" button produce the exact same pretty email.
//
// Client-safe: no server-only imports. Image src needs an absolute origin
// (an email client can't resolve "/images/…"); callers pass window.location.origin
// on the client, or the request host on the server.

import {
  ALREADY_FILLED_SUBJECT,
  alreadyFilledParagraphs,
  CONFIRMATION_SUBJECT,
  confirmationParagraphs,
  EXPIRED_SUBJECT,
  expiredParagraphs,
  requestPaymentParagraphs,
  requestPaymentSubject,
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

/** Heading, subject, paragraphs and QR flag for one email — the single switch. */
export function emailMeta(kind: EmailKind, data: BookingEmailData) {
  switch (kind) {
    case "request":
      return {
        heading: "Tsuchi Studio",
        subject: requestPaymentSubject(data),
        paragraphs: requestPaymentParagraphs(data),
        showQr: true,
      }
    case "expired":
      return {
        heading: "Reservation Expired",
        subject: EXPIRED_SUBJECT,
        paragraphs: expiredParagraphs(data),
        showQr: false,
      }
    case "filled":
      return {
        heading: "Reservation Update",
        subject: ALREADY_FILLED_SUBJECT,
        paragraphs: alreadyFilledParagraphs(data),
        showQr: false,
      }
    default:
      return {
        heading: "Welcome to Tsuchi Studio!",
        subject: CONFIRMATION_SUBJECT,
        paragraphs: confirmationParagraphs(data),
        showQr: false,
      }
  }
}

// Inline styles — email clients strip <style> blocks and class names.
const ST = {
  outer:
    "background-color:#fbf1e6;padding:0 0 8px;font-family:Georgia,'Times New Roman',serif;color:#1b1a17",
  wrap: "margin:0 auto;max-width:620px",
  banner: "display:block;width:100%;height:auto",
  title:
    "margin:0;padding:24px 40px 6px;font-size:27px;font-weight:normal;color:#6f7440;text-align:center",
  p: "margin:0 0 16px;font-size:15px;line-height:1.7;color:#3a382f",
  body: "padding:10px 40px 8px",
  footer: "padding:14px 40px 34px;text-align:center",
  // The wordmark PNG — Gmail blocks SVG, so this is the raster version.
  wordmark: "width:180px;height:auto;margin:0 auto",
  qrRow: "padding:6px 40px 14px;text-align:center",
  qrCell: "display:inline-block;padding:0 12px;vertical-align:top",
  qrLabel:
    "display:block;margin:0 0 8px;padding:8px 22px;background-color:#6f7440;color:#f3ebde;border-radius:999px;font-size:14px",
  qrImg: "display:block;width:180px;height:180px;object-fit:contain;border-radius:12px",
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
