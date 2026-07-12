import Link from "next/link"
import { prisma } from "@/lib/prisma"
import NewBookingForm from "@/components/admin/NewBookingForm"

export const dynamic = "force-dynamic"

export default async function AdminNewBookingPage() {
  const workshops = await prisma.workshop.findMany({
    where: { active: true },
    select: { id: true, name: true, capacity: true },
    orderBy: { sortOrder: "asc" },
  })

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin" className="text-sm text-olive transition hover:opacity-70">
        ← back to bookings
      </Link>

      <div className="mb-8 mt-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Add a booking</h1>
      </div>

      <NewBookingForm workshops={workshops} />
    </div>
  )
}
