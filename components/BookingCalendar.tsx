"use client"

import { useState } from "react"

export type Booked = Record<string, Partial<Record<string, number>>>

const SESSIONS = ["MORNING", "AFTERNOON", "EVENING"] as const
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const pad = (n: number) => String(n).padStart(2, "0")
const toStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export default function BookingCalendar({
  capacity,
  booked,
  closedDates = [],
  openDates = [],
  selected,
  onSelect,
}: {
  capacity: number
  booked: Booked
  closedDates?: string[]
  /** Mondays the studio has opened (Mondays are otherwise closed). */
  openDates?: string[]
  selected: string | null
  onSelect: (date: string) => void
}) {
  const closed = new Set(closedDates)
  const opened = new Set(openDates)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const max = new Date(today)
  max.setMonth(max.getMonth() + 2)

  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))

  // a day is full when every session is at capacity for this class
  const dayFull = (s: string) => SESSIONS.every((p) => capacity - (booked[s]?.[p] ?? 0) <= 0)

  const year = view.getFullYear()
  const month = view.getMonth()
  const startPad = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const monthStart = new Date(year, month, 1)
  const canPrev = monthStart > new Date(today.getFullYear(), today.getMonth(), 1)
  const canNext = monthStart < new Date(max.getFullYear(), max.getMonth(), 1)

  const cells: (number | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="max-w-[19rem] rounded-lg border border-divider bg-paper p-2.5">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => setView(new Date(year, month - 1, 1))}
          className="rounded px-2 py-0.5 text-olive transition hover:bg-olive/10 disabled:opacity-25"
          aria-label="Previous month"
        >
          ‹
        </button>
        <span className="text-sm font-medium text-olive">
          {view.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => setView(new Date(year, month + 1, 1))}
          className="rounded px-2 py-0.5 text-olive transition hover:bg-olive/10 disabled:opacity-25"
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium uppercase text-olive/60">
        {WEEKDAYS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />
          const date = new Date(year, month, day)
          const s = toStr(date)
          // Mondays are closed unless the studio opened that one
          const mondayClosed = date.getDay() === 1 && !opened.has(s)
          // past dates, beyond the window, closed Mondays, blocked-off days, or fully booked
          const disabled = date < today || date > max || mondayClosed || closed.has(s) || dayFull(s)
          const isSel = selected === s
          const isToday = s === toStr(today)
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(s)}
              className={`aspect-square rounded-md text-[11px] transition ${
                isSel
                  ? "bg-olive text-cream"
                  : disabled
                    ? "cursor-not-allowed text-muted/40 line-through"
                    : isToday
                      ? "text-olive ring-1 ring-inset ring-olive/50 hover:bg-olive/10"
                      : "hover:bg-olive/10"
              }`}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
