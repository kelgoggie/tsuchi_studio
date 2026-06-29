import Link from "next/link"
import Header from "@/components/Header"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import WorkshopCard from "@/components/WorkshopCard"
import { WORKSHOPS } from "@/lib/workshops"
import { capacityFor, getCapacities } from "@/lib/booking"

export const dynamic = "force-dynamic"

export default async function WorkshopsPage() {
  const caps = await getCapacities()

  return (
    <div className="relative min-h-screen bg-paper">
      <Navbar />

      <Header compact />

      <div className="flex min-w-0 flex-col">
        <main className="flex-1 px-4 pb-12 pt-8 sm:px-6 md:px-12 md:pt-10 xl:px-20 2xl:px-32">
          <h1 className="mb-2 text-center font-script text-4xl leading-tight md:text-5xl">❀ studio workshops ❀</h1>
          <p className="mx-auto mb-10 max-w-md text-center text-sm leading-relaxed text-muted">
            Pick a class to see the details and book a session. Open Tuesday–Sunday, mornings to evenings.
          </p>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {WORKSHOPS.map((w) => (
              <WorkshopCard key={w.slug} workshop={w} capacity={capacityFor(caps, w.workshopId)} />
            ))}
          </div>

          {/* contact CTA */}
          <p className="mx-auto mt-12 max-w-xl text-center text-sm leading-relaxed text-muted">
            Interested in booking a commission, a corporate workshop or a private event?{" "}
            <Link
              href="/contact"
              className="font-medium text-olive underline underline-offset-2 transition hover:opacity-70"
            >
              Contact us
            </Link>{" "}
            for more details.
          </p>
        </main>

        <Footer />
      </div>
    </div>
  )
}
