"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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

function IconField({
  icon,
  ...props
}: { icon: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">{icon}</span>
      <input
        {...props}
        className="w-full rounded-lg border border-divider bg-paper py-2 pl-9 pr-3 text-sm outline-none focus:border-olive"
      />
    </div>
  )
}

const icon = (paths: React.ReactNode) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {paths}
  </svg>
)
const ICONS = {
  name: icon(<><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" /></>),
  email: icon(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>),
  phone: icon(<path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />),
  instagram: icon(<><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></>),
}

export default function BookingForm({
  workshopId,
  capacity,
  workshopLabel,
  price,
  bookingFee,
  addon,
}: {
  workshopId: string
  capacity: number
  workshopLabel?: string
  price: number
  bookingFee?: number
  addon?: { price: number; label: string }
}) {
  const router = useRouter()
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
  const unlimited = cap >= 1000 // sentinel: no per-session limit
  const maxParty = unlimited ? 50 : cap
  const remainingFor = (p: string) => (dateStr ? cap - (avail.booked[dateStr]?.[p] ?? 0) : cap)

  function selectDate(s: string) {
    setDateStr(s)
    setPeriod(null) // re-pick the session for the new date
  }

  const perPerson = price + (addon && addonChecked ? addon.price : 0)
  const subtotal = perPerson * partySize
  const deposit = Math.round(subtotal / 2)
  const payNow = bookingFee ?? deposit

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

    // amounts for the sheet: 50/50 split, or a flat booking fee (ceramic → remaining is manual)
    const feeAmount = payNow
    const remaining = bookingFee ? "" : subtotal - deposit

    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, date: dateStr, period, partySize, notes, workshopId, workshopLabel, feeAmount, remaining }),
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
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-paper px-4 py-10">
        <div className="w-full max-w-lg text-center">
          <h2 className="font-script text-4xl leading-tight md:text-5xl">one last thing!</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
            Pay your {peso(payNow)} {bookingFee ? "booking fee" : "deposit"} via GCash or bank transfer to reserve your slot.
          </p>

          <div className="mt-8 flex flex-wrap items-start justify-center gap-8">
            {[
              { label: "GCash", src: "/assets/Gcash.svg" },
              { label: "Bank Transfer", src: "/assets/BPI.svg" },
            ].map((q) => (
              <div key={q.label} className="flex flex-col items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={q.src}
                  alt={`${q.label} QR code`}
                  className="h-44 w-44 rounded-xl border border-divider bg-white object-contain p-2"
                />
                <p className="mt-2 text-sm font-medium">{q.label}</p>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-sm text-sm leading-relaxed text-muted">
            Send a screenshot of your payment to us via Instagram or Gmail to confirm your booking.
          </p>

          <button
            onClick={() => router.push("/workshops")}
            className="mt-8 rounded-full bg-olive px-10 py-2.5 text-sm text-cream transition hover:opacity-90"
          >
            done
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-3">
      <IconField name="name" required placeholder="Full name" icon={ICONS.name} />
      <IconField name="email" type="email" required placeholder="Email" icon={ICONS.email} />
      <div className="grid grid-cols-2 gap-3">
        <IconField name="phone" placeholder="Phone" icon={ICONS.phone} />
        <IconField name="instagram" placeholder="Instagram" icon={ICONS.instagram} />
      </div>

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
                <span className="text-xs text-muted">{unlimited ? "" : full ? "full" : `${rem} left`}</span>
              </button>
            )
          })}
        </div>
      )}

      <label className="flex items-center justify-between gap-3 text-sm text-muted">
        <span>Number of people{unlimited ? "" : ` (up to ${cap})`}</span>
        <input
          type="number"
          min={1}
          max={maxParty}
          value={partySize}
          onChange={(e) => setPartySize(Math.max(1, Math.min(maxParty, Number(e.target.value) || 1)))}
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

      {bookingFee ? (
        <div className="rounded-lg bg-card px-3 py-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Booking fee to reserve</span>
            <span className="font-semibold">{peso(bookingFee)}</span>
          </div>
          <p className="mt-0.5 text-xs text-muted">Deducted from your total workshop fee.</p>
        </div>
      ) : (
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
      )}

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
