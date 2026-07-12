"use client"

import { useActionState } from "react"
import { createAdminBooking, type NewBookingState } from "@/app/admin/actions"

const FIELD =
  "w-full rounded-lg border border-divider bg-paper px-3 py-2.5 text-sm outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/15"
const SELECT = `${FIELD} field-select cursor-pointer`
const LABEL = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted"

export default function NewBookingForm({
  workshops,
}: {
  workshops: { id: string; name: string; capacity: number }[]
}) {
  const [state, action, pending] = useActionState<NewBookingState, FormData>(createAdminBooking, null)

  return (
    <form action={action} className="rounded-2xl border border-divider bg-card p-6 sm:p-8">
      <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block">
          <span className={LABEL}>Workshop</span>
          <select name="workshopId" required defaultValue="" className={SELECT}>
            <option value="" disabled>
              Choose a workshop…
            </option>
            {workshops.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={LABEL}>Session</span>
          <select name="period" required defaultValue="" className={SELECT}>
            <option value="" disabled>
              Choose a session…
            </option>
            <option value="MORNING">Morning · 9:00–12:00</option>
            <option value="AFTERNOON">Afternoon · 1:00–4:00</option>
            <option value="EVENING">Evening · 4:00–7:00</option>
          </select>
        </label>

        <div className="grid grid-cols-[1fr_auto] gap-4">
          <label className="block">
            <span className={LABEL}>Workshop date</span>
            <input name="date" type="date" required className={FIELD} />
          </label>
          <label className="block w-24">
            <span className={LABEL}>Slots</span>
            <input name="partySize" type="number" min={1} defaultValue={1} className={FIELD} />
          </label>
        </div>

        <label className="block">
          <span className={LABEL}>Name</span>
          <input name="name" required placeholder="Full name" className={FIELD} />
        </label>

        <label className="block">
          <span className={LABEL}>Email</span>
          <input name="email" type="email" required placeholder="Email" className={FIELD} />
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
          <span className={LABEL}>Booking fee (₱)</span>
          <input name="bookingFee" type="number" min={0} placeholder="e.g. 900" className={FIELD} />
        </label>

        <label className="block">
          <span className={LABEL}>Remaining fee (₱)</span>
          <input name="remainingFee" type="number" min={0} placeholder="e.g. 900" className={FIELD} />
        </label>

        <label className="block">
          <span className={LABEL}>Booking status</span>
          <select name="status" defaultValue="PENDING" className={SELECT}>
            <option value="PENDING">UNPAID (pending)</option>
            <option value="CONFIRMED">PAID - CONFIRMED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className={LABEL}>Notes</span>
          <input name="notes" placeholder="Optional" className={FIELD} />
        </label>
      </div>

      <div className="mt-7 flex items-center justify-end gap-4 border-t border-divider pt-5">
        {state?.error && <p className="mr-auto text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-olive px-7 py-2.5 text-sm text-cream transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Add booking"}
        </button>
      </div>
    </form>
  )
}
