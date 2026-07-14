import Link from "next/link"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PERIOD_LABELS, PERIOD_TIMES } from "@/lib/booking"
import { fmtDate } from "@/lib/format"
import {
  CONFIRMATION_SUBJECT,
  confirmationEmail,
  confirmationParagraphs,
  gmailComposeUrl,
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
  banner: { position: "relative", lineHeight: 0 } as const,
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
}

export default async function AdminEmailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

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
    name: booking.name,
    email: booking.email,
    workshop: booking.workshop.name,
    date: fmtDate(booking.date),
    session: PERIOD_LABELS[booking.period],
    time: PERIOD_TIMES[booking.period],
    slots: booking.partySize,
    bookingFee: booking.bookingFee,
    remainingFee: booking.remainingFee,
  }

  const paragraphs = confirmationParagraphs(data)
  const gmail = gmailComposeUrl(confirmationEmail(data))

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin" className="text-sm text-olive transition hover:opacity-70">
        ← back to bookings
      </Link>

      <div className="mb-6 mt-6">
        <h1 className="text-2xl font-semibold tracking-tight">Confirmation email</h1>
        <p className="mt-1 text-sm text-muted">
          To <span className="font-medium text-foreground">{booking.email}</span> · Subject:{" "}
          <span className="font-medium text-foreground">{CONFIRMATION_SUBJECT}</span>
        </p>
      </div>

      <div className="mb-4 rounded-xl border border-divider bg-card p-4 text-sm text-muted">
        <p className="mb-3">
          <span className="font-medium text-foreground">Copy email</span> puts the styled version (with the banner) on
          your clipboard — paste it into a new Gmail message. <span className="font-medium text-foreground">Open in
          Gmail</span> prefills a draft instantly, but plain-text only: no banner.
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
            <div style={S.banner}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${origin}/images/header-img.JPG`} alt="Tsuchi Studio" style={S.bannerImg} />
            </div>

            <h1 style={S.title}>Welcome to Tsuchi Studio!</h1>

            <div style={S.body}>
              {paragraphs.map((text, i) => (
                <p key={i} style={S.p}>
                  {text}
                </p>
              ))}
            </div>

            <div style={S.footer}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${origin}/assets/tsuchi_word.svg`} alt="Tsuchi Studio" style={S.wordmark} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
