import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PERIOD_LABELS, PERIOD_TIMES } from "@/lib/booking"
import { fmtDate } from "@/lib/format"
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/constants"
import type { BookingEmailData } from "@/lib/email"
import {
  EMAIL_KINDS,
  EMAIL_TAB_LABEL,
  emailMeta,
  renderEmailHtml,
  type EmailKind,
} from "@/lib/email-html"
import EmailComposeButton from "@/components/admin/EmailComposeButton"

export const dynamic = "force-dynamic"

export default async function AdminEmailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ type?: string }>
}) {
  const { id } = await params
  const { type } = await searchParams
  const emailType: EmailKind = (EMAIL_KINDS as readonly string[]).includes(type ?? "")
    ? (type as EmailKind)
    : "confirmation"

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { workshop: { select: { name: true } } },
  })
  if (!booking) notFound()

  const data: BookingEmailData = {
    id: booking.id,
    name: booking.name,
    email: booking.email,
    workshop: booking.workshop.name,
    date: fmtDate(booking.date),
    session: PERIOD_LABELS[booking.period],
    time: PERIOD_TIMES[booking.period],
    slots: booking.partySize,
    bookingFee: booking.bookingFee,
  }

  const { subject } = emailMeta(emailType, data)
  const html = renderEmailHtml(emailType, data)
  const wantsInstagram = booking.invoiceVia === "INSTAGRAM"

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin" className="text-sm text-olive transition hover:opacity-70">
        ← back to bookings
      </Link>

      <div className="mb-4 mt-6 flex flex-wrap items-center gap-2">
        {EMAIL_KINDS.map((t) => (
          <Link
            key={t}
            href={t === "confirmation" ? `/admin/email/${id}` : `/admin/email/${id}?type=${t}`}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              emailType === t ? "bg-olive text-cream" : "border border-divider text-muted hover:border-olive"
            }`}
          >
            {EMAIL_TAB_LABEL[t]}
          </Link>
        ))}
      </div>

      <div className="mb-4">
        <p className="text-sm text-muted">
          To{" "}
          <span className="font-medium text-foreground">
            {booking.email ?? `@${(booking.instagram ?? "").replace(/^@/, "")} (Instagram)`}
          </span>{" "}
          · Subject: <span className="font-medium text-foreground">{subject}</span>
        </p>
      </div>

      {wantsInstagram && (
        <p className="mb-4 rounded-xl border border-divider bg-card px-4 py-3 text-sm text-muted">
          This guest asked for their invoice over{" "}
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-olive underline underline-offset-2"
          >
            Instagram
          </a>{" "}
          (@{(booking.instagram ?? "").replace(/^@/, "")}), not email — copy this and DM it to them.
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-divider bg-card p-4">
        <EmailComposeButton
          kind={emailType}
          data={data}
          label="Copy & open Gmail"
          className="rounded-full bg-olive px-5 py-2 text-sm text-cream transition hover:opacity-90"
        />
        <p className="text-sm text-muted">
          Copies this email and opens Gmail with the recipient and subject filled — just press{" "}
          <kbd className="rounded border border-divider bg-paper px-1.5 py-0.5 text-xs">Ctrl</kbd>+
          <kbd className="rounded border border-divider bg-paper px-1.5 py-0.5 text-xs">V</kbd> to paste.
        </p>
      </div>

      {/* the email itself — rendered from the exact HTML that gets copied */}
      <div
        className="overflow-hidden rounded-xl border border-divider"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <p className="mt-3 text-xs text-muted">Instagram in this email points to @{INSTAGRAM_HANDLE}.</p>
    </div>
  )
}
