"use client"

import { useState } from "react"
import { gmailComposeUrl, type BookingEmailData } from "@/lib/email"
import { emailMeta, emailPlainText, renderEmailHtml, type EmailKind } from "@/lib/email-html"

/**
 * One click: copies the formatted email (bold/blue/red highlights, QR codes,
 * wordmark) to the clipboard AND opens a Gmail compose tab with the recipient
 * + subject filled. The admin pastes (Ctrl+V) to drop the formatted email in —
 * Gmail's compose URL can't carry HTML itself. If the copy fails, the plain
 * text is prefilled into the Gmail body so the email is never blank.
 *
 * The copy uses the synchronous execCommand path so it finishes BEFORE the Gmail
 * tab opens; the async Clipboard API can reject once focus leaves this document,
 * which is what made pasted emails come out empty.
 */
function copyHtmlSync(html: string, text: string): boolean {
  const el = document.createElement("div")
  el.setAttribute("contenteditable", "true")
  el.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none;white-space:pre-wrap"
  el.innerHTML = html
  document.body.appendChild(el)

  const range = document.createRange()
  range.selectNodeContents(el)
  const sel = window.getSelection()
  sel?.removeAllRanges()
  sel?.addRange(range)

  let ok = false
  try {
    ok = document.execCommand("copy")
  } catch {
    ok = false
  }

  sel?.removeAllRanges()
  document.body.removeChild(el)

  // Fallback for browsers where execCommand is disabled — fire the async write
  // (best-effort; it may still land before the Gmail tab takes focus).
  if (!ok && navigator.clipboard?.write) {
    try {
      void navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ])
      ok = true
    } catch {
      ok = false
    }
  }
  return ok
}

export default function EmailComposeButton({
  kind,
  data,
  icon,
  label,
  className,
}: {
  kind: EmailKind
  data: BookingEmailData
  icon?: React.ReactNode
  label: string
  className: string
}) {
  const [copied, setCopied] = useState(false)

  function onClick() {
    const { subject } = emailMeta(kind, data)
    const html = renderEmailHtml(kind, data, window.location.origin)
    const text = emailPlainText(kind, data)

    // Copy synchronously first, then open Gmail — both inside the click gesture.
    const ok = copyHtmlSync(html, text)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }

    // Empty body when the copy worked — the paste is the whole email. If the
    // copy failed, prefill the plain text so the email can never go out blank.
    window.open(gmailComposeUrl({ to: data.email, subject, body: ok ? "" : text }), "_blank", "noopener")
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title="Copies the formatted email, then opens Gmail — paste with Ctrl+V"
      className={className}
    >
      {icon}
      {copied ? "Copied — paste!" : label}
    </button>
  )
}
