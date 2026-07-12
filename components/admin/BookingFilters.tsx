"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

const STATUSES = [
  { value: "PENDING", label: "Unpaid" },
  { value: "CONFIRMED", label: "Paid - confirmed" },
  { value: "CANCELLED", label: "Cancelled" },
]

const SORTS = [
  { value: "recent", label: "Most recent" },
  { value: "oldest", label: "Oldest" },
]

function FilterIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" />
    </svg>
  )
}

function SortIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

/** A checkbox row that looks like a menu item. */
function CheckRow({
  checked,
  label,
  onClick,
}: {
  checked: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition hover:bg-paper"
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
          checked ? "border-olive bg-olive text-cream" : "border-divider bg-paper text-transparent"
        }`}
      >
        <CheckIcon />
      </span>
      {label}
    </button>
  )
}

/** Icon button that opens a floating panel, closing on outside click / Escape. */
function Popover({
  label,
  icon,
  badge,
  children,
}: {
  label: string
  icon: React.ReactNode
  badge?: number
  children: (close: () => void) => React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
          open || badge
            ? "border-olive bg-olive/10 text-olive"
            : "border-divider bg-card text-muted hover:border-olive/40 hover:text-olive"
        }`}
      >
        {icon}
        {label}
        {badge ? (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-olive px-1 text-[10px] font-semibold text-cream">
            {badge}
          </span>
        ) : null}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-60 rounded-xl border border-divider bg-card p-2 shadow-lg shadow-ink/5">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

export default function BookingFilters({
  workshops,
}: {
  workshops: { id: string; name: string }[]
}) {
  const router = useRouter()
  const sp = useSearchParams()

  const selected = (key: string) => sp.get(key)?.split(",").filter(Boolean) ?? []
  const statuses = selected("status")
  const shops = selected("workshop")
  const sort = sp.get("sort") ?? "recent"

  function push(next: URLSearchParams) {
    next.delete("page") // any filter/sort change resets to page 1
    const qs = next.toString()
    router.push(qs ? `/admin?${qs}` : "/admin")
  }

  function toggle(key: string, value: string) {
    const cur = new Set(selected(key))
    if (cur.has(value)) cur.delete(value)
    else cur.add(value)
    const next = new URLSearchParams(sp.toString())
    if (cur.size) next.set(key, [...cur].join(","))
    else next.delete(key)
    push(next)
  }

  function setSort(v: string) {
    const next = new URLSearchParams(sp.toString())
    next.set("sort", v)
    push(next)
  }

  const activeCount = statuses.length + shops.length

  return (
    <div className="flex items-center gap-2">
      <Popover label="Filter" icon={<FilterIcon />} badge={activeCount}>
        {() => (
          <>
            <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
              Status
            </p>
            {STATUSES.map((s) => (
              <CheckRow
                key={s.value}
                checked={statuses.includes(s.value)}
                label={s.label}
                onClick={() => toggle("status", s.value)}
              />
            ))}

            <div className="my-1.5 border-t border-divider" />

            <p className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
              Workshop
            </p>
            {workshops.map((w) => (
              <CheckRow
                key={w.id}
                checked={shops.includes(w.id)}
                label={w.name}
                onClick={() => toggle("workshop", w.id)}
              />
            ))}

            {activeCount > 0 && (
              <>
                <div className="my-1.5 border-t border-divider" />
                <button
                  type="button"
                  onClick={() => router.push("/admin")}
                  className="w-full rounded-lg px-2.5 py-1.5 text-left text-sm text-olive transition hover:bg-paper"
                >
                  Clear filters
                </button>
              </>
            )}
          </>
        )}
      </Popover>

      <Popover label="Sort by" icon={<SortIcon />}>
        {(close) =>
          SORTS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => {
                setSort(s.value)
                close()
              }}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm transition hover:bg-paper ${
                sort === s.value ? "text-olive" : ""
              }`}
            >
              {s.label}
              {sort === s.value && <CheckIcon />}
            </button>
          ))
        }
      </Popover>
    </div>
  )
}
