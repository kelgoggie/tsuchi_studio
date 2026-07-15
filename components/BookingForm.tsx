"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import BookingCalendar, { type Booked } from "./BookingCalendar"
import { PAYMENT_NOTICE } from "@/lib/constants"

const FIELD =
  "w-full rounded-lg border border-divider bg-paper px-3 py-2 text-sm outline-none focus:border-olive"

const peso = (n: number) => `₱${n.toLocaleString()}`

const SESSIONS = ["MORNING", "AFTERNOON", "EVENING"] as const
const SESSION_LABELS: Record<string, string> = {
  MORNING: "Morning · 9:00–12:00",
  AFTERNOON: "Afternoon · 1:00–4:00",
  EVENING: "Evening · 4:00–7:00",
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i
// PH mobile/landline, tolerating spaces, dashes and +63: 09xx…, +639xx…, (033) …
const PHONE_RE = /^(\+?63|0)[\d\s-]{9,13}$/

function IconField({
  icon,
  error,
  ...props
}: { icon: React.ReactNode; error?: string | null } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">{icon}</span>
        <input
          {...props}
          aria-invalid={Boolean(error)}
          className={`w-full rounded-lg border bg-paper py-2 pl-9 pr-3 text-sm outline-none transition ${
            error ? "border-red-500 focus:border-red-500" : "border-divider focus:border-olive"
          }`}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
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
  addon,
}: {
  workshopId: string
  capacity: number
  workshopLabel?: string
  price: number
  addon?: { price: number; label: string }
}) {
  const router = useRouter()
  const [dateStr, setDateStr] = useState<string | null>(null)
  const [period, setPeriod] = useState<string | null>(null)
  const [partySize, setPartySize] = useState(1)
  const [addonChecked, setAddonChecked] = useState(false)
  const [email, setEmail] = useState("")
  const [instagram, setInstagram] = useState("")
  const [phone, setPhone] = useState("")
  // Only nag once they've left the field — then keep the feedback live as they fix it.
  const [touched, setTouched] = useState<{ email?: boolean; phone?: boolean }>({})
  const [avail, setAvail] = useState<{
    capacity: number
    booked: Booked
    closedDates: string[]
    openDates: string[]
  }>({
    capacity,
    booked: {},
    closedDates: [],
    openDates: [],
  })
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const loadAvailability = useCallback(async () => {
    try {
      const res = await fetch(`/api/availability?w=${encodeURIComponent(workshopId)}`)
      const d = await res.json()
      if (d && typeof d.capacity === "number") {
        setAvail({
          capacity: d.capacity || capacity,
          booked: d.booked ?? {},
          closedDates: d.closedDates ?? [],
          openDates: d.openDates ?? [],
        })
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

  // Once a session is picked, the party size is capped by *that session's* seats.
  const slotsLeft = period ? remainingFor(period) : maxParty
  const overCapacity = !unlimited && partySize > slotsLeft

  const emailInvalid = email.trim() !== "" && !EMAIL_RE.test(email.trim())
  const phoneInvalid = phone.trim() !== "" && !PHONE_RE.test(phone.trim())
  const emailError = touched.email && emailInvalid ? "Please enter a valid email address." : null
  const phoneError = touched.phone && phoneInvalid ? "Use a PH number, e.g. 0917 123 4567 or +63 917 123 4567." : null

  function selectDate(s: string) {
    setDateStr(s)
    setPeriod(null) // re-pick the session for the new date
  }

  const perPerson = price + (addon && addonChecked ? addon.price : 0)
  const subtotal = perPerson * partySize
  // The class is paid in full upfront — there's no balance left owing.
  const payNow = subtotal

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!dateStr || !period) {
      setStatus("error")
      setMessage("Please choose a date and session.")
      return
    }
    // Surface the field errors even if they never blurred the input.
    if (emailInvalid || phoneInvalid) {
      setTouched({ email: true, phone: true })
      setStatus("error")
      setMessage("Please check the highlighted fields.")
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

    const feeAmount = payNow // full class fee, paid upfront

    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        date: dateStr,
        period,
        partySize,
        notes,
        workshopId,
        workshopLabel,
        feeAmount,
        email,
        instagram,
      }),
    })
    const json = await res.json().catch(() => ({}))

    if (res.ok) {
      setStatus("success")
      form.reset()
      router.push("/book/submitted")
    } else {
      setStatus("error")
      setMessage(json.error ?? "Something went wrong — please try again.")
      loadAvailability() // refresh in case the slot just filled up
    }
  }

  // On success we navigate to /book/submitted, which has the full page chrome.
  if (status === "success") {
    return <p className="text-sm text-muted">Submitting your reservation…</p>
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-3">
      <IconField name="name" required placeholder="Full name" icon={ICONS.name} />

      {/* We send your invoice here. */}
      <IconField
        name="email"
        type="email"
        required
        placeholder="Email — we'll send your invoice here"
        icon={ICONS.email}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
        error={emailError}
      />

      <div className="grid grid-cols-2 items-start gap-3">
        <IconField
          name="phone"
          type="tel"
          placeholder="Phone"
          icon={ICONS.phone}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
          error={phoneError}
        />
        <IconField
          name="instagram"
          placeholder="Instagram (optional)"
          icon={ICONS.instagram}
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
        />
      </div>

      <div>
        <p className="mb-1 text-sm text-muted">Choose a date (closed Mondays)</p>
        <BookingCalendar
          capacity={cap}
          booked={avail.booked}
          closedDates={avail.closedDates}
          openDates={avail.openDates}
          selected={dateStr}
          onSelect={selectDate}
        />
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

      <div>
        <label className="flex items-center justify-between gap-3 text-sm text-muted">
          <span>
            Number of people
            {unlimited ? "" : period ? ` (${slotsLeft} left this session)` : ` (up to ${cap})`}
          </span>
          <input
            type="number"
            min={1}
            max={unlimited ? maxParty : slotsLeft}
            value={partySize}
            // Don't silently clamp — let them overshoot so we can say why it's too many.
            onChange={(e) => setPartySize(Math.max(1, Number(e.target.value) || 1))}
            aria-invalid={overCapacity}
            className={`w-20 rounded-lg border bg-paper px-3 py-2 text-sm outline-none transition ${
              overCapacity ? "border-red-500 text-red-600 focus:border-red-500" : "border-divider focus:border-olive"
            }`}
          />
        </label>

        {overCapacity && (
          <p className="mt-1.5 text-right text-xs text-red-600">
            {!period
              ? `Only ${cap} people fit in a session.`
              : slotsLeft <= 0
                ? "That session is full — please pick another."
                : `Only ${slotsLeft} slot${slotsLeft === 1 ? "" : "s"} left for this session.`}
          </p>
        )}
      </div>

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
        <div className="flex justify-between text-xs text-muted">
          <span>
            {peso(perPerson)} × {partySize}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Total to pay upfront</span>
          <span className="font-semibold">{peso(payNow)}</span>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">{PAYMENT_NOTICE}</p>
      </div>

      <p className="text-xs text-muted">
        Your reservation will be reviewed first. Once it&apos;s approved, we&apos;ll send you the payment
        instructions and QR code for the full amount.
      </p>

      {status === "error" && <p className="text-xs text-red-600">{message}</p>}

      <button
        type="submit"
        disabled={status === "loading" || overCapacity}
        className="mt-auto rounded-full bg-olive px-6 py-2.5 text-sm text-cream transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Sending…" : "Request booking"}
      </button>
    </form>
  )
}
