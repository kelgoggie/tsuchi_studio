"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import type { WorkshopOffering } from "@/lib/workshops"

export default function WorkshopCard({
  workshop,
  capacity,
}: {
  workshop: WorkshopOffering
  capacity: number
}) {
  const [open, setOpen] = useState(false)
  const { slug, label, titleScript, image, price, inclusions, addon } = workshop

  return (
    <div className="self-start rounded-2xl border border-divider bg-card p-3 shadow-sm">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-card">
        {/* front — photo */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            open ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <Image
            src={image}
            alt={label}
            fill
            sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
            <div>
              <h3 className="font-script text-2xl leading-tight text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]">
                {titleScript}
              </h3>
              <p className="text-xs text-white/85">(max. {capacity} per timeslot)</p>
            </div>
            <button
              onClick={() => setOpen(true)}
              className="shrink-0 rounded-full bg-olive px-3 py-1 text-xs font-medium text-cream transition hover:opacity-90"
            >
              view more
            </button>
          </div>
        </div>

        {/* back — details over the solid card color */}
        <div
          className={`absolute inset-0 flex flex-col gap-2 overflow-y-auto p-4 transition-opacity duration-300 ${
            open ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="absolute right-3 top-3 text-muted transition hover:text-foreground"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          <h3 className="pr-6 font-script text-2xl leading-tight">{titleScript}</h3>
          <p className="text-sm font-semibold text-olive">₱{price.toLocaleString()}/person</p>
          <ul className="ml-4 list-disc text-xs leading-relaxed text-muted">
            {inclusions.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
          {addon && (
            <p className="text-xs leading-relaxed text-muted">
              + ₱{addon.price.toLocaleString()} optional: {addon.label}
            </p>
          )}
          <Link
            href={`/book?w=${slug}`}
            className="mt-auto rounded-full bg-olive px-5 py-2 text-center text-sm text-cream transition hover:opacity-90"
          >
            book now
          </Link>
        </div>
      </div>
    </div>
  )
}
