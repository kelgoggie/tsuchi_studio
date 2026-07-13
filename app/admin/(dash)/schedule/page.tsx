import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { parseDateOnly, PERIODS, PERIOD_LABELS } from "@/lib/booking"
import { fmtLongDate, todayInStudio } from "@/lib/format"
import SchedulePicker from "@/components/admin/SchedulePicker"
import { BookingStatus, type Period } from "@/app/generated/prisma/client"

export const dynamic = "force-dynamic"

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "border-green-300 bg-green-50",
  PENDING: "border-divider bg-paper",
  CANCELLED: "border-red-200 bg-red-50 opacity-60",
}
const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "PAID - CONFIRMED",
  PENDING: "UNPAID",
  CANCELLED: "CANCELLED",
}

/** The next 21 open days (the studio is closed Mondays unless one was opened). */
function upcomingDays(openMondays: Set<string>): string[] {
  const out: string[] = []
  const start = new Date(`${todayInStudio()}T00:00:00.000Z`)
  for (let i = 0; out.length < 21 && i < 60; i++) {
    const d = new Date(start)
    d.setUTCDate(d.getUTCDate() + i)
    const s = d.toISOString().slice(0, 10)
    const isMonday = d.getUTCDay() === 1
    if (isMonday && !openMondays.has(s)) continue
    out.push(s)
  }
  return out
}

export default async function AdminSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>
}) {
  const sp = await searchParams
  const dateStr = (sp.d && parseDateOnly(sp.d) ? sp.d : todayInStudio()) as string
  const date = parseDateOnly(dateStr)!

  const [openings, workshops, bookings, closure, blocks] = await Promise.all([
    prisma.opening.findMany({ select: { date: true } }),
    prisma.workshop.findMany({
      where: { active: true },
      select: { id: true, name: true, capacity: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.booking.findMany({
      where: { date, status: { not: BookingStatus.CANCELLED } },
      include: { workshop: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.closure.findFirst({ where: { date, period: null } }),
    prisma.slotBlock.findMany({ where: { date } }),
  ])

  const openMondays = new Set(openings.map((o) => o.date.toISOString().slice(0, 10)))
  const days = upcomingDays(openMondays)

  // How many bookings sit on each upcoming day, for the picker's counts.
  const counts = await prisma.booking.groupBy({
    by: ["date"],
    where: {
      status: { not: BookingStatus.CANCELLED },
      date: { gte: parseDateOnly(days[0])!, lte: parseDateOnly(days[days.length - 1])! },
    },
    _count: { _all: true },
  })
  const countByDay = new Map(counts.map((c) => [c.date.toISOString().slice(0, 10), c._count._all]))

  const pickerDays = days.map((value) => ({
    value,
    label: fmtLongDate(parseDateOnly(value)!),
    count: countByDay.get(value) ?? 0,
  }))

  const isMonday = date.getUTCDay() === 1
  const closed = Boolean(closure) || (isMonday && !openMondays.has(dateStr))

  // Seats held back by the admin, per workshop + session.
  const blockedFor = (workshopId: string, period: Period) =>
    blocks
      .filter((b) => b.workshopId === workshopId && b.period === period)
      .reduce((sum, b) => sum + b.slots, 0)

  const bookingsIn = (workshopId: string, period: Period) =>
    bookings.filter((b) => b.workshopId === workshopId && b.period === period)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Studio schedules</h1>
        <p className="mt-0.5 text-sm text-muted">{fmtLongDate(date)}</p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[17rem_1fr]">
        <Suspense fallback={null}>
          <SchedulePicker date={dateStr} days={pickerDays} />
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
                                className={`rounded-lg border px-2.5 py-1.5 text-xs ${STATUS_STYLES[b.status]}`}
                              >
                                <div className="font-medium">
                                  {b.name} <span className="text-muted">· {b.partySize}</span>
                                </div>
                                <div className="text-[10px] uppercase tracking-wide text-muted">
                                  {STATUS_LABEL[b.status]}
                                </div>
                              </div>
                            ))}

                            {held > 0 && (
                              <div className="rounded-lg border border-dashed border-divider px-2.5 py-1.5 text-xs text-muted">
                                {held} slot{held === 1 ? "" : "s"} blocked
                              </div>
                            )}

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
