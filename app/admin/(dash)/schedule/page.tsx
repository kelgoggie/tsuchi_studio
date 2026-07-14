import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { parseDateOnly, PERIODS, PERIOD_LABELS, SEAT_HOLDING } from "@/lib/booking"
import { fmtLongDate, todayInStudio } from "@/lib/format"
import SchedulePicker from "@/components/admin/SchedulePicker"
import { removeSlotBlock } from "@/app/admin/actions"
import { type Period } from "@/app/generated/prisma/client"

export const dynamic = "force-dynamic"

/** The calendar can browse a month back and a few months forward. */
function calendarRange(): { min: Date; max: Date } {
  const min = new Date(`${todayInStudio()}T00:00:00.000Z`)
  min.setUTCMonth(min.getUTCMonth() - 1)
  const max = new Date(`${todayInStudio()}T00:00:00.000Z`)
  max.setUTCMonth(max.getUTCMonth() + 4)
  return { min, max }
}

export default async function AdminSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>
}) {
  const sp = await searchParams
  const dateStr = (sp.d && parseDateOnly(sp.d) ? sp.d : todayInStudio()) as string
  const date = parseDateOnly(dateStr)!

  const { min, max } = calendarRange()

  const [openings, closures, workshops, bookings, closure, blocks, counts] = await Promise.all([
    prisma.opening.findMany({ select: { date: true } }),
    prisma.closure.findMany({ where: { period: null }, select: { date: true } }),
    prisma.workshop.findMany({
      where: { active: true },
      select: { id: true, name: true, capacity: true },
      orderBy: { sortOrder: "asc" },
    }),
    // The day's run-of-show: only paid/confirmed bookings hold a seat, so only
    // those are actually on the schedule.
    prisma.booking.findMany({
      where: { date, status: { in: SEAT_HOLDING } },
      include: { workshop: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.closure.findFirst({ where: { date, period: null } }),
    prisma.slotBlock.findMany({ where: { date } }),
    // Confirmed bookings per day, so the calendar can dot the busy days.
    prisma.booking.groupBy({
      by: ["date"],
      where: { status: { in: SEAT_HOLDING }, date: { gte: min, lte: max } },
      _count: { _all: true },
    }),
  ])

  const openMondays = new Set(openings.map((o) => o.date.toISOString().slice(0, 10)))
  const openDates = [...openMondays]
  const closedDates = closures.map((c) => c.date.toISOString().slice(0, 10))
  const countByDay: Record<string, number> = Object.fromEntries(
    counts.map((c) => [c.date.toISOString().slice(0, 10), c._count._all])
  )

  const isMonday = date.getUTCDay() === 1
  const closed = Boolean(closure) || (isMonday && !openMondays.has(dateStr))

  // Seats held back by the admin, per workshop + session.
  const blocksIn = (workshopId: string, period: Period) =>
    blocks.filter((b) => b.workshopId === workshopId && b.period === period)

  const blockedFor = (workshopId: string, period: Period) =>
    blocksIn(workshopId, period).reduce((sum, b) => sum + b.slots, 0)

  const bookingsIn = (workshopId: string, period: Period) =>
    bookings.filter((b) => b.workshopId === workshopId && b.period === period)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Studio Schedules</h1>
        <p className="mt-0.5 text-sm text-muted">{fmtLongDate(date)}</p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[17rem_1fr]">
        <Suspense fallback={null}>
          <SchedulePicker
            date={dateStr}
            counts={countByDay}
            closedDates={closedDates}
            openDates={openDates}
          />
        </Suspense>

        <div>
          {closed && (
            <p className="mb-4 rounded-xl border border-divider bg-card px-4 py-3 text-sm text-muted">
              The studio is closed on this day — no sessions can be booked.
            </p>
          )}

          <div className="overflow-x-auto rounded-2xl border border-divider bg-card">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead className="border-b border-divider text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="w-40 px-4 py-3">Session</th>
                  {workshops.map((w) => (
                    <th key={w.id} className="px-4 py-3">
                      {w.name}
                      <span className="ml-1 font-normal normal-case text-muted/70">(max {w.capacity})</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((period) => (
                  <tr key={period} className="border-b border-divider/60 last:border-0 align-top">
                    <th className="whitespace-nowrap px-4 py-4 text-left text-sm font-medium">
                      {PERIOD_LABELS[period]}
                    </th>

                    {workshops.map((w) => {
                      const rows = bookingsIn(w.id, period)
                      const taken = rows.reduce((sum, b) => sum + b.partySize, 0)
                      const held = blockedFor(w.id, period)
                      const left = Math.max(0, w.capacity - taken - held)

                      return (
                        <td key={w.id} className="px-4 py-4">
                          <div className="space-y-1.5">
                            {rows.map((b) => (
                              <div
                                key={b.id}
                                className="rounded-lg border border-green-300 bg-green-50 px-2.5 py-1.5 text-xs"
                              >
                                <div className="font-medium">
                                  {b.name} <span className="text-muted">· {b.partySize}</span>
                                </div>
                                <div className="text-[10px] uppercase tracking-wide text-muted">
                                  {b.partySize} slot{b.partySize === 1 ? "" : "s"} · confirmed
                                </div>
                              </div>
                            ))}

                            {blocksIn(w.id, period).map((blk) => (
                              <div
                                key={blk.id}
                                className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-divider px-2.5 py-1.5 text-xs text-muted"
                              >
                                <span>
                                  {blk.slots} slot{blk.slots === 1 ? "" : "s"} blocked
                                  {blk.reason ? ` · ${blk.reason}` : ""}
                                </span>
                                <form action={removeSlotBlock}>
                                  <input type="hidden" name="id" value={blk.id} />
                                  <button
                                    title="Unblock these slots"
                                    className="rounded-full border border-divider px-2 py-0.5 text-[10px] transition hover:border-olive hover:text-olive"
                                  >
                                    Unblock
                                  </button>
                                </form>
                              </div>
                            ))}

                            {rows.length === 0 && held === 0 && (
                              <p className="text-xs text-muted/60">—</p>
                            )}

                            <p className="pt-0.5 text-[11px] text-muted">
                              {closed ? "closed" : left === 0 ? "full" : `${left} left`}
                            </p>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
