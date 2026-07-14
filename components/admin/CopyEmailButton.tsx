"use client"

import { useState } from "react"

/**
 * Copies the rendered email as rich HTML so it can be pasted straight into
 * Gmail — banner image, styling and all. A Gmail compose URL can only carry
 * plain text, which is why this exists.
 */
export default function CopyEmailButton({ targetId }: { targetId: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    const el = document.getElementById(targetId)
    if (!el) return

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([el.innerHTML], { type: "text/html" }),
          "text/plain": new Blob([el.innerText], { type: "text/plain" }),
        }),
      ])
    } catch {
      // Older browsers: fall back to selecting the node and using execCommand.
      const range = document.createRange()
      range.selectNodeContents(el)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
      document.execCommand("copy")
      sel?.removeAllRanges()
    }

    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-full bg-olive px-5 py-2 text-sm text-cream transition hover:opacity-90"
    >
      {copied ? "Copied!" : "Copy email"}
    </button>
  )
}
