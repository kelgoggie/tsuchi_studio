import { prisma } from "@/lib/prisma"
import ClosureCalendar from "@/components/admin/ClosureCalendar"
import BlockSlotsForm from "@/components/admin/BlockSlotsForm"
import EditSlotsForm from "@/components/admin/EditSlotsForm"

export const dynamic = "force-dynamic"

export default async function AdminCalendarPage() {
  const [closures, openings, workshops] = await Promise.all([
    prisma.closure.findMany({ where: { period: null }, orderBy: { date: "asc" }, select: { date: true } }),
    prisma.opening.findMany({ orderBy: { date: "asc" }, select: { date: true } }),
    prisma.workshop.findMany({
      where: { active: true },
      select: { id: true, name: true, capacity: true },
      orderBy: { sortOrder: "asc" },
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

        <div className="space-y-8">
          {/* hold back individual slots — blocks are unblocked from Studio schedules */}
          <section className="rounded-2xl border border-divider bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold tracking-tight">Block slots</h2>
            <BlockSlotsForm workshops={workshops} />
          </section>

          {/* how many people each workshop can seat per session */}
          <section className="rounded-2xl border border-divider bg-card p-6">
            <h2 className="text-lg font-semibold tracking-tight">Edit slots</h2>
            <p className="mb-4 mt-1 text-sm text-muted">
              How many people each workshop can take in a single session.
            </p>
            <EditSlotsForm workshops={workshops} />
          </section>
        </div>
      </div>
    </div>
  )
}
