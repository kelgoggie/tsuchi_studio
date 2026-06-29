import Image from "next/image"
import Link from "next/link"
import Header from "@/components/Header"
import Navbar from "@/components/Navbar"
import Carousel from "@/components/Carousel"
import Footer from "@/components/Footer"

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."

function WorkshopCard({ img, label, href }: { img: string; label: string; href: string }) {
  return (
    <Link
      href={href}
      className="group relative block aspect-[4/3] overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
    >
      <Image src={img} alt={label} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
      <div className="absolute bottom-4 left-4">
        <span className="font-script text-2xl text-white sm:text-3xl">{label}</span>
      </div>
    </Link>
  )
}

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-paper">
      <Navbar />

      <Header />

      <div className="flex min-w-0 flex-col">
        <main className="flex-1 space-y-10 px-4 py-8 sm:px-6 md:space-y-12 md:px-12 md:py-10 xl:px-20 2xl:px-32">
          {/* gallery */}
          <section className="-mb-6 md:-mb-8">
            <h2 className="mb-1 font-script text-3xl leading-tight md:text-5xl text-center">welcome to our home! ꩜</h2>
            <div className="relative pt-5 pb-3 sm:pt-7 sm:pb-4">
              <Carousel />
              <Link
                href="/gallery"
                className="absolute bottom-3 right-3 z-10 text-xs font-medium text-olive transition hover:opacity-70 sm:bottom-4 sm:right-6"
              >
                view all photos...
              </Link>
            </div>
          </section>

          {/* about us */}
          <section>
            <h2 className="mt-10 mb-5 font-script text-3xl leading-tight md:text-5xl">about us</h2>
            <p className="max-w-xl text-sm leading-relaxed text-muted">
              Tsuchi is an independent multidisciplinary arts studio <b>based in Iloilo City</b>. Composed of a small team of artists and creatives, our focus is on revering the natural bumps and flaws in manmade crafts, as well as cultivating a safe space for art and exploration for both <b>beginners</b> and <b>novices</b> alike.
            </p>
          </section>

          {/* studio workshops */}
          <section className="grid grid-cols-1 items-center gap-6 md:grid-cols-[2fr_1fr] md:gap-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
              <WorkshopCard img="/images/carousel-1.JPG" label="Pottery" href="/workshops" />
              <WorkshopCard img="/images/carousel-4.JPG" label="Rug-tufting" href="/workshops" />
            </div>
            <div className="order-first flex flex-col items-start gap-5 md:order-none md:gap-6 md:pl-6">
              <h2 className="font-script text-3xl leading-none md:text-4xl">studio workshops</h2>
              <p className="mx-auto max-w-xl text-justify text-sm leading-relaxed text-muted">From <b>handbuilding to wheel-throwing</b>, Tsuchi has something good for everyone out there.</p>
              <Link href="/workshops" className="rounded-full bg-olive px-8 py-2.5 text-sm text-cream transition hover:opacity-90">
                view workshops
              </Link>
            </div>
          </section>

          {/* heading */}
          <section>
            <h2 className="mb-6 font-script text-3xl leading-tight md:text-4xl">crafted with love, perfect for gifts</h2>
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
