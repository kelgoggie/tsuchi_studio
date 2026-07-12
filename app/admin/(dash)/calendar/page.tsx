import { prisma } from "@/lib/prisma"
import { PERIOD_LABELS } from "@/lib/booking"
import ClosureCalendar from "@/components/admin/ClosureCalendar"
import { blockSlots, removeSlotBlock } from "@/app/admin/actions"

export const dynamic = "force-dynamic"

const FIELD =
  "w-full rounded-lg border border-divider bg-paper px-3 py-2.5 text-sm outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/15"
const SELECT = `${FIELD} field-select cursor-pointer`
const LABEL = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted"

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

export default async function AdminCalendarPage() {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const [closures, openings, workshops, blocks] = await Promise.all([
    prisma.closure.findMany({ where: { period: null }, orderBy: { date: "asc" }, select: { date: true } }),
    prisma.opening.findMany({ orderBy: { date: "asc" }, select: { date: true } }),
    prisma.workshop.findMany({
      where: { active: true },
      select: { id: true, name: true, capacity: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.slotBlock.findMany({
      where: { date: { gte: today } },
      include: { workshop: { select: { name: true } } },
      orderBy: [{ date: "asc" }, { period: "asc" }],
    }),
  ])

  const closedDates = closures.map((c) => c.date.toISOString().slice(0, 10))
  const openDates = openings.map((o) => o.date.toISOString().slice(0, 10))

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[22rem_1fr]">
        <ClosureCalendar closedDates={closedDates} openDates={openDates} />

        {/* hold back individual slots */}
        <section className="rounded-2xl border border-divider bg-card p-6">
          <h2 className="text-lg font-semibold tracking-tight">Block slots</h2>

          <form action={blockSlots} className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
            <label className="block">
              <span className={LABEL}>Workshop</span>
              <select name="workshopId" required defaultValue="" className={SELECT}>
                <option value="" disabled>
                  Choose a workshop…
                </option>
                {workshops.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} (max {w.capacity})
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={LABEL}>Session</span>
              <select name="period" required defaultValue="" className={SELECT}>
                <option value="" disabled>
                  Choose a session…
                </option>
                <option value="MORNING">Morning · 9:00–12:00</option>
                <option value="AFTERNOON">Afternoon · 1:00–4:00</option>
                <option value="EVENING">Evening · 4:00–7:00</option>
              </select>
            </label>

            <div className="grid grid-cols-[1fr_auto] gap-4">
              <label className="block">
                <span className={LABEL}>Date</span>
                <input name="date" type="date" required className={FIELD} />
              </label>
              <label className="block w-24">
                <span className={LABEL}>Slots</span>
                <input name="slots" type="number" min={1} defaultValue={1} className={FIELD} />
              </label>
            </div>

            <label className="block">
              <span className={LABEL}>Reason</span>
              <input name="reason" placeholder="Optional" className={FIELD} />
            </label>

            <div className="sm:col-span-2 flex justify-end">
              <button className="rounded-full bg-olive px-7 py-2.5 text-sm text-cream transition hover:opacity-90">
                Block slots
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* the slots currently held back */}
      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Blocked slots</h2>

        {blocks.length === 0 ? (
          <p className="text-sm text-muted">No slots are blocked</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-divider bg-card">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="border-b border-divider text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Session</th>
                  <th className="px-4 py-3">Workshop</th>
                  <th className="px-4 py-3">Slots</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {blocks.map((b) => (
                  <tr key={b.id} className="border-b border-divider/60 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3">{fmtDate(b.date)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{PERIOD_LABELS[b.period]}</td>
                    <td className="px-4 py-3">{b.workshop.name}</td>
                    <td className="px-4 py-3">{b.slots}</td>
                    <td className="px-4 py-3 text-muted">{b.reason ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <form action={removeSlotBlock}>
                        <input type="hidden" name="id" value={b.id} />
                        <button className="rounded-full border border-divider px-3 py-1 text-xs text-muted transition hover:bg-paper">
                          Remove
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
