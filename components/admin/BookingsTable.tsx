"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import EditBookingButton from "./EditBookingButton"
import EmailComposeButton from "./EmailComposeButton"
import type { EditableBooking } from "./EditBookingModal"
import type { BookingEmailData } from "@/lib/email"
import { setBookingStatus } from "@/app/admin/actions"

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "PAID - CONFIRMED",
  PENDING: "UNPAID",
  CANCELLED: "CANCELLED",
}
const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-green-100 text-green-800",
  PENDING: "bg-gray-200 text-gray-600",
  CANCELLED: "bg-red-100 text-red-700",
}

const PILL =
  "whitespace-nowrap rounded-full border border-divider px-2 py-0.5 text-[11px] text-muted transition hover:bg-paper"
const ICON =
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-divider px-2 py-0.5 text-[11px] text-muted transition hover:border-olive hover:text-olive"

function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

const MAIL_ICONS = {
  payment: <Svg><path d="M6 4h7a4 4 0 0 1 0 8H6M6 8h9M6 12h7M8 4v16" /></Svg>,
  confirmation: <Svg><path d="M20 6 9 17l-5-5" /></Svg>,
  expired: <Svg><circle cx="12" cy="12" r="9" /><path d="M8 16s1.5-2 4-2 4 2 4 2M9 9h.01M15 9h.01" /></Svg>,
  filled: <Svg><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Svg>,
} as const

/** Everything a row shows, pre-formatted on the server (dates are PH time). */
export type BookingRowData = {
  booking: EditableBooking
  bookedOn: string
  workshopName: string
  dateLabel: string
  dayLabel: string
  sessionLabel: string
  feeLabel: string
  /** Everything the email builders need, so the buttons work client-side. */
  email: BookingEmailData
}

type Column = {
  key: string
  label: string
  width: number
  /** true for the sortable Workshop Date column. */
  sortable?: boolean
  /** Right-side action cells shouldn't be clipped mid-button. */
  noTruncate?: boolean
}

// Data columns (chevron + "#" are separate, fixed leading columns). Defaults are
// tuned so the Actions and Emails buttons each sit on one row.
const COLUMNS: Column[] = [
  { key: "bookedOn", label: "Booked On", width: 120 },
  { key: "name", label: "Name", width: 140 },
  { key: "workshop", label: "Workshop", width: 130 },
  { key: "date", label: "Workshop Date", width: 150, sortable: true },
  { key: "session", label: "Session", width: 150 },
  { key: "actions", label: "Actions", width: 210, noTruncate: true },
  { key: "emails", label: "Emails", width: 420, noTruncate: true },
]

const MIN_WIDTH = 60
const STORAGE_KEY = "tsuchi-admin-col-widths-v2"

function StatusButton({ id, status, label }: { id: string; status: string; label: string }) {
  return (
    <form action={setBookingStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className={PILL}>{label}</button>
    </form>
  )
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 break-words">{value}</p>
    </div>
  )
}

