"use client"

import { useRouter, useSearchParams } from "next/navigation"

/** Day picker for the schedule timetable — sits on the left of the table. */
export default function SchedulePicker({
  date,
  days,
}: {
  date: string
  /** Upcoming open days: "YYYY-MM-DD" + a human label + how many bookings that day. */
  days: { value: string; label: string; count: number }[]
}) {
  const router = useRouter()
  const sp = useSearchParams()

  function go(next: string) {
    const params = new URLSearchParams(sp.toString())
    params.set("d", next)
    router.push(`/admin/schedule?${params.toString()}`)
  }

  return (
    <aside className="rounded-2xl border border-divider bg-card p-4">
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Jump to a date</span>
        <input
          type="date"
          value={date}
          onChange={(e) => e.target.value && go(e.target.value)}
          className="w-full rounded-lg border border-divider bg-paper px-3 py-2.5 text-sm outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/15"
        />
      </label>

      <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-muted">Upcoming days</p>
      <ul className="max-h-96 space-y-0.5 overflow-y-auto">
        {days.map((d) => (
          <li key={d.value}>
            <button
              type="button"
              onClick={() => go(d.value)}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition ${
                d.value === date ? "bg-olive text-cream" : "text-muted hover:bg-paper"
              }`}
            >
              <span>{d.label}</span>
              <span className={`text-xs ${d.value === date ? "text-cream/80" : "text-muted"}`}>
                {d.count === 0 ? "—" : d.count}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
