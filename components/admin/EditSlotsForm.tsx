"use client"

import { useActionState, useEffect, useState } from "react"
import { updateCapacities, type CapacityState } from "@/app/admin/actions"

const FIELD =
  "w-20 rounded-lg border border-divider bg-paper px-3 py-2 text-sm outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/15"

/**
 * Sets how many slots each workshop seats per session — the real capacity in the
 * database, so a change here immediately changes what customers can book.
 */
export default function EditSlotsForm({
  workshops,
}: {
  workshops: { id: string; name: string; capacity: number }[]
}) {
  const [state, action, pending] = useActionState<CapacityState, FormData>(updateCapacities, null)
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(workshops.map((w) => [w.id, w.capacity]))
  )
  const [saved, setSaved] = useState(false)

  // The DB is the source of truth — resync when the page revalidates.
  useEffect(() => {
    setValues(Object.fromEntries(workshops.map((w) => [w.id, w.capacity])))
  }, [workshops])

  useEffect(() => {
    if (state && "ok" in state) {
      setSaved(true)
      const t = setTimeout(() => setSaved(false), 2500)
      return () => clearTimeout(t)
    }
  }, [state])

  const dirty = workshops.some((w) => values[w.id] !== w.capacity)
  const invalid = workshops.some((w) => !Number.isInteger(values[w.id]) || values[w.id] < 1)

  return (
    <form action={action}>
      <ul className="divide-y divide-divider">
        {workshops.map((w) => {
          const changed = values[w.id] !== w.capacity
          return (
            <li key={w.id} className="flex items-center justify-between gap-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm">{w.name}</p>
                {changed && (
                  <p className="text-xs text-muted">
                    was {w.capacity} slot{w.capacity === 1 ? "" : "s"}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  name={`capacity_${w.id}`}
                  type="number"
                  min={1}
                  value={values[w.id] ?? w.capacity}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [w.id]: Math.max(1, Number(e.target.value) || 0) }))
                  }
                  className={`${FIELD} ${changed ? "border-olive" : ""}`}
                />
                <span className="w-24 text-xs text-muted">slots / session</span>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-divider pt-4">
        {state && "error" in state ? (
          <p className="mr-auto text-xs text-red-600">{state.error}</p>
        ) : saved ? (
          <p className="mr-auto text-xs text-olive">Saved — availability updated.</p>
        ) : (
          <p className="mr-auto text-xs text-muted">
            Changing this affects what customers can book right away.
          </p>
        )}

        <button
          type="submit"
          disabled={pending || invalid || !dirty}
          className="rounded-full bg-olive px-7 py-2.5 text-sm text-cream transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save slots"}
        </button>
      </div>
    </form>
  )
}
