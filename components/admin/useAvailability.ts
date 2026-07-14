"use client"

import { useCallback, useEffect, useState } from "react"
import type { Booked } from "@/components/BookingCalendar"

export type Availability = {
  capacity: number
  booked: Booked
  closedDates: string[]
  openDates: string[]
}

const EMPTY: Availability = { capacity: 0, booked: {}, closedDates: [], openDates: [] }

/**
 * Live availability for one workshop, straight from the DB.
 *
 * `excludeId` drops a booking's own seats from the count — an edit must not be
 * blocked by itself. `past` lets the admin reach dates behind today.
 */
export function useAvailability(workshopId: string, opts: { excludeId?: string; past?: boolean } = {}) {
  const { excludeId, past } = opts
  const [avail, setAvail] = useState<Availability>(EMPTY)

  const reload = useCallback(async () => {
    if (!workshopId) {
      setAvail(EMPTY)
      return
    }
    try {
      const params = new URLSearchParams({ w: workshopId })
      if (excludeId) params.set("exclude", excludeId)
      if (past) params.set("past", "1")

      const res = await fetch(`/api/availability?${params.toString()}`)
      const d = await res.json()
      if (d && typeof d.capacity === "number") {
        setAvail({
          capacity: d.capacity,
          booked: d.booked ?? {},
          closedDates: d.closedDates ?? [],
          openDates: d.openDates ?? [],
        })
      }
    } catch {
      /* the server still enforces capacity on save */
    }
  }, [workshopId, excludeId, past])

  useEffect(() => {
    reload()
  }, [reload])

  /** Seats left in a session on a given day. */
  const remainingFor = useCallback(
    (date: string | null, period: string) =>
      date ? avail.capacity - (avail.booked[date]?.[period] ?? 0) : avail.capacity,
    [avail]
  )

  return { avail, remainingFor, reload }
}
