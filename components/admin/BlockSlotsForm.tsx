"use client"

import { useState } from "react"
import { blockSlots } from "@/app/admin/actions"
import { ALL_WORKSHOPS } from "@/lib/constants"

const FIELD =
  "w-full rounded-lg border border-divider bg-paper px-3 py-2.5 text-sm outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/15 disabled:cursor-not-allowed disabled:opacity-50"
const SELECT = `${FIELD} field-select cursor-pointer`
const LABEL = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted"

export default function BlockSlotsForm({
  workshops,
}: {
  workshops: { id: string; name: string; capacity: number }[]
}) {
  const [workshopId, setWorkshopId] = useState("")
  const all = workshopId === ALL_WORKSHOPS

  return (
    <form action={blockSlots} className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
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
          <span className={LABEL}>Date</span>
          <input name="date" type="date" required className={FIELD} />
        </label>
        <label className="block w-24">
          <span className={LABEL}>Slots</span>
          {/* "All workshops" closes the session outright, so there's nothing to choose. */}
          <input
            name="slots"
            type="number"
            min={1}
            defaultValue={1}
            disabled={all}
            placeholder={all ? "All" : undefined}
            className={FIELD}
          />
        </label>
      </div>

      <label className="block">
        <span className={LABEL}>Reason</span>
        <input name="reason" placeholder="Optional" className={FIELD} />
      </label>

      <div className="flex items-center justify-end gap-4 sm:col-span-2">
        {all && (
          <p className="mr-auto text-xs text-muted">
            Every slot in this session will be blocked across all workshops.
          </p>
        )}
        <button className="rounded-full bg-olive px-7 py-2.5 text-sm text-cream transition hover:opacity-90">
          Block slots
        </button>
      </div>
    </form>
  )
}
