"use client"

import { useEffect, useState } from "react"
import { gmailComposeUrl, type BookingEmailData } from "@/lib/email"
import { emailMeta, emailPlainText, renderEmailHtml, type EmailKind } from "@/lib/email-html"
import { toggleEmailMark } from "@/app/admin/actions"

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

// The QR codes and wordmark ride inside the email as data URIs — a pasted
// <img src="https://…"> breaks when the copy happens from localhost or before
// a deploy, and Gmail turns data URIs into real inline images on send. Cached
// so only the first click per session fetches the files.
const dataUriCache = new Map<string, string>()

async function toDataUri(url: string): Promise<string> {
  const cached = dataUriCache.get(url)
  if (cached) return cached
  const blob = await (await fetch(url)).blob()
  const uri = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
  dataUriCache.set(url, uri)
  return uri
}

async function inlineImages(html: string): Promise<string> {
  const srcs = [...new Set([...html.matchAll(/<img src="([^"]+)"/g)].map((m) => m[1]))]
  const pairs = await Promise.all(srcs.map(async (src) => [src, await toDataUri(src)] as const))
  for (const [src, uri] of pairs) {
    html = html.replaceAll(`<img src="${src}"`, `<img src="${uri}"`)
  }
  return html
}
function copyHtmlSync(html: string, text: string): boolean {
  const el = document.createElement("div")
  el.setAttribute("contenteditable", "true")
  // White background here too — Chrome's copy stamps the element's computed
  // background onto every pasted paragraph, which is where the beige came from.
  el.style.cssText =
    "position:fixed;top:0;left:0;opacity:0;pointer-events:none;white-space:pre-wrap;background:#ffffff"
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
  sent: sentInitial = false,
}: {
  kind: EmailKind
  data: BookingEmailData
  icon?: React.ReactNode
  label: string
  className: string
  /** Server truth: an EmailMark row exists for this booking + kind. */
  sent?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const [sent, setSent] = useState(sentInitial)

  // Follow the server when the page revalidates (e.g. marked from another tab).
  useEffect(() => setSent(sentInitial), [sentInitial])

  async function onClick() {
    // Second click on a marked button only clears the highlight (misclick
    // insurance) — it doesn't open Gmail again.
    if (sent) {
      setSent(false)
      void toggleEmailMark(data.id, kind, false)
      return
    }
    setSent(true)
    void toggleEmailMark(data.id, kind, true)

    const { subject } = emailMeta(kind, data)
    let html = renderEmailHtml(kind, data, window.location.origin)
    const text = emailPlainText(kind, data)

    try {
      html = await inlineImages(html)
    } catch {
      /* image fetch failed — keep the remote URLs, the text still copies */
    }

    // Copy before opening Gmail — both inside the click gesture (the image
    // fetch is local and fast, so the user activation hasn't expired).
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
      title={
        sent
          ? "Already composed for this booking — click again to clear the highlight"
          : "Copies the formatted email, then opens Gmail — paste with Ctrl+V"
      }
      // !important variants so the sage tint beats the border/text utilities
      // that arrive through className.
      className={`${className} ${sent ? "!border-sage/60 !bg-sage/15 !text-sage" : ""}`}
    >
      {icon}
      {copied ? "Copied — paste!" : label}
    </button>
  )
}
