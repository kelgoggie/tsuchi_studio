import Link from "next/link"
import Header from "@/components/Header"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import WorkshopGroup, { type WorkshopCardData } from "@/components/WorkshopGroup"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const CERAMIC_INCLUSIONS = [
  "3-hour session",
  "900g stoneware clay",
  "Underglaze painting",
  "Food-safe clear glaze & firing",
  "Use of studio tools",
]

const CERAMIC_ADDON = {
  price: 800,
  items: ["second session", "glazing (customer's choice of AMACO/Mayco glazes) & firing"],
}

type Card = Omit<WorkshopCardData, "capacity">

const POTTERY: Card[] = [
  {
    workshopId: "handbuilding",
    label: "Hand-building Workshop",
    titleScript: "hand-building workshop",
    image: "/images/carousel-3.JPG",
    price: 1200,
    description: "Create your own ceramic piece while learning the basics of pinching, coiling, and slab building.",
    inclusions: CERAMIC_INCLUSIONS,
    addon: CERAMIC_ADDON,
  },
  {
    workshopId: "wheel-throwing",
    label: "Introduction to Wheel-throwing",
    titleScript: "introduction to wheel-throwing",
    image: "/images/carousel-1.JPG",
    price: 1800,
    description: "Learn the fundamentals of wheel throwing and create your own pottery on the wheel.",
    inclusions: CERAMIC_INCLUSIONS,
    addon: CERAMIC_ADDON,
  },
]

const TUFTING: Card[] = [
  {
    workshopId: "rug-tufting",
    label: "Medium Rug Tufting",
    titleScript: "medium rug tufting",
    image: "/images/carousel-4.JPG",
    price: 1800,
    description: "Create your own custom rug from your chosen design.",
    inclusions: ["2.5-hour session", "Tufting gun & tools", "Unlimited yarn colors", "Backing kit", "Same-day take home"],
  },
  {
    workshopId: "rug-tufting",
    label: "Large Rug Tufting",
    titleScript: "large rug tufting",
    image: "/images/carousel-5.JPG",
    price: 2500,
    description: "Perfect for larger and more detailed designs.",
    inclusions: ["3-hour session", "Tufting gun & tools", "Unlimited yarn colors", "Backing kit", "Same-day take home"],
  },
]

export default async function WorkshopsPage() {
  const workshops = await prisma.workshop.findMany({ select: { id: true, capacity: true } })
  const capacityById = Object.fromEntries(workshops.map((w) => [w.id, w.capacity]))
  const withCap = (c: Card): WorkshopCardData => ({ ...c, capacity: capacityById[c.workshopId] ?? 2 })

  return (
    <div className="relative min-h-screen bg-paper">
      <Navbar />

      <Header compact />

      <div className="flex min-w-0 flex-col">
        <main className="flex-1 space-y-12 px-4 pb-12 pt-8 sm:px-6 md:space-y-16 md:px-12 md:pt-10 xl:px-20 2xl:px-32">
          <h1 className="text-center font-script text-4xl leading-tight md:text-5xl">❀ studio workshops ❀</h1>

          {/* Pottery — cards left, detail opens to the right */}
          <WorkshopGroup
            id="pottery"
            title="Pottery"
            subtitle="From hand-building to the wheel — shape, mold, and glaze your own ceramic pieces to take home."
            side="right"
            cards={POTTERY.map(withCap)}
          />

          {/* Rug Tufting — cards right, detail opens to the left */}
          <WorkshopGroup
            id="rug-tufting"
            title="Rug Tufting"
            subtitle="Punch and tuft your own textile rug in the colors and design of your choice."
            side="left"
            cards={TUFTING.map(withCap)}
          />

          {/* contact CTA */}
          <p className="mx-auto max-w-xl text-center text-sm leading-relaxed text-muted">
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
