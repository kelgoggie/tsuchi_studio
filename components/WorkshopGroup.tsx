"use client"

import Image from "next/image"
import { useState } from "react"
import BookingForm from "./BookingForm"

export type WorkshopCardData = {
  workshopId: string
  label: string
  titleScript: string
  image: string
  capacity: number
  price: number
  description: string
  inclusions: string[]
  addon?: { price: number; items: string[] }
}

export default function WorkshopGroup({
  id,
  title,
  subtitle,
  cards,
  side,
}: {
  id: string
  title: string
  subtitle: string
  cards: WorkshopCardData[]
  side: "right" | "left"
}) {
  const [openLabel, setOpenLabel] = useState<string | null>(null)
  const [booking, setBooking] = useState(false)
  const open = cards.find((c) => c.label === openLabel) ?? null

  function toggle(label: string) {
    setBooking(false)
    setOpenLabel((cur) => (cur === label ? null : label))
  }

  const thumbs = (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {cards.map((c) => {
        const active = c.label === openLabel
        return (
          <button
            key={c.label}
            onClick={() => toggle(c.label)}
            aria-expanded={active}
            className={`block self-start overflow-hidden rounded-2xl border bg-card p-3 text-left shadow-sm transition ${
              active ? "border-olive" : "border-divider"
            }`}
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
              <Image src={c.image} alt={c.label} fill sizes="(min-width:768px) 25vw, 50vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <h3 className="font-script text-3xl leading-tight text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]">
                  {c.titleScript}
                </h3>
                <p className="text-xs text-white/85">(max. {c.capacity} people per timeslot)</p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )

  const info = open ? (
    <div
      key={open.label}
      className={`relative space-y-4 self-start rounded-2xl border border-divider bg-card p-5 shadow-sm ${
        side === "right" ? "card-open-right" : "card-open-left"
      }`}
    >
      <button
        onClick={() => {
          setOpenLabel(null)
          setBooking(false)
        }}
        aria-label="Close"
        className="absolute right-3 top-3 text-muted transition hover:text-foreground"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      <p className="text-xl font-semibold text-olive">P{open.price.toLocaleString()}/person</p>
      <p className="text-sm italic leading-relaxed text-muted">{open.description}</p>

      <div className="text-sm">
        <p className="font-semibold">Inclusions:</p>
        <ul className="ml-5 list-disc text-muted">
          {open.inclusions.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
        {open.addon && (
          <div className="mt-3">
            <p className="font-semibold">+ P{open.addon.price.toLocaleString()} (Optional)</p>
            <ul className="ml-5 list-disc text-muted">
              {open.addon.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {booking ? (
        <BookingForm workshopId={open.workshopId} capacity={open.capacity} workshopLabel={open.label} />
      ) : (
        <button
          onClick={() => setBooking(true)}
          className="w-full rounded-full bg-olive px-6 py-3 text-cream transition hover:opacity-90"
        >
          book now
        </button>
      )}

      <p className="text-center text-xs italic text-muted">
        *a 50% deposit is required to secure all bookings
      </p>
    </div>
  ) : (
    <div className="md:pt-2">
      <h2 className="font-script text-3xl leading-tight md:text-4xl">{title}</h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">{subtitle}</p>
    </div>
  )

  return (
    <section
      id={id}
      className={`scroll-mt-24 grid grid-cols-1 items-start gap-6 md:gap-10 ${
        side === "right" ? "md:grid-cols-[2fr_1fr]" : "md:grid-cols-[1fr_2fr]"
      }`}
    >
      {thumbs}
      <div className={side === "left" ? "md:order-first" : undefined}>{info}</div>
    </section>
  )
}
