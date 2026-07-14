"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const pad = (n: number) => String(n).padStart(2, "0")
const toStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/**
 * Month calendar for picking which day's schedule to view. Days carrying
 * confirmed bookings show a count; closed days are dimmed but still viewable.
 */
export default function SchedulePicker({
  date,
  counts,
  closedDates,
  openDates,
}: {
  date: string
  /** "YYYY-MM-DD" → number of confirmed bookings that day. */
  counts: Record<string, number>
  closedDates: string[]
  /** Mondays the studio has opened. */
  openDates: string[]
}) {
  const router = useRouter()
  const sp = useSearchParams()

  const closed = new Set(closedDates)
  const opened = new Set(openDates)

  const selected = new Date(`${date}T00:00:00`)
  const [view, setView] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1))

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  function go(next: string) {
    const params = new URLSearchParams(sp.toString())
    params.set("d", next)
    router.push(`/admin/schedule?${params.toString()}`)
  }

  const year = view.getFullYear()
  const month = view.getMonth()
  const startPad = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <aside className="rounded-2xl border border-divider bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setView(new Date(year, month - 1, 1))}
          className="rounded px-2 py-1 text-olive transition hover:bg-paper"
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="text-sm font-medium">
          {view.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
        <button
          onClick={() => setView(new Date(year, month + 1, 1))}
          className="rounded px-2 py-1 text-olive transition hover:bg-paper"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase text-muted">
        {WEEKDAYS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />
          const d = new Date(year, month, day)
          const s = toStr(d)
          const isSel = s === date
          const isToday = s === toStr(today)
          const count = counts[s] ?? 0
          // Closed = a blocked day, or a Monday that wasn't opened.
          const isClosed = closed.has(s) || (d.getDay() === 1 && !opened.has(s))

          return (
            <button
              key={i}
              type="button"
              onClick={() => go(s)}
              title={isClosed ? "Closed" : count > 0 ? `${count} booking${count === 1 ? "" : "s"}` : "No bookings"}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-md text-xs transition ${
                isSel
                  ? "bg-olive font-semibold text-cream"
                  : isClosed
                    ? "text-muted/40 hover:bg-paper"
                    : "hover:bg-paper"
              } ${isToday && !isSel ? "ring-1 ring-olive/40" : ""}`}
            >
              {day}
              {/* a dot means the day has confirmed bookings */}
              {count > 0 && (
                <span
                  className={`absolute bottom-1 h-1 w-1 rounded-full ${isSel ? "bg-cream" : "bg-olive"}`}
                />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-divider pt-3 text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-olive" /> has bookings
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-divider" /> closed
        </span>
      </div>
    </aside>
  )
}
