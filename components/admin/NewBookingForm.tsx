"use client"

import { useActionState, useState } from "react"
import BookingCalendar from "@/components/BookingCalendar"
import { useAvailability } from "./useAvailability"
import { createAdminBooking, type NewBookingState } from "@/app/admin/actions"
import { WORKSHOPS } from "@/lib/workshops"

const FIELD =
  "w-full rounded-lg border border-divider bg-paper px-3 py-2.5 text-sm outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/15"
const SELECT = `${FIELD} field-select cursor-pointer`
const LABEL = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted"

const SESSIONS = ["MORNING", "AFTERNOON", "EVENING"] as const
const SESSION_LABELS: Record<string, string> = {
  MORNING: "Morning · 9:00–12:00",
  AFTERNOON: "Afternoon · 1:00–4:00",
  EVENING: "Evening · 4:00–7:00",
}

export default function NewBookingForm({
  workshops,
}: {
  workshops: { id: string; name: string; capacity: number }[]
}) {
  const [state, action, pending] = useActionState<NewBookingState, FormData>(createAdminBooking, null)

  const [workshopId, setWorkshopId] = useState("")
  const [dateStr, setDateStr] = useState<string | null>(null)
  const [period, setPeriod] = useState<string | null>(null)
  // Raw text so the field can be emptied mid-typing; the number falls back to 1.
  const [partyRaw, setPartyRaw] = useState("1")
  const partySize = Math.max(1, Math.floor(Number(partyRaw)) || 1)
  const belowMin = partyRaw.trim() !== "" && Math.floor(Number(partyRaw)) < 1

  const { avail, remainingFor } = useAvailability(workshopId)

  // Same add-on the customer form offers (second session + glazing on the
  // ceramic workshops) — the action appends it to the notes when checked.
  const addon = WORKSHOPS.find((w) => w.workshopId === workshopId)?.addon

  const slotsLeft = period ? remainingFor(dateStr, period) : avail.capacity
  const overCapacity = Boolean(workshopId) && partySize > slotsLeft

  function pickWorkshop(id: string) {
    setWorkshopId(id)
    setDateStr(null) // availability differs per workshop, so re-pick
    setPeriod(null)
  }

  return (
    <form action={action} className="rounded-2xl border border-divider bg-card p-6 sm:p-8">
      <input type="hidden" name="date" value={dateStr ?? ""} />
      <input type="hidden" name="period" value={period ?? ""} />
      <input type="hidden" name="partySize" value={partySize} />

      <div className="grid gap-8 md:grid-cols-[19rem_1fr]">
        {/* availability — driven by what's actually free in the database */}
        <div>
          <label className="block">
            <span className={LABEL}>Workshop</span>
            <select
              name="workshopId"
              required
              value={workshopId}
              onChange={(e) => pickWorkshop(e.target.value)}
              className={SELECT}
            >
              <option value="" disabled>
                Choose a workshop…
              </option>
              {workshops.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} (max {w.capacity})
                </option>
              ))}
            </select>
          </label>

          {!workshopId ? (
            <p className="mt-4 rounded-lg border border-dashed border-divider px-3 py-6 text-center text-xs text-muted">
              Pick a workshop to see which dates are open.
            </p>
          ) : (
            <>
              <div className="mt-4">
                <span className={LABEL}>Workshop date</span>
                <BookingCalendar
                  capacity={avail.capacity}
                  booked={avail.booked}
                  closedDates={avail.closedDates}
                  openDates={avail.openDates}
                  minSlots={partySize}
                  selected={dateStr}
                  onSelect={(s) => {
                    setDateStr(s)
                    setPeriod(null)
                  }}
                />
                <p className="mt-2 text-xs text-muted">
                  Only days with {partySize} slot{partySize === 1 ? "" : "s"} free are selectable.
                </p>
              </div>

              {dateStr && (
                <div className="mt-4">
                  <span className={LABEL}>Session</span>
                  <div className="flex flex-col gap-1.5">
                    {SESSIONS.map((p) => {
                      const rem = remainingFor(dateStr, p)
                      const tooSmall = rem < partySize
                      return (
                        <button
                          key={p}
                          type="button"
                          disabled={tooSmall}
                          onClick={() => setPeriod(p)}
                          className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                            period === p ? "border-olive bg-olive/10" : "border-divider"
                          } ${tooSmall ? "cursor-not-allowed opacity-40" : "hover:border-olive"}`}
                        >
                          <span>{SESSION_LABELS[p]}</span>
                          <span className="text-xs text-muted">{rem <= 0 ? "full" : `${rem} left`}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* the guest */}
        <div className="grid content-start gap-x-4 gap-y-4 sm:grid-cols-2">
          <label className="block">
            <span className={LABEL}>Slots</span>
            <input
              type="number"
              min={1}
              value={partyRaw}
              onChange={(e) => setPartyRaw(e.target.value)}
              onBlur={() => setPartyRaw(String(partySize))}
              aria-invalid={overCapacity || belowMin}
              className={`${FIELD} ${overCapacity || belowMin ? "border-red-500 text-red-600" : ""}`}
            />
            {belowMin ? (
              <p className="mt-1 text-xs text-red-600">Minimum 1 slot required.</p>
            ) : (
              overCapacity && (
                <p className="mt-1 text-xs text-red-600">
                  {slotsLeft <= 0 ? "That session is full." : `Only ${slotsLeft} left in that session.`}
                </p>
              )
            )}
          </label>

          <label className="block">
            <span className={LABEL}>Booking status</span>
            <select name="status" defaultValue="PENDING" className={SELECT}>
              <option value="PENDING">UNPAID (pending)</option>
              <option value="CONFIRMED">PAID - CONFIRMED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </label>

          <label className="block">
            <span className={LABEL}>Name</span>
            <input name="name" required placeholder="Full name" className={FIELD} />
          </label>

          <label className="block">
            <span className={LABEL}>Email</span>
            <input name="email" type="email" placeholder="Email (or use Instagram)" className={FIELD} />
          </label>

          <label className="block">
            <span className={LABEL}>Contact no.</span>
            <input name="phone" placeholder="Phone (optional)" className={FIELD} />
          </label>

          <label className="block">
            <span className={LABEL}>Instagram</span>
            <input name="instagram" placeholder="Handle (optional)" className={FIELD} />
          </label>

          <label className="block">
            <span className={LABEL}>Amount paid (₱)</span>
            <input name="bookingFee" type="number" min={0} placeholder="e.g. 600" className={FIELD} />
          </label>

          {addon && (
            <label className="flex items-start gap-2 rounded-lg border border-divider bg-paper p-3 text-sm sm:col-span-2">
              <input type="checkbox" name="addon" value="1" className="mt-0.5 accent-olive" />
              <span>
                Add <span className="font-medium">{addon.label}</span> (+₱
                {addon.price.toLocaleString()}/person)
              </span>
            </label>
          )}

          <label className="block sm:col-span-2">
            <span className={LABEL}>Notes</span>
            <input name="notes" placeholder="Optional" className={FIELD} />
          </label>

          <div className="mt-3 flex items-center justify-end gap-4 border-t border-divider pt-5 sm:col-span-2">
            {state?.error && <p className="mr-auto text-sm text-red-600">{state.error}</p>}
            <button
              type="submit"
              disabled={pending || overCapacity || !dateStr || !period}
              className="rounded-full bg-olive px-7 py-2.5 text-sm text-cream transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Saving…" : "Add booking"}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
