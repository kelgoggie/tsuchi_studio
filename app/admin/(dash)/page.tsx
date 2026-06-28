import { prisma } from "@/lib/prisma"
import { PERIOD_LABELS } from "@/lib/booking"
import { setBookingStatus } from "@/app/admin/actions"

export const dynamic = "force-dynamic"

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-200 text-gray-500",
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

function StatusButton({ id, status, label }: { id: string; status: string; label: string }) {
  return (
    <form action={setBookingStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className="rounded-full border border-divider px-2.5 py-1 text-xs text-muted transition hover:bg-card">
        {label}
      </button>
    </form>
  )
}

export default async function AdminBookingsPage() {
  const bookings = await prisma.booking.findMany({
    include: { workshop: true },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  })

  return (
    <div>
      <h1 className="mb-1 font-script text-3xl">bookings</h1>
      <p className="mb-6 text-sm text-muted">{bookings.length} total</p>

      {bookings.length === 0 ? (
        <p className="text-sm text-muted">No bookings yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-divider bg-card">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-divider text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Session</th>
                <th className="px-4 py-3">Workshop</th>
                <th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Party</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-divider/60 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3">{fmtDate(b.date)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{PERIOD_LABELS[b.period]}</td>
                  <td className="px-4 py-3">{b.workshop.name}</td>
                  <td className="px-4 py-3">{b.name}</td>
                  <td className="px-4 py-3 text-xs text-muted">
                    <div>{b.email}</div>
                    {b.phone && <div>{b.phone}</div>}
                    {b.instagram && <div>@{b.instagram.replace(/^@/, "")}</div>}
                  </td>
                  <td className="px-4 py-3">{b.partySize}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[b.status]}`}>
                      {b.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {b.status !== "CONFIRMED" && <StatusButton id={b.id} status="CONFIRMED" label="Confirm" />}
                      {b.status !== "CANCELLED" && <StatusButton id={b.id} status="CANCELLED" label="Cancel" />}
                      {b.status !== "PENDING" && <StatusButton id={b.id} status="PENDING" label="Pending" />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
