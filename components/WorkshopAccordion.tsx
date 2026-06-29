"use client"

import Image from "next/image"
import { useState } from "react"
import BookingForm from "./BookingForm"

type Props = {
  id: string
  name: string
  image: string
  description?: string | null
  capacity: number
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export default function WorkshopAccordion({ id, name, image, description, capacity }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="overflow-hidden rounded-2xl border border-divider bg-card shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-4 p-3 text-left transition hover:bg-paper/40"
      >
        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-36">
          <Image src={image} alt={name} fill sizes="160px" className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-script text-2xl leading-tight md:text-3xl">{name}</h3>
          <p className="text-xs text-muted">Up to {capacity} per session · ~3 hrs</p>
        </div>
        <Chevron open={open} />
      </button>

      {open && (
        <div className="border-t border-divider px-4 pb-5 pt-4">
          {description && <p className="mb-4 text-sm leading-relaxed text-muted">{description}</p>}
          <BookingForm workshopId={id} capacity={capacity} />
        </div>
      )}
    </div>
  )
}
