"use client"

import { useCallback, useEffect, useState } from "react"
import BookingCalendar, { type Booked } from "./BookingCalendar"

const FIELD =
  "w-full rounded-lg border border-divider bg-paper px-3 py-2 text-sm outline-none focus:border-olive"

const peso = (n: number) => `₱${n.toLocaleString()}`

const SESSIONS = ["MORNING", "AFTERNOON", "EVENING"] as const
const SESSION_LABELS: Record<string, string> = {
  MORNING: "Morning · 9:00–12:00",
  AFTERNOON: "Afternoon · 1:00–4:00",
  EVENING: "Evening · 4:00–8:00",
}

export default function BookingForm({
  workshopId,
  capacity,
  workshopLabel,
  price,
  addon,
}: {
  workshopId: string
  capacity: number
  workshopLabel?: string
  price: number
  addon?: { price: number; label: string }
}) {
  const [dateStr, setDateStr] = useState<string | null>(null)
  const [period, setPeriod] = useState<string | null>(null)
  const [partySize, setPartySize] = useState(1)
  const [addonChecked, setAddonChecked] = useState(false)
  const [avail, setAvail] = useState<{ capacity: number; booked: Booked }>({ capacity, booked: {} })
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const loadAvailability = useCallback(async () => {
    try {
      const res = await fetch(`/api/availability?w=${encodeURIComponent(workshopId)}`)
      const d = await res.json()
      if (d && typeof d.capacity === "number") {
        setAvail({ capacity: d.capacity || capacity, booked: d.booked ?? {} })
      }
    } catch {
      /* keep showing everything as available; the server still enforces capacity */
    }
  }, [workshopId, capacity])

  useEffect(() => {
    loadAvailability()
  }, [loadAvailability])

  const cap = avail.capacity || capacity
  const remainingFor = (p: string) => (dateStr ? cap - (avail.booked[dateStr]?.[p] ?? 0) : cap)

  function selectDate(s: string) {
    setDateStr(s)
    setPeriod(null) // re-pick the session for the new date
  }

  const perPerson = price + (addon && addonChecked ? addon.price : 0)
  const subtotal = perPerson * partySize
  const deposit = Math.round(subtotal / 2)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!dateStr || !period) {
      setStatus("error")
      setMessage("Please choose a date and session.")
      return
    }
    const form = e.currentTarget
    setStatus("loading")
    setMessage("")

    const data = Object.fromEntries(new FormData(form).entries())
    const notes = [
      workshopLabel ? `[${workshopLabel}]` : "",
      addon && addonChecked ? `+ add-on (${peso(addon.price)})` : "",
      data.notes,
    ]
      .filter(Boolean)
      .join(" ")

    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, date: dateStr, period, partySize, notes, workshopId }),
    })
    const json = await res.json().catch(() => ({}))

    if (res.ok) {
      setStatus("success")
      setMessage("Booking received! We'll confirm once your payment receipt is verified.")
      form.reset()
    } else {
      setStatus("error")
      setMessage(json.error ?? "Something went wrong — please try again.")
      loadAvailability() // refresh in case the slot just filled up
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-lg bg-olive/10 p-4 text-sm text-olive">
        {message}
        <button
          onClick={() => {
            setStatus("idle")
            setDateStr(null)
            setPeriod(null)
            loadAvailability()
          }}
          className="mt-2 block text-xs underline"
        >
          Book another session
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-3">
      <input name="name" required placeholder="Full name" className={FIELD} />
      <input name="email" type="email" required placeholder="Email" className={FIELD} />
      <input name="phone" placeholder="Phone (optional)" className={FIELD} />
      <input name="instagram" placeholder="Instagram handle (optional)" className={FIELD} />

      <div>
        <p className="mb-1 text-sm text-muted">Choose a date (closed Mondays)</p>
        <BookingCalendar capacity={cap} booked={avail.booked} selected={dateStr} onSelect={selectDate} />
      </div>

      {dateStr && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">Choose a session</p>
          {SESSIONS.map((p) => {
            const rem = remainingFor(p)
            const full = rem <= 0
            return (
              <button
                key={p}
                type="button"
                disabled={full}
                onClick={() => setPeriod(p)}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                  period === p ? "border-olive bg-olive/10" : "border-divider"
                } ${full ? "cursor-not-allowed opacity-40" : "hover:border-olive"}`}
              >
                <span>{SESSION_LABELS[p]}</span>
                <span className="text-xs text-muted">{full ? "full" : `${rem} left`}</span>
              </button>
            )
          })}
        </div>
      )}

      <label className="flex items-center justify-between gap-3 text-sm text-muted">
        <span>Number of people (up to {cap})</span>
        <input
          type="number"
          min={1}
          max={cap}
          value={partySize}
          onChange={(e) => setPartySize(Math.max(1, Math.min(cap, Number(e.target.value) || 1)))}
          className="w-20 rounded-lg border border-divider bg-paper px-3 py-2 text-sm outline-none focus:border-olive"
        />
      </label>

      {addon && (
        <label className="flex items-start gap-2 rounded-lg border border-divider bg-paper p-3 text-sm">
          <input
            type="checkbox"
            checked={addonChecked}
            onChange={(e) => setAddonChecked(e.target.checked)}
            className="mt-0.5 accent-olive"
          />
          <span>
            Add <span className="font-medium">{addon.label}</span> (+{peso(addon.price)}/person)
          </span>
        </label>
      )}

      <textarea name="notes" placeholder="Anything we should know? (optional)" rows={2} className={FIELD} />

      <div className="rounded-lg bg-card px-3 py-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Subtotal</span>
          <span className="font-semibold">{peso(subtotal)}</span>
        </div>
        <div className="flex justify-between text-xs text-muted">
          <span>50% deposit to reserve</span>
          <span>{peso(deposit)}</span>
        </div>
      </div>

      <p className="text-xs text-muted">
        After submitting, scan the studio QR to pay your deposit and send the receipt via Instagram or email —
        we&apos;ll confirm your slot once it&apos;s verified.
      </p>

      {status === "error" && <p className="text-xs text-red-600">{message}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-auto rounded-full bg-olive px-6 py-2.5 text-sm text-cream transition hover:opacity-90 disabled:opacity-60"
      >
        {status === "loading" ? "Sending…" : "Request booking"}
      </button>
    </form>
  )
}
