"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

/** Searches name, email, phone, Instagram and booking ID. */
export default function BookingSearch() {
  const router = useRouter()
  const sp = useSearchParams()
  const current = sp.get("q") ?? ""
  const [value, setValue] = useState(current)

  // Keep in step when the URL changes from elsewhere (e.g. "clear filters").
  useEffect(() => setValue(current), [current])

  // Debounce so we're not pushing a route on every keystroke.
  useEffect(() => {
    if (value === current) return
    const t = setTimeout(() => {
      const next = new URLSearchParams(sp.toString())
      if (value.trim()) next.set("q", value.trim())
      else next.delete("q")
      next.delete("page") // a new search starts at page 1
      const qs = next.toString()
      router.push(qs ? `/admin?${qs}` : "/admin")
    }, 300)
    return () => clearTimeout(t)
  }, [value, current, router, sp])

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </span>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search name, email, phone, ID…"
        className="w-64 rounded-full border border-divider bg-card py-2 pl-9 pr-8 text-sm outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/15"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-olive"
        >
          ×
        </button>
      )}
    </div>
  )
}
