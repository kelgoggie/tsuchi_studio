import Image from "next/image"
import Link from "next/link"
import Header from "@/components/Header"
import Sidebar from "@/components/Sidebar"
import MobileNav from "@/components/MobileNav"
import Carousel from "@/components/Carousel"
import Footer from "@/components/Footer"

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."

function WorkshopCard({ img, label }: { img: string; label: string }) {
  return (
    <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
      <Image src={img} alt={label} fill className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
      <div className="absolute bottom-4 left-4 flex flex-col items-start gap-2">
        <span className="font-script text-2xl text-white sm:text-3xl">{label}</span>
        <span className="rounded-full bg-olive/85 px-4 py-1.5 text-sm text-cream">
          view available dates
        </span>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-paper">
      <Sidebar />

      <Header />

      <div className="flex min-w-0 flex-col md:pl-16">
        <MobileNav />

        <main className="flex-1 space-y-10 px-4 py-8 sm:px-6 md:space-y-12 md:px-12 md:py-10 xl:px-20 2xl:px-32">
          {/* gallery */}
          <section>
            <h2 className="mb-1 font-script text-3xl leading-tight md:text-4xl">gallery</h2>
            <div className="relative py-5 sm:py-7">
              <Carousel />
              <Link
                href="/gallery"
                className="absolute bottom-5 right-9 z-10 text-xs font-medium text-olive transition hover:opacity-70 sm:bottom-7 sm:right-12"
              >
                view all photos...
              </Link>
            </div>
          </section>

          {/* about us */}
          <section className="text-center">
            <h2 className="mb-3 font-script text-3xl leading-tight md:text-4xl">about us</h2>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted">
              Tsuchi is an independent multidisciplinary arts studio based in Iloilo City. Composed of a small team of artists and creatives, our focus is on revering the natural bumps and flaws in manmade crafts, as well as cultivating a safe space for art and exploration for both beginners and novices alike.
            </p>
          </section>

          {/* studio workshops */}
          <section className="grid grid-cols-1 items-center gap-6 md:grid-cols-[2fr_1fr] md:gap-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
              <WorkshopCard img="/images/carousel-1.JPG" label="Pottery" />
              <WorkshopCard img="/images/carousel-4.JPG" label="Rug-tufting" />
            </div>
            <div className="order-first flex flex-col items-start gap-5 md:order-none md:gap-6 md:pl-6">
              <h2 className="font-script text-3xl leading-none md:text-4xl">studio workshops</h2>
              <span className="rounded-full bg-olive px-8 py-2.5 text-sm text-cream">coming soon</span>
            </div>
          </section>

          {/* heading */}
          <section>
            <h2 className="mb-3 font-script text-3xl leading-tight md:text-4xl">crafted with love</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted">
              Tsuchi studio's creations are hand-built with love, and are always in search for their forever home.
            </p>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  )
}
