"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

/**
 * "book now" — gated by the studio's terms. The customer has to acknowledge the
 * upfront payment / non-refundable policy before reaching the booking form.
 */
export default function BookNowButton({
  slug,
  className = "",
}: {
  slug: string
  className?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  // Close on Escape, and don't let the page scroll behind the modal.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("keydown", onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-full bg-olive px-5 py-2 text-center text-sm text-cream transition hover:opacity-90 ${className}`}
      >
        book now
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-divider bg-paper p-7 text-center shadow-xl sm:p-9"
          >
            <h2 className="font-script text-3xl leading-tight">before you book</h2>

            <p className="mx-auto mt-4 text-sm leading-relaxed text-muted">
              To confirm your booking and maintain our studio schedules, you will be required to pay the total amount
              for your class within 24 hours of your booking. Please note that booking fees are non-refundable, but we will allow rescheduling under certain conditions.
            </p>

            <div className="mt-7 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-divider px-6 py-2.5 text-sm text-muted transition hover:bg-card"
              >
                Take me back.
              </button>
              <button
                type="button"
                onClick={() => router.push(`/book?w=${slug}`)}
                className="rounded-full bg-sage px-6 py-2.5 text-sm text-cream transition hover:opacity-90"
              >
                Okay, got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
