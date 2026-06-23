import Image from "next/image"
import Header from "@/components/Header"
import Sidebar from "@/components/Sidebar"
import Carousel from "@/components/Carousel"
import Footer from "@/components/Footer"

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."

function WorkshopCard({ img, label }: { img: string; label: string }) {
  return (
    <div className="relative h-48 overflow-hidden rounded-2xl shadow-sm sm:h-64">
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
    <div className="flex min-h-screen bg-cream">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="flex-1 space-y-10 px-4 py-8 sm:px-6 md:space-y-16 md:px-10 md:py-12">
          {/* carousel */}
          <section className="rounded-2xl bg-card p-3 shadow-sm sm:p-6">
            <Carousel />
          </section>

          {/* about us */}
          <section className="grid grid-cols-1 items-start gap-6 md:grid-cols-[1fr_2fr] md:gap-8">
            <div>
              <h2 className="mb-4 font-script text-4xl leading-tight md:text-5xl">about us</h2>
              <p className="max-w-xs leading-relaxed text-muted">Tsuchi is an independent multidisciplinary arts studio based in Iloilo City. Composed of a small team of artists and creatives, ...</p>
            </div>
            <figure className="relative overflow-hidden rounded-2xl bg-card shadow-sm">
              <div className="relative h-56 w-full sm:h-72 md:h-80">
                <Image
                  src="/images/display-img.JPG"
                  alt="booth"
                  fill
                  className="object-cover"
                />
              </div>
              <figcaption className="absolute bottom-2 right-3 text-xs text-white/90">
                Concrete Jungle: The Long Play, May 2026
              </figcaption>
            </figure>
          </section>

          {/* studio workshops */}
          <section className="grid grid-cols-1 items-center gap-6 md:grid-cols-[2fr_1fr] md:gap-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
              <WorkshopCard img="/images/carousel-1.JPG" label="Pottery" />
              <WorkshopCard img="/images/carousel-4.JPG" label="Rug-tufting" />
            </div>
            <div className="flex flex-col items-start gap-5 md:gap-6 md:pl-6">
              <h2 className="font-script text-4xl leading-none md:text-5xl">studio workshops</h2>
              <span className="rounded-full bg-olive px-10 py-3 text-cream">coming soon</span>
            </div>
          </section>

          {/* heading */}
          <section>
            <h2 className="mb-4 font-script text-4xl leading-tight md:text-5xl">crafted with love</h2>
            <p className="max-w-2xl leading-relaxed text-muted">
              Tsuchi studios creations are hand-built, molded, and glazed with love...
            </p>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  )
}
