"use client"

import { useState } from "react"
import EditBookingModal, { type EditableBooking } from "./EditBookingModal"

export default function EditBookingButton({
  booking,
  workshops,
}: {
  booking: EditableBooking
  workshops: { id: string; name: string; capacity: number }[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Edit booking"
        className="rounded-full border border-divider px-2.5 py-1 text-xs text-muted transition hover:border-olive hover:text-olive"
      >
        Edit
      </button>

      {open && (
        <EditBookingModal booking={booking} workshops={workshops} onClose={() => setOpen(false)} />
      )}
    </>
  )
}