function BookingRow({
  row,
  index,
  widths,
  workshops,
  striped,
  expandAll,
}: {
  row: BookingRowData
  index: number
  widths: Record<string, number>
  workshops: { id: string; name: string; capacity: number }[]
  striped: boolean
  expandAll: boolean
}) {
  const [open, setOpen] = useState(false)
  const expanded = open || expandAll
  const b = row.booking
  const bg = striped ? "bg-cream" : "bg-card"

  /** Cell contents keyed by column. */
  function cell(key: string) {
    switch (key) {
      case "bookedOn":
        return <span className="text-muted">{row.bookedOn}</span>
      case "name":
        return <span className="font-medium">{b.name}</span>
      case "workshop":
        return row.workshopName
      case "date":
        return (
          <>
            {row.dayLabel}
            <span className="text-muted"> · {row.dateLabel}</span>
          </>
        )
      case "session":
        return <span className="text-muted">{row.sessionLabel}</span>
      case "actions":
        return (
          <div className="flex items-center gap-1">
            <EditBookingButton booking={b} workshops={workshops} />
            {b.status !== "CONFIRMED" && <StatusButton id={b.id} status="CONFIRMED" label="Confirm" />}
            {b.status !== "CANCELLED" && <StatusButton id={b.id} status="CANCELLED" label="Cancel" />}
            {b.status !== "PENDING" && <StatusButton id={b.id} status="PENDING" label="Pending" />}
          </div>
        )
      case "emails":
        return (
          <div className="flex flex-nowrap items-center gap-1">
            <EmailComposeButton kind="request" data={row.email} icon={MAIL_ICONS.payment} label="Payment" className={ICON} />
            <EmailComposeButton kind="confirmation" data={row.email} icon={MAIL_ICONS.confirmation} label="Confirmation" className={ICON} />
            <EmailComposeButton kind="expired" data={row.email} icon={MAIL_ICONS.expired} label="Expired" className={ICON} />
            <EmailComposeButton kind="filled" data={row.email} icon={MAIL_ICONS.filled} label="Filled" className={ICON} />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <>
      <tr className={`border-b border-divider/60 ${bg}`}>
        <td className="px-2 py-2">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={expanded}
            aria-label={expanded ? "Hide details" : "Show details"}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted transition hover:bg-divider/40 hover:text-olive"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${expanded ? "rotate-90" : ""}`}>
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </td>
        <td className="px-2 py-2 text-right text-xs tabular-nums text-muted/70">{index}</td>

        {COLUMNS.map((c) => (
          <td
            key={c.key}
            style={{ width: widths[c.key] }}
            className={`px-3 py-2 align-middle ${c.noTruncate ? "overflow-hidden" : "truncate whitespace-nowrap"}`}
          >
            {cell(c.key)}
          </td>
        ))}
      </tr>

      {expanded && (
        <tr className={bg}>
          <td colSpan={COLUMNS.length + 2} className="border-b border-divider/60 px-3 pb-4 pt-0">
            <div className="rounded-xl border border-divider bg-paper p-4">
              <div className="grid gap-4 text-sm sm:grid-cols-3 lg:grid-cols-4">
                <Detail label="Booking ID" value={<span className="font-mono text-xs">{b.id}</span>} />
                <Detail
                  label="Booking status"
                  value={
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[b.status]}`}>
                      {STATUS_LABEL[b.status]}
                    </span>
                  }
                />
                <Detail label="Slots" value={b.partySize} />
                <Detail label="Amount paid" value={row.feeLabel} />
                <Detail label="Contact no." value={b.phone ?? "—"} />
                <Detail label="Email address" value={b.email ?? "—"} />
                <Detail label="Instagram" value={b.instagram ? `@${b.instagram.replace(/^@/, "")}` : "—"} />
                <Detail label="Notes" value={b.notes || "—"} />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export default function BookingsTable({
  rows,
  workshops,
  startIndex,
  sort,
}: {
  rows: BookingRowData[]
  workshops: { id: string; name: string; capacity: number }[]
  startIndex: number
  sort: string
}) {
  const [expandAll, setExpandAll] = useState(false)
  const router = useRouter()
  const sp = useSearchParams()

  const [widths, setWidths] = useState<Record<string, number>>(() =>
    Object.fromEntries(COLUMNS.map((c) => [c.key, c.width]))
  )

  // Remember the admin's column sizes between visits.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setWidths((w) => ({ ...w, ...JSON.parse(saved) }))
    } catch {
      /* ignore unreadable storage */
    }
  }, [])

  const drag = useRef<{ key: string; startX: number; startWidth: number } | null>(null)

  const onMouseMove = useCallback((e: MouseEvent) => {
    const d = drag.current
    if (!d) return
    const next = Math.max(MIN_WIDTH, d.startWidth + (e.clientX - d.startX))
    setWidths((w) => ({ ...w, [d.key]: next }))
  }, [])

  const onMouseUp = useCallback(() => {
    if (!drag.current) return
    drag.current = null
    document.body.style.cursor = ""
    document.body.style.userSelect = ""
    setWidths((w) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(w))
      } catch {
        /* ignore */
      }
      return w
    })
  }, [])

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [onMouseMove, onMouseUp])

  function startDrag(e: React.MouseEvent, key: string) {
    e.preventDefault()
    e.stopPropagation()
    drag.current = { key, startX: e.clientX, startWidth: widths[key] }
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }

  function resetWidths() {
    const defaults = Object.fromEntries(COLUMNS.map((c) => [c.key, c.width]))
    setWidths(defaults)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
    } catch {
      /* ignore */
    }
  }

  // Clicking Workshop Date cycles soonest-first → latest-first.
  const dateActive = sort === "date" || sort === "date-desc"
  const arrow = sort === "date" ? " ↑" : sort === "date-desc" ? " ↓" : ""
  function sortByDate() {
    const next = new URLSearchParams(sp.toString())
    next.set("sort", sort === "date" ? "date-desc" : "date")
    next.delete("page")
    router.push(`/admin?${next.toString()}`)
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-end gap-3">
        <p className="text-xs text-muted">Drag a column edge to resize</p>
        <button
          type="button"
          onClick={resetWidths}
          className="rounded-full border border-divider px-3 py-1 text-xs text-muted transition hover:border-olive hover:text-olive"
        >
          Reset widths
        </button>
        <button
          type="button"
          onClick={() => setExpandAll((v) => !v)}
          className="rounded-full border border-divider px-3 py-1 text-xs text-muted transition hover:border-olive hover:text-olive"
        >
          {expandAll ? "Collapse all" : "Expand all"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-divider">
        <table className="text-left text-[13px]" style={{ tableLayout: "fixed", width: "max-content", minWidth: "100%" }}>
          <thead className="bg-card text-[10px] uppercase tracking-wide text-muted">
            <tr>
              <th className="w-8 px-2 py-2" />
              <th className="w-10 px-2 py-2 text-right font-semibold">#</th>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  style={{ width: widths[c.key] }}
                  className="relative whitespace-nowrap px-3 py-2 font-semibold"
                >
                  {c.sortable ? (
                    <button
                      type="button"
                      onClick={sortByDate}
                      title="Sort by workshop date"
                      className={`-mx-1 rounded px-1 py-0.5 uppercase tracking-wide transition hover:text-olive ${dateActive ? "text-olive" : ""}`}
                    >
                      {c.label}
                      {arrow}
                    </button>
                  ) : (
                    <span className="block truncate">{c.label}</span>
                  )}
                  {/* drag handle on the column's right edge */}
                  <span
                    onMouseDown={(e) => startDrag(e, c.key)}
                    title="Drag to resize"
                    className="absolute -right-px top-0 z-10 h-full w-1.5 cursor-col-resize select-none hover:bg-olive/40"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <BookingRow
                key={row.booking.id}
                row={row}
                index={startIndex + i + 1}
                widths={widths}
                workshops={workshops}
                striped={i % 2 === 1}
                expandAll={expandAll}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
