import Link from "next/link"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PERIOD_LABELS, PERIOD_TIMES } from "@/lib/booking"
import { fmtDate } from "@/lib/format"
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/lib/constants"
import {
  CONFIRMATION_SUBJECT,
  confirmationEmail,
  confirmationParagraphs,
  gmailComposeUrl,
  requestPaymentEmail,
  requestPaymentParagraphs,
  requestPaymentSubject,
  type BookingEmailData,
} from "@/lib/email"
import CopyEmailButton from "@/components/admin/CopyEmailButton"

export const dynamic = "force-dynamic"

// Email clients strip <style> blocks and class names, so the email body is
// styled entirely inline — what you see here is exactly what gets pasted.
const S = {
  wrap: {
    margin: "0 auto",
    maxWidth: "600px",
    backgroundColor: "#fbf1e6",
    fontFamily: "Georgia, 'Times New Roman', serif",
    color: "#1b1a17",
  } as const,
  bannerImg: { display: "block", width: "100%", height: "auto" } as const,
  title: {
    margin: 0,
    padding: "22px 32px 6px",
    fontSize: "26px",
    fontWeight: "normal",
    color: "#6f7440",
    textAlign: "center",
  } as const,
  p: { margin: "0 0 16px", fontSize: "15px", lineHeight: 1.7, color: "#3a382f" } as const,
  body: { padding: "10px 32px 8px" } as const,
  footer: { padding: "8px 32px 32px", textAlign: "center" } as const,
  wordmark: { width: "150px", height: "auto", margin: "0 auto" } as const,
  qrRow: { padding: "4px 32px 12px", textAlign: "center" } as const,
  qrCell: { display: "inline-block", padding: "0 12px", verticalAlign: "top" } as const,
  qrLabel: {
    display: "block",
    margin: "0 0 8px",
    padding: "8px 22px",
    backgroundColor: "#6f7440",
    color: "#f3ebde",
    borderRadius: "999px",
    fontSize: "14px",
  } as const,
  qrImg: {
    display: "block",
    width: "180px",
    height: "180px",
    objectFit: "contain",
    borderRadius: "12px",
  } as const,
}

export default async function AdminEmailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ type?: string }>
}) {
  const { id } = await params
  const { type } = await searchParams
  const isRequest = type === "request"

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { workshop: { select: { name: true } } },
  })
  if (!booking) notFound()

  // Absolute URLs — an email client can't resolve "/images/…".
  const h = await headers()
  const host = h.get("host") ?? "localhost:3000"
  const proto = host.startsWith("localhost") ? "http" : "https"
  const origin = `${proto}://${host}`

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

  const paragraphs = isRequest ? requestPaymentParagraphs(data) : confirmationParagraphs(data)
  const subject = isRequest ? requestPaymentSubject(data) : CONFIRMATION_SUBJECT
  const gmail = gmailComposeUrl(isRequest ? requestPaymentEmail(data) : confirmationEmail(data))
  const heading = isRequest ? "Tsuchi Studio" : "Welcome to Tsuchi Studio!"

  const wantsInstagram = booking.invoiceVia === "INSTAGRAM"

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin" className="text-sm text-olive transition hover:opacity-70">
        ← back to bookings
      </Link>

      <div className="mb-4 mt-6 flex flex-wrap items-center gap-2">
        <Link
          href={`/admin/email/${id}?type=request`}
          className={`rounded-full px-4 py-1.5 text-sm transition ${
            isRequest ? "bg-olive text-cream" : "border border-divider text-muted hover:border-olive"
          }`}
        >
          Request payment
        </Link>
        <Link
          href={`/admin/email/${id}`}
          className={`rounded-full px-4 py-1.5 text-sm transition ${
            !isRequest ? "bg-olive text-cream" : "border border-divider text-muted hover:border-olive"
          }`}
        >
          Confirmation
        </Link>
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
          (@{(booking.instagram ?? "").replace(/^@/, "")}), not email — copy the text below and DM it to them.
        </p>
      )}

      <div className="mb-4 rounded-xl border border-divider bg-card p-4 text-sm text-muted">
        <p className="mb-3">
          <span className="font-medium text-foreground">Copy email</span> puts the styled version (banner and QR
          codes) on your clipboard — paste it into a new Gmail message.{" "}
          <span className="font-medium text-foreground">Open in Gmail</span> prefills a draft instantly, but
          plain-text only: no banner, no QR codes.
        </p>
        <div className="flex flex-wrap gap-2">
          <CopyEmailButton targetId="email-body" />
          <a
            href={gmail}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-divider px-5 py-2 text-sm text-muted transition hover:border-olive hover:text-olive"
          >
            Open in Gmail (plain text)
          </a>
        </div>
      </div>

      {/* the email itself */}
      <div className="overflow-hidden rounded-xl border border-divider">
        <div id="email-body">
          <div style={S.wrap}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${origin}/images/header-img.JPG`} alt="Tsuchi Studio" style={S.bannerImg} />

            <h1 style={S.title}>{heading}</h1>

            <div style={S.body}>
              {paragraphs.map((text, i) => (
                <p key={i} style={S.p}>
                  {text}
                </p>
              ))}
            </div>

            {isRequest && (
              <div style={S.qrRow}>
                {[
                  { label: "GCash", src: `${origin}/assets/Gcash.svg` },
                  { label: "Bank", src: `${origin}/assets/BPI.svg` },
                ].map((q) => (
                  <div key={q.label} style={S.qrCell}>
                    <span style={S.qrLabel}>{q.label}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={q.src} alt={`${q.label} QR code`} style={S.qrImg} />
                  </div>
                ))}
              </div>
            )}

            <div style={S.footer}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${origin}/assets/tsuchi_word.svg`} alt="Tsuchi Studio" style={S.wordmark} />
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted">
        Instagram in this email points to @{INSTAGRAM_HANDLE}.
      </p>
    </div>
  )
}
