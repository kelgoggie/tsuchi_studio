"use client"

import { useActionState, useEffect, useState } from "react"
import BookingCalendar from "@/components/BookingCalendar"
import { useAvailability } from "./useAvailability"
import { updateBooking, type EditBookingState } from "@/app/admin/actions"

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

export type EditableBooking = {
  id: string
  workshopId: string
  date: string // "YYYY-MM-DD"
  period: string
  partySize: number
  name: string
  email: string | null
  phone: string | null
  instagram: string | null
  notes: string | null
  bookingFee: number | null
  status: string
}

export default function EditBookingModal({
  booking,
  workshops,
  onClose,
}: {
  booking: EditableBooking
  workshops: { id: string; name: string; capacity: number }[]
  onClose: () => void
}) {
  const [state, action, pending] = useActionState<EditBookingState, FormData>(updateBooking, null)

  const [workshopId, setWorkshopId] = useState(booking.workshopId)
  const [dateStr, setDateStr] = useState(booking.date)
  const [period, setPeriod] = useState(booking.period)
  const [partySize, setPartySize] = useState(booking.partySize)

  // Availability for the *currently selected* workshop, ignoring this booking's
  // own seats so it isn't blocked by itself.
  const { avail, remainingFor } = useAvailability(workshopId, { excludeId: booking.id, past: true })

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  // Saved — refresh the page data behind the modal.
  useEffect(() => {
    if (state && "ok" in state) onClose()
  }, [state, onClose])

  const cap = avail.capacity
  const slotsLeft = period ? remainingFor(dateStr, period) : cap
  const overCapacity = partySize > slotsLeft

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 py-10"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl border border-divider bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Edit booking</h2>
            <p className="mt-0.5 font-mono text-xs text-muted">{booking.id}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-divider px-3 py-1 text-xs text-muted transition hover:bg-paper"
          >
            Close
          </button>
        </div>

        <form action={action} className="grid gap-6 md:grid-cols-[19rem_1fr]">
          <input type="hidden" name="id" value={booking.id} />
          <input type="hidden" name="date" value={dateStr} />
          <input type="hidden" name="period" value={period} />
          <input type="hidden" name="partySize" value={partySize} />

          {/* date + session */}
          <div>
            <span className={LABEL}>Workshop date</span>
            <BookingCalendar
              capacity={cap}
              booked={avail.booked}
              closedDates={avail.closedDates}
              openDates={avail.openDates}
              minSlots={partySize}
              allowPast
              selected={dateStr}
              onSelect={setDateStr}
            />
            <p className="mt-2 text-xs text-muted">
              Only days with {partySize} slot{partySize === 1 ? "" : "s"} free are selectable.
            </p>

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
          </div>

          {/* the rest of the booking */}
          <div className="grid content-start gap-x-4 gap-y-4 sm:grid-cols-2">
            <label className="block">
              <span className={LABEL}>Workshop</span>
              <select
                name="workshopId"
                value={workshopId}
                onChange={(e) => setWorkshopId(e.target.value)}
                className={SELECT}
              >
                {workshops.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} (max {w.capacity})
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={LABEL}>Slots</span>
              <input
                type="number"
                min={1}
                value={partySize}
                onChange={(e) => setPartySize(Math.max(1, Number(e.target.value) || 1))}
                aria-invalid={overCapacity}
                className={`${FIELD} ${overCapacity ? "border-red-500 text-red-600" : ""}`}
              />
              {overCapacity && (
                <p className="mt-1 text-xs text-red-600">
                  {slotsLeft <= 0 ? "That session is full." : `Only ${slotsLeft} left in that session.`}
                </p>
              )}
            </label>

            <label className="block">
              <span className={LABEL}>Name</span>
              <input name="name" required defaultValue={booking.name} className={FIELD} />
            </label>

            <label className="block">
              <span className={LABEL}>Email</span>
              <input name="email" type="email" defaultValue={booking.email ?? ""} className={FIELD} />
            </label>

            <label className="block">
              <span className={LABEL}>Contact no.</span>
              <input name="phone" defaultValue={booking.phone ?? ""} className={FIELD} />
            </label>

            <label className="block">
              <span className={LABEL}>Instagram</span>
              <input name="instagram" defaultValue={booking.instagram ?? ""} className={FIELD} />
            </label>

            <label className="block">
              <span className={LABEL}>Amount paid (₱)</span>
              <input
                name="bookingFee"
                type="number"
                min={0}
                defaultValue={booking.bookingFee ?? ""}
                className={FIELD}
              />
            </label>

            <label className="block sm:col-span-2">
              <span className={LABEL}>Booking status</span>
              <select name="status" defaultValue={booking.status} className={SELECT}>
                <option value="PENDING">UNPAID (pending)</option>
                <option value="CONFIRMED">PAID - CONFIRMED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </label>

            <label className="block sm:col-span-2">
              <span className={LABEL}>Notes</span>
              <input name="notes" defaultValue={booking.notes ?? ""} className={FIELD} />
            </label>

            <div className="mt-2 flex items-center justify-end gap-4 sm:col-span-2">
              {state && "error" in state && <p className="mr-auto text-sm text-red-600">{state.error}</p>}
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-divider px-5 py-2.5 text-sm text-muted transition hover:bg-paper"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending || overCapacity}
                className="rounded-full bg-olive px-7 py-2.5 text-sm text-cream transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
