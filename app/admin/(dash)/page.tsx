import { Suspense } from "react"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { PERIOD_LABELS, PERIOD_TIMES, parseDateOnly } from "@/lib/booking"
import { fmtDate, fmtDateTime, fmtDay, peso } from "@/lib/format"
import { gmailComposeUrl, scheduleEmail, type BookingEmailData } from "@/lib/email"
import BookingFilters from "@/components/admin/BookingFilters"
import BookingSearch from "@/components/admin/BookingSearch"
import BookingsTable, { type BookingRowData } from "@/components/admin/BookingsTable"
import Paginator from "@/components/admin/Paginator"
import { BookingStatus } from "@/app/generated/prisma/client"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 20

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string
    workshop?: string
    sort?: string
    page?: string
    from?: string
    to?: string
    q?: string
  }>
}) {
  const sp = await searchParams

  const statuses = (sp.status?.split(",") ?? []).filter((s): s is keyof typeof BookingStatus => s in BookingStatus)
  const workshopIds = sp.workshop?.split(",").filter(Boolean) ?? []
  const sort: "asc" | "desc" = sp.sort === "oldest" ? "asc" : "desc" // default: most recent
  const page = Math.max(1, Number(sp.page) || 1)
  const q = sp.q?.trim() ?? ""

  // Date filter runs on the workshop date, which is what the studio plans around.
  const from = sp.from ? parseDateOnly(sp.from) : null
  const to = sp.to ? parseDateOnly(sp.to) : null

  const where = {
    ...(statuses.length ? { status: { in: statuses.map((s) => BookingStatus[s]) } } : {}),
    ...(workshopIds.length ? { workshopId: { in: workshopIds } } : {}),
    ...(from || to
      ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
            { instagram: { contains: q, mode: "insensitive" as const } },
            { id: { contains: q } },
          ],
        }
      : {}),
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
    prisma.workshop.findMany({
      select: { id: true, name: true, capacity: true },
      orderBy: { sortOrder: "asc" },
    }),
  ])

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const filtered = statuses.length > 0 || workshopIds.length > 0 || Boolean(from || to) || Boolean(q)

  // Format on the server (PH time) so the client can't hydrate a different string.
  const rows: BookingRowData[] = bookings.map((b) => {
    const mail: BookingEmailData = {
      name: b.name,
      email: b.email,
      workshop: b.workshop.name,
      date: fmtDate(b.date),
      session: PERIOD_LABELS[b.period],
      time: PERIOD_TIMES[b.period],
      slots: b.partySize,
      bookingFee: b.bookingFee,
      remainingFee: b.remainingFee,
    }

    return {
      booking: {
        id: b.id,
        workshopId: b.workshopId,
        date: b.date.toISOString().slice(0, 10),
        period: b.period,
        partySize: b.partySize,
        name: b.name,
        email: b.email,
        phone: b.phone,
        instagram: b.instagram,
        notes: b.notes,
        bookingFee: b.bookingFee,
        remainingFee: b.remainingFee,
        status: b.status,
      },
      bookedOn: fmtDateTime(b.createdAt),
      workshopName: b.workshop.name,
      dateLabel: fmtDate(b.date),
      dayLabel: fmtDay(b.date),
      sessionLabel: PERIOD_LABELS[b.period],
      feeLabel: peso(b.bookingFee),
      remainingLabel: peso(b.remainingFee),
      // The confirmation email has a banner, so it goes through the preview page
      // (a Gmail compose URL can only carry plain text).
      confirmHref: `/admin/email/${b.id}`,
      scheduleHref: gmailComposeUrl(scheduleEmail(mail)),
    }
  })

  const pageHref = (p: number) => {
    const params = new URLSearchParams()
    for (const key of ["status", "workshop", "sort", "from", "to", "q"] as const) {
      if (sp[key]) params.set(key, sp[key] as string)
    }
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
            {filtered && " (filtered)"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Suspense fallback={null}>
            <BookingSearch />
          </Suspense>
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
        <p className="text-sm text-muted">No bookings match these filters.</p>
      ) : (
        <>
          <BookingsTable rows={rows} workshops={workshops} />

          <Paginator
            page={page}
            pageCount={pageCount}
            total={total}
            pageSize={PAGE_SIZE}
            href={pageHref}
          />
        </>
      )}
    </div>
  )
}
