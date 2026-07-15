// Renders an email as an HTML string, so both the admin preview and the
// one-click "copy + open Gmail" button produce the exact same email: plain
// paragraphs with bold user info, blue workshop details and a red refund
// notice, plus the QR codes (payment email) and the wordmark at the bottom.
//
// Client-safe: no server-only imports. Image src needs an absolute origin
// (an email client can't resolve "/assets/…"); callers pass
// window.location.origin on the client, or the request host on the server.

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

/** Subject, paragraphs and QR flag for one email — the single switch. */
export function emailMeta(kind: EmailKind, data: BookingEmailData) {
  switch (kind) {
    case "request":
      return {
        subject: requestPaymentSubject(data),
        paragraphs: requestPaymentParagraphs(data),
        showQr: true,
      }
    case "expired":
      return { subject: EXPIRED_SUBJECT, paragraphs: expiredParagraphs(data), showQr: false }
    case "filled":
      return { subject: ALREADY_FILLED_SUBJECT, paragraphs: alreadyFilledParagraphs(data), showQr: false }
    default:
      return { subject: CONFIRMATION_SUBJECT, paragraphs: confirmationParagraphs(data), showQr: false }
  }
}

// Inline styles — email clients strip <style> blocks and class names.
const ST = {
  // Explicit white background — without it, Chrome's copy carries the admin
  // page's cream background into the pasted email.
  outer: "background-color:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#1b1a17;padding:20px 24px",
  p: "margin:0 0 16px;font-size:16px;line-height:1.7",
  qrRow: "padding:2px 0 14px;text-align:center",
  qrCell: "display:inline-block;padding:0 12px;vertical-align:top",
  qrLabel:
    "display:block;margin:0 0 8px;padding:8px 22px;background-color:#6f7440;color:#f3ebde;border-radius:999px;font-size:14px",
  qrImg: "display:block;width:180px;height:180px;object-fit:contain;border-radius:12px",
  footer: "padding:10px 0 6px",
  // The wordmark PNG — Gmail blocks SVG, so this is the raster version.
  wordmark: "width:180px;height:auto",
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

// Named brand colors you can use in the markup below (or write any #hex).
const COLORS: Record<string, string> = {
  blue: "#1155cc",
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
 *   [text](url)         → hyperlink
 *
 * The raw text is escaped FIRST, so anything a customer typed (a name, notes)
 * can never inject HTML — only these markers become real tags.
 */
export function formatInline(raw: string): string {
  let s = esc(raw)
  s = s.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
  s = s.replace(/__(.+?)__/g, "<i>$1</i>")
  s = s.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    `<a href="$2" style="color:${COLORS.blue}">$1</a>`
  )
  s = s.replace(/\{([^|{}]+)\|([^{}]+)\}/g, (whole, name: string, text: string) => {
    const key = name.trim().toLowerCase()
    const color = name.trim().startsWith("#") ? name.trim() : COLORS[key]
    return color ? `<span style="color:${color}">${text}</span>` : whole
  })
  return s
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
  const { paragraphs, showQr } = emailMeta(kind, data)
  const body = [...paragraphs, "— Tsuchi Studio"]
    .map((text, i) => {
      const para = `<p style="${ST.p}">${formatInline(text)}</p>`
      // QR codes sit right after the "portals below" line.
      return showQr && i === 1 ? para + qrBlock(origin) : para
    })
    .join("")
  return (
    `<div style="${ST.outer}">${body}` +
    `<div style="${ST.footer}"><img src="${origin}/assets/tsuchi%20wordmark.png" alt="Tsuchi Studio" style="${ST.wordmark}"/></div>` +
    `</div>`
  )
}

/** Plain-text fallback (strips markup) for the clipboard's text/plain flavor. */
export function emailPlainText(kind: EmailKind, data: BookingEmailData): string {
  const { paragraphs, showQr } = emailMeta(kind, data)
  const parts = paragraphs.map(stripInline)
  // Plain text can't embed the QR images, so point at the attachments instead.
  if (showQr) parts.splice(2, 0, QR_ATTACHMENT_NOTE)
  return parts.join("\n\n") + "\n\n— Tsuchi Studio"
}
