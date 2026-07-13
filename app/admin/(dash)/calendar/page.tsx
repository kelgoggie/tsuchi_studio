import { prisma } from "@/lib/prisma"
import { PERIOD_LABELS } from "@/lib/booking"
import { fmtLongDate } from "@/lib/format"
import ClosureCalendar from "@/components/admin/ClosureCalendar"
import BlockSlotsForm from "@/components/admin/BlockSlotsForm"
import { removeSlotBlock } from "@/app/admin/actions"

export const dynamic = "force-dynamic"

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
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Block slots</h2>
          <BlockSlotsForm workshops={workshops} />
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
                    <td className="whitespace-nowrap px-4 py-3">{fmtLongDate(b.date)}</td>
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
