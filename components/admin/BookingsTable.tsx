"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import EditBookingButton from "./EditBookingButton"
import type { EditableBooking } from "./EditBookingModal"
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

/** Everything a row shows, pre-formatted on the server (dates are PH time). */
export type BookingRowData = {
  booking: EditableBooking
  bookedOn: string
  workshopName: string
  dateLabel: string
  dayLabel: string
  sessionLabel: string
  feeLabel: string
  confirmHref: string
  requestHref: string
}

type Column = {
  key: string
  label: string
  width: number
  /** Right-side actions shouldn't be clipped mid-button. */
  noTruncate?: boolean
}

const COLUMNS: Column[] = [
  { key: "bookedOn", label: "Booked On", width: 190, noTruncate: true },
  { key: "name", label: "Name", width: 150 },
  { key: "id", label: "Booking ID", width: 130 },
  { key: "workshop", label: "Workshop", width: 140 },
  { key: "date", label: "Workshop Date", width: 130 },
  { key: "day", label: "Day", width: 95 },
  { key: "session", label: "Session", width: 150 },
  { key: "slots", label: "Slots", width: 60 },
  { key: "phone", label: "Contact No.", width: 130 },
  { key: "email", label: "Email Address", width: 200 },
  { key: "instagram", label: "Instagram", width: 130 },
  { key: "fee", label: "Booking Fee", width: 110 },
  { key: "status", label: "Booking Status", width: 150, noTruncate: true },
  { key: "actions", label: "Actions", width: 200, noTruncate: true },
  { key: "email-actions", label: "Emails", width: 250, noTruncate: true },
]

/**
 * "Compress" squeezes the secondary columns so the two things you act on —
 * the guest's name and the Confirm/Cancel buttons — fit without scrolling.
 * Everything else stays visible, just truncated.
 */
const COMPACT: Record<string, number> = {
  bookedOn: 80,
  name: 140,
  id: 50,
  workshop: 85,
  date: 90,
  day: 45,
  session: 65,
  slots: 40,
  phone: 55,
  email: 70,
  instagram: 50,
  fee: 55,
  status: 105,
  actions: 195,
  "email-actions": 230,
}

const MIN_WIDTH = 40
const STORAGE_KEY = "tsuchi-admin-col-widths"

function StatusButton({ id, status, label }: { id: string; status: string; label: string }) {
  return (
    <form action={setBookingStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className={PILL}>{label}</button>
    </form>
  )
}

export default function BookingsTable({
  rows,
  workshops,
}: {
  rows: BookingRowData[]
  workshops: { id: string; name: string; capacity: number }[]
}) {
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
    drag.current = { key, startX: e.clientX, startWidth: widths[key] }
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }

  function applyWidths(next: Record<string, number>) {
    setWidths(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }

  const resetWidths = () => applyWidths(Object.fromEntries(COLUMNS.map((c) => [c.key, c.width])))
  const compressWidths = () => applyWidths({ ...COMPACT })

  /** Cell contents keyed by column. */
  function cell(col: Column, r: BookingRowData) {
    const b = r.booking
    switch (col.key) {
      case "bookedOn":
        return (
          <div className="flex items-center gap-2">
            <EditBookingButton booking={b} workshops={workshops} />
            <span className="truncate text-muted">{r.bookedOn}</span>
          </div>
        )
      case "name":
        return <span className="font-medium">{b.name}</span>
      case "id":
        return <span className="font-mono text-[11px] text-muted">{b.id}</span>
      case "workshop":
        return r.workshopName
      case "date":
        return r.dateLabel
      case "day":
        return <span className="text-muted">{r.dayLabel}</span>
      case "session":
        return <span className="text-muted">{r.sessionLabel}</span>
      case "slots":
        return b.partySize
      case "phone":
        return <span className="text-muted">{b.phone ?? "—"}</span>
      case "email":
        return <span className="text-muted">{b.email ?? "—"}</span>
      case "instagram":
        return <span className="text-muted">{b.instagram ? `@${b.instagram.replace(/^@/, "")}` : "—"}</span>
      case "fee":
        return r.feeLabel
      case "status":
        return (
          <span
            className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[b.status]}`}
          >
            {STATUS_LABEL[b.status]}
          </span>
        )
      case "actions":
        return (
          <div className="flex gap-1">
            {b.status !== "CONFIRMED" && <StatusButton id={b.id} status="CONFIRMED" label="Confirm" />}
            {b.status !== "CANCELLED" && <StatusButton id={b.id} status="CANCELLED" label="Cancel" />}
            {b.status !== "PENDING" && <StatusButton id={b.id} status="PENDING" label="Pending" />}
          </div>
        )
      case "email-actions":
        return (
          <div className="flex gap-1">
            <a href={r.requestHref} target="_blank" rel="noopener noreferrer" className={PILL}>
              Request payment
            </a>
            <a href={r.confirmHref} target="_blank" rel="noopener noreferrer" className={PILL}>
              Confirmation
            </a>
          </div>
        )
      default:
        return null
    }
  }

  const total = COLUMNS.reduce((sum, c) => sum + widths[c.key], 0)

  return (
    <div>
      <div className="mb-2 flex items-center justify-end gap-2">
        <p className="mr-1 text-xs text-muted">Drag lang ang column edge to resize super handy</p>
        <button
          type="button"
          onClick={compressWidths}
          title="Squeeze the columns so the name and action buttons fit without scrolling"
          className="rounded-full border border-divider px-3 py-1 text-xs text-muted transition hover:border-olive hover:text-olive"
        >
          Compress
        </button>
        <button
          type="button"
          onClick={resetWidths}
          className="rounded-full border border-divider px-3 py-1 text-xs text-muted transition hover:border-olive hover:text-olive"
        >
          Reset widths
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-divider">
        <table
          className="text-left text-[13px]"
          style={{ tableLayout: "fixed", width: total, minWidth: "100%" }}
        >
          <thead className="bg-card text-[10px] uppercase tracking-wide text-muted">
            <tr>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  style={{ width: widths[c.key] }}
                  className="relative border-b border-divider px-3 py-2 font-semibold"
                >
                  <span className="block truncate">{c.label}</span>
                  {/* drag handle on the column's right edge */}
                  <span
                    onMouseDown={(e) => startDrag(e, c.key)}
                    onDoubleClick={resetWidths}
                    title="Drag to resize"
                    className="absolute -right-px top-0 z-10 h-full w-1.5 cursor-col-resize select-none hover:bg-olive/40"
                  />
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.booking.id}
                className={`border-b border-divider/60 last:border-0 ${i % 2 === 1 ? "bg-cream" : "bg-card"}`}
              >
                {COLUMNS.map((c) => (
                  <td
                    key={c.key}
                    style={{ width: widths[c.key] }}
                    className={`px-3 py-2 align-middle ${
                      c.noTruncate ? "overflow-hidden" : "truncate whitespace-nowrap"
                    }`}
                  >
                    {cell(c, r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
