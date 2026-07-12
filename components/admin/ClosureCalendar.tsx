"use client"

import { useState, useTransition } from "react"
import { toggleClosure, toggleOpening } from "@/app/admin/actions"

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const pad = (n: number) => String(n).padStart(2, "0")
const toStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export default function ClosureCalendar({
  closedDates,
  openDates,
}: {
  closedDates: string[]
  /** Mondays that have been unblocked. */
  openDates: string[]
}) {
  const closed = new Set(closedDates)
  const opened = new Set(openDates)
  const [pending, startTransition] = useTransition()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))

  const year = view.getFullYear()
  const month = view.getMonth()
  const startPad = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className={`w-full rounded-2xl border border-divider bg-card p-5 ${pending ? "opacity-60" : ""}`}>
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
          const date = new Date(year, month, day)
          const s = toStr(date)
          const isMonday = date.getDay() === 1
          const isPast = date < today
          // A Monday is blocked unless it's been explicitly unblocked.
          const mondayBlocked = isMonday && !opened.has(s)
          const isClosed = closed.has(s)

          // Mondays toggle their own block; every other day toggles a whole-day closure.
          const onClick = () =>
            startTransition(() => (isMonday ? toggleOpening(s) : toggleClosure(s)))

          const title = isPast
            ? "Past"
            : mondayBlocked
              ? "Blocked Monday — click to unblock"
              : isMonday
                ? "Open — click to block this Monday"
                : isClosed
                  ? "Blocked day — click to unblock"
                  : "Click to block the whole day"

          return (
            <button
              key={i}
              type="button"
              disabled={isPast || pending}
              onClick={onClick}
              title={title}
              className={`aspect-square rounded-md text-xs transition ${
                isPast
                  ? "cursor-not-allowed text-muted/30"
                  : mondayBlocked
                    ? "bg-divider/30 text-muted/60 line-through hover:bg-divider/60"
                    : isClosed
                      ? "bg-sage font-semibold text-cream hover:opacity-85"
                      : "hover:bg-paper"
              }`}
            >
              {day}
            </button>
          )
        })}
      </div>

      <div className="mt-5 space-y-2 border-t border-divider pt-4 text-xs text-muted">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 shrink-0 rounded bg-divider/30" /> Blocked Mondays (click to unblock)
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 shrink-0 rounded bg-sage" /> Blocked Days (click to block an entire day)
        </span>
      </div>
    </div>
  )
}
