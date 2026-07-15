import Image from "next/image"
import Link from "next/link"
import Header from "@/components/Header"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import ContactSection from "@/components/ContactSection"
import BookingForm from "@/components/BookingForm"
import { getWorkshop, WORKSHOPS } from "@/lib/workshops"
import { capacityFor, getCapacities } from "@/lib/booking"
import { PAYMENT_NOTICE } from "@/lib/constants"

export const dynamic = "force-dynamic"

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ w?: string }>
}) {
  const { w } = await searchParams
  const workshop = w ? getWorkshop(w) : undefined
  const caps = await getCapacities()

  return (
    <div className="relative min-h-screen bg-paper">
      <Navbar />
      <Header compact />

      <div className="flex min-w-0 flex-col">
        <main className="flex-1 px-4 pb-12 pt-8 sm:px-6 md:px-12 md:pt-10 xl:px-20 2xl:px-32">
          <div>
            <Link href="/workshops" className="text-sm text-olive transition hover:opacity-70">
              back to  workshops
            </Link>

            {!workshop ? (
              <div className="mt-6">
                <h1 className="mb-4 font-script text-3xl md:text-4xl">choose a workshop</h1>
                <ul className="space-y-2">
                  {WORKSHOPS.map((wk) => (
                    <li key={wk.slug}>
                      <Link href={`/book?w=${wk.slug}`} className="text-olive underline underline-offset-2 hover:opacity-70">
                        {wk.label} — ₱{wk.price.toLocaleString()}/person
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mt-6 grid gap-8 md:grid-cols-2">
                {/* details */}
                <div>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                    <Image src={workshop.image} alt={workshop.label} fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover" />
                  </div>
                  <h1 className="mt-4 font-script text-3xl leading-tight md:text-4xl">{workshop.titleScript}</h1>
                  {capacityFor(caps, workshop.workshopId) < 1000 && (
                    <p className="mt-1 text-xs text-muted">
                      max. {capacityFor(caps, workshop.workshopId)} people per timeslot
                    </p>
                  )}
                  {workshop.priceNote ? (
                    <p className="mt-2 text-lg font-semibold text-olive">{workshop.priceNote}</p>
                  ) : workshop.priceOptions ? (
                    <div className="mt-2 text-lg font-semibold text-olive">
                      {workshop.priceOptions.map((o) => (
                        <p key={o.label}>
                          {o.label} starts at ₱{o.price.toLocaleString()}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xl font-semibold text-olive">₱{workshop.price.toLocaleString()}/person</p>
                  )}
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">{PAYMENT_NOTICE}</p>
                  <p className="mt-2 text-sm italic leading-relaxed text-muted">{workshop.description}</p>

                  <div className="mt-4 text-sm">
                    <p className="font-semibold">Inclusions:</p>
                    <ul className="ml-5 list-disc text-muted">
                      {workshop.inclusions.map((i) => (
                        <li key={i}>{i}</li>
                      ))}
                    </ul>
                    {workshop.addon && (
                      <div className="mt-3">
                        <p className="font-semibold">+ ₱{workshop.addon.price.toLocaleString()} (Optional)</p>
                        <ul className="ml-5 list-disc text-muted">
                          {workshop.addon.items.map((i) => (
                            <li key={i}>{i}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {workshop.bookingNotes && (
                    <div className="mt-5 space-y-2 border-t border-divider pt-4 text-xs leading-relaxed text-muted">
                      {workshop.bookingNotes.map((n, i) => (
                        <p key={i}>{n}</p>
                      ))}
                    </div>
                  )}
                </div>

                {/* form */}
                <div className="flex flex-col rounded-2xl border border-divider bg-card p-5 shadow-sm">
                  <h2 className="mb-4 font-script text-2xl">book this session</h2>
                  <BookingForm
                    workshopId={workshop.workshopId}
                    capacity={capacityFor(caps, workshop.workshopId)}
                    workshopLabel={workshop.label}
                    price={workshop.price}
                    addon={workshop.addon ? { price: workshop.addon.price, label: workshop.addon.label } : undefined}
                  />
                </div>
              </div>
            )}
          </div>
        </main>

        <ContactSection />

        <Footer />
      </div>
    </div>
  )
}
