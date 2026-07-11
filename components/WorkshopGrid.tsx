"use client"

import { useState } from "react"
import WorkshopCard from "./WorkshopCard"
import type { WorkshopOffering } from "@/lib/workshops"

export default function WorkshopGrid({
  items,
}: {
  items: { workshop: WorkshopOffering; capacity: number }[]
}) {
  // Only one card's details are open at a time — opening one closes the rest.
  const [openSlug, setOpenSlug] = useState<string | null>(null)

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(({ workshop, capacity }) => (
        <WorkshopCard
          key={workshop.slug}
          workshop={workshop}
          capacity={capacity}
          open={openSlug === workshop.slug}
          onOpen={() => setOpenSlug(workshop.slug)}
          onClose={() => setOpenSlug(null)}
        />
      ))}
    </div>
  )
}
