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
  /** which way the detail panel flies out on desktop */
  side?: "right" | "left"
}

export default function WorkshopCard({
  workshopId,
  label,
  titleScript,
  image,
  capacity,
  price,
  description,
  inclusions,
  addon,
  side = "right",
}: WorkshopCardData) {
  const [open, setOpen] = useState(false)
  const [booking, setBooking] = useState(false)

  const close = () => {
    setOpen(false)
    setBooking(false)
  }

  return (
    <div className="relative self-start rounded-2xl border border-divider bg-card p-3 shadow-sm">
      {/* image header — tap to open/close */}
      <button
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        className="block w-full text-left"
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
          <Image
            src={image}
            alt={label}
            fill
            sizes="(min-width:768px) 25vw, 50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="font-script text-3xl leading-tight text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]">
              {titleScript}
            </h3>
            <p className="text-xs text-white/85">(max. {capacity} people per timeslot)</p>
          </div>
        </div>
      </button>

      {/* detail panel — in-flow on mobile, flies out to the side on desktop */}
      {open && (
        <div
          className={`relative space-y-4 px-1 pt-4 md:absolute md:top-0 md:z-30 md:mt-0 md:w-[18rem] md:rounded-2xl md:border md:border-divider md:bg-card md:p-5 md:shadow-xl lg:w-[22rem] ${
            side === "right"
              ? "card-open-right md:left-full md:ml-4"
              : "card-open-left md:right-full md:mr-4"
          }`}
        >
          <button
            onClick={close}
            aria-label="Close"
            className="absolute right-2 top-2 z-10 text-muted transition hover:text-foreground md:right-3 md:top-3"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          <p className="text-xl font-semibold text-olive">P{price.toLocaleString()}/person</p>
          <p className="text-sm italic leading-relaxed text-muted">{description}</p>

          <div className="text-sm">
            <p className="font-semibold">Inclusions:</p>
            <ul className="ml-5 list-disc text-muted">
              {inclusions.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>

            {addon && (
              <div className="mt-3">
                <p className="font-semibold">+ P{addon.price.toLocaleString()} (Optional)</p>
                <ul className="ml-5 list-disc text-muted">
                  {addon.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {booking ? (
            <BookingForm workshopId={workshopId} capacity={capacity} workshopLabel={label} />
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
      )}
    </div>
  )
}
