"use client"

import { useActionState, useEffect, useState } from "react"
import { blockSlots, type BlockState } from "@/app/admin/actions"
import { ALL_WORKSHOPS } from "@/lib/constants"
import { useAvailability } from "./useAvailability"

const FIELD =
  "w-full rounded-lg border border-divider bg-paper px-3 py-2.5 text-sm outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/15 disabled:cursor-not-allowed disabled:opacity-50"
const SELECT = `${FIELD} field-select cursor-pointer`
const LABEL = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted"

export default function BlockSlotsForm({
  workshops,
}: {
  workshops: { id: string; name: string; capacity: number }[]
}) {
  const [state, action, pending] = useActionState<BlockState, FormData>(blockSlots, null)
  const [workshopId, setWorkshopId] = useState("")
  const [period, setPeriod] = useState("")
  const [date, setDate] = useState("")
  const [slots, setSlots] = useState(1)
  const [confirmed, setConfirmed] = useState(false)

  // Flash the success note for a few seconds after a block lands.
  useEffect(() => {
    if (state && "ok" in state) {
      setConfirmed(true)
      const t = setTimeout(() => setConfirmed(false), 3500)
      return () => clearTimeout(t)
    }
  }, [state])

  const all = workshopId === ALL_WORKSHOPS
  const chosen = workshops.find((w) => w.id === workshopId)

  // Live availability for the picked workshop, so we know how many slots are
  // actually still free to block (bookings + existing blocks already deducted).
  const { remainingFor } = useAvailability(all ? "" : workshopId)

  // Before a date/session is chosen we can only bound by the workshop's capacity.
  const maxSlots =
    !chosen ? null : date && period ? Math.max(0, remainingFor(date, period)) : chosen.capacity

  const tooMany = maxSlots !== null && !all && slots > maxSlots

  const hint = () => {
    if (all) return "Every slot in this session will be blocked across all workshops."
    if (!chosen) return null
    if (!date || !period) return `${chosen.name} seats ${chosen.capacity} per session.`
    if (maxSlots === 0) return "This session has no free slots left to block."
    return `${maxSlots} of ${chosen.capacity} slot${maxSlots === 1 ? "" : "s"} still free in this session.`
  }

  return (
    <form action={action} className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
      <label className="block">
        <span className={LABEL}>Workshop</span>
        <select
          name="workshopId"
          required
          value={workshopId}
          onChange={(e) => setWorkshopId(e.target.value)}
          className={SELECT}
        >
          <option value="" disabled>
            Choose a workshop…
          </option>
          <option value={ALL_WORKSHOPS}>All workshops</option>
          {workshops.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} (max {w.capacity})
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={LABEL}>Session</span>
        <select
          name="period"
          required
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className={SELECT}
        >
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
          <span className={LABEL}>Date</span>
          <input
            name="date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={FIELD}
          />
        </label>
        <label className="block w-24">
          <span className={LABEL}>Slots</span>
          {/* "All workshops" closes the session outright, so there's nothing to choose. */}
          <input
            name="slots"
            type="number"
            min={1}
            max={maxSlots ?? undefined}
            value={all ? "" : slots}
            onChange={(e) => setSlots(Math.max(1, Number(e.target.value) || 1))}
            disabled={all}
            placeholder={all ? "All" : undefined}
            aria-invalid={tooMany}
            className={`${FIELD} ${tooMany ? "border-red-500 text-red-600" : ""}`}
          />
        </label>
      </div>

      <label className="block">
        <span className={LABEL}>Reason</span>
        <input name="reason" placeholder="Optional" className={FIELD} />
      </label>

      <div className="flex flex-wrap items-center justify-end gap-3 sm:col-span-2">
        {tooMany ? (
          <p className="mr-auto text-xs text-red-600">
            {maxSlots === 0
              ? "This session has no free slots left to block."
              : `You can only block up to ${maxSlots} slot${maxSlots === 1 ? "" : "s"} in this session.`}
          </p>
        ) : state && "error" in state && !confirmed ? (
          <p className="mr-auto text-xs text-red-600">{state.error}</p>
        ) : confirmed && state && "ok" in state ? (
          <p className="mr-auto text-xs text-olive">
            {state.blocked === null
              ? "Session blocked across all workshops."
              : `${state.blocked} slot${state.blocked === 1 ? "" : "s"} blocked successfully.`}
          </p>
        ) : (
          <p className="mr-auto text-xs text-muted">{hint()}</p>
        )}

        <button
          disabled={tooMany || pending}
          className="rounded-full bg-olive px-7 py-2.5 text-sm text-cream transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Blocking…" : "Block slots"}
        </button>
      </div>
    </form>
  )
}
