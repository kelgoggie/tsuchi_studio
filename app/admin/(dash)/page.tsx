import { Suspense } from "react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { PERIOD_LABELS } from "@/lib/booking"
import { setBookingStatus } from "@/app/admin/actions"
import BookingFilters from "@/components/admin/BookingFilters"
import { BookingStatus } from "@/app/generated/prisma/client"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 20

// Match the Google Sheet's single combined status column.
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

const peso = (n: number | null) => (n == null ? "—" : `₱${n.toLocaleString()}`)

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
}
function fmtDay(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" })
}
function fmtDateTime(d: Date) {
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function StatusButton({ id, status, label }: { id: string; status: string; label: string }) {
  return (
    <form action={setBookingStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button className="whitespace-nowrap rounded-full border border-divider px-2.5 py-1 text-xs text-muted transition hover:bg-paper">
        {label}
      </button>
    </form>
  )
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; workshop?: string; sort?: string; page?: string }>
}) {
  const sp = await searchParams

  const statuses = (sp.status?.split(",") ?? []).filter((s): s is keyof typeof BookingStatus => s in BookingStatus)
  const workshopIds = sp.workshop?.split(",").filter(Boolean) ?? []
  const sort: "asc" | "desc" = sp.sort === "oldest" ? "asc" : "desc" // default: most recent
  const page = Math.max(1, Number(sp.page) || 1)

  const where = {
    ...(statuses.length ? { status: { in: statuses.map((s) => BookingStatus[s]) } } : {}),
    ...(workshopIds.length ? { workshopId: { in: workshopIds } } : {}),
  }

  const [bookings, total, workshops] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: { workshop: true },
      orderBy: { createdAt: sort },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.booking.count({ where }),
    prisma.workshop.findMany({ select: { id: true, name: true }, orderBy: { sortOrder: "asc" } }),
  ])

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const pageHref = (p: number) => {
    const params = new URLSearchParams()
    if (sp.status) params.set("status", sp.status)
    if (sp.workshop) params.set("workshop", sp.workshop)
    if (sp.sort) params.set("sort", sp.sort)
    params.set("page", String(p))
    return `/admin?${params.toString()}`
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
          <p className="mt-0.5 text-sm text-muted">
            {total} {total === 1 ? "booking" : "bookings"}
            {(statuses.length > 0 || workshopIds.length > 0) && " (filtered)"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Suspense fallback={null}>
            <BookingFilters workshops={workshops} />
          </Suspense>
          <Link
            href="/admin/new"
            className="rounded-full bg-olive px-5 py-2 text-sm text-cream transition hover:opacity-90"
          >
            + Add booking
          </Link>
        </div>
      </div>

      {bookings.length === 0 ? (
        <p className="text-sm text-muted">No bookings match</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-divider bg-card">
            <table className="w-full min-w-[1500px] text-left text-sm">
              <thead className="border-b border-divider text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Booked On</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Booking ID</th>
                  <th className="px-4 py-3">Workshop</th>
                  <th className="px-4 py-3">Workshop Date</th>
                  <th className="px-4 py-3">Day</th>
                  <th className="px-4 py-3">Session</th>
                  <th className="px-4 py-3">Slots</th>
                  <th className="px-4 py-3">Contact No.</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Instagram</th>
                  <th className="px-4 py-3">Booking Fee</th>
                  <th className="px-4 py-3">Remaining Fee</th>
                  <th className="px-4 py-3">Booking Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b border-divider/60 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{fmtDateTime(b.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{b.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">{b.id}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {b.workshop.name}
                      {b.notes && <div className="mt-0.5 text-xs text-muted">{b.notes}</div>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{fmtDate(b.date)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{fmtDay(b.date)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{PERIOD_LABELS[b.period]}</td>
                    <td className="px-4 py-3">{b.partySize}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{b.phone ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{b.email}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      {b.instagram ? `@${b.instagram.replace(/^@/, "")}` : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{peso(b.bookingFee)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{peso(b.remainingFee)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[b.status]}`}
                      >
                        {STATUS_LABEL[b.status]}
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

          {pageCount > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              {page > 1 ? (
                <Link href={pageHref(page - 1)} className="rounded-full border border-divider px-4 py-1.5 transition hover:bg-card">
                  ← Previous
                </Link>
              ) : (
                <span className="rounded-full border border-divider px-4 py-1.5 opacity-40">← Previous</span>
              )}

              <span className="text-muted">
                Page {page} of {pageCount}
              </span>

              {page < pageCount ? (
                <Link href={pageHref(page + 1)} className="rounded-full border border-divider px-4 py-1.5 transition hover:bg-card">
                  Next →
                </Link>
              ) : (
                <span className="rounded-full border border-divider px-4 py-1.5 opacity-40">Next →</span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
