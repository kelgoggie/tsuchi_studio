"use client"

import { useState } from "react"

const FIELD =
  "w-full rounded-lg border border-divider bg-paper px-3 py-2 text-sm outline-none focus:border-olive"

export default function BookingForm({
  workshopId,
  capacity,
  workshopLabel,
}: {
  workshopId: string
  capacity: number
  workshopLabel?: string
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const today = new Date().toISOString().slice(0, 10)
  // bookings open up to 2 months ahead (matches the server-side limit)
  const maxDate = (() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 2)
    return d.toISOString().slice(0, 10)
  })()

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setStatus("loading")
    setMessage("")

    const data = Object.fromEntries(new FormData(form).entries())
    // tag the chosen offering in notes (e.g. medium vs large rug tufting share capacity)
    const notes = [workshopLabel ? `[${workshopLabel}]` : "", data.notes]
      .filter(Boolean)
      .join(" ")
    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, notes, workshopId }),
    })
    const json = await res.json().catch(() => ({}))

    if (res.ok) {
      setStatus("success")
      setMessage("Booking received! We'll confirm once your payment receipt is verified.")
      form.reset()
    } else {
      setStatus("error")
      setMessage(json.error ?? "Something went wrong — please try again.")
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg bg-olive/10 p-4 text-sm text-olive">
        {message}
        <button onClick={() => setStatus("idle")} className="mt-2 block text-xs underline">
          Book another session
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input name="name" required placeholder="Full name" className={FIELD} />
      <input name="email" type="email" required placeholder="Email" className={FIELD} />
      <input name="phone" placeholder="Phone (optional)" className={FIELD} />
      <input name="instagram" placeholder="Instagram handle (optional)" className={FIELD} />
      <input name="date" type="date" required min={today} max={maxDate} className={FIELD} aria-label="Date" />
      <select name="period" required defaultValue="" className={FIELD} aria-label="Session">
        <option value="" disabled>
          Choose a session…
        </option>
        <option value="MORNING">Morning · 9:00–12:00</option>
        <option value="AFTERNOON">Afternoon · 1:00–4:00</option>
        <option value="EVENING">Evening · 4:00–8:00</option>
      </select>
      <input
        name="partySize"
        type="number"
        min={1}
        max={capacity}
        defaultValue={1}
        className={FIELD}
        aria-label="Number of people"
      />
      <p className="self-center text-xs text-muted">Up to {capacity} per session</p>
      <textarea
        name="notes"
        placeholder="Anything we should know? (optional)"
        rows={2}
        className={`${FIELD} sm:col-span-2`}
      />

      <p className="text-xs text-muted sm:col-span-2">
        After submitting, scan the studio QR to pay and send your receipt via Instagram or email — we&apos;ll
        confirm your slot once it&apos;s verified.
      </p>

      {status === "error" && <p className="text-xs text-red-600 sm:col-span-2">{message}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-full bg-olive px-6 py-2.5 text-sm text-cream transition hover:opacity-90 disabled:opacity-60 sm:col-span-2"
      >
        {status === "loading" ? "Sending…" : "Request booking"}
      </button>
    </form>
  )
}
