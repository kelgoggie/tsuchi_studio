import Header from "@/components/Header"
import Sidebar from "@/components/Sidebar"
import Carousel from "@/components/Carousel"
import Footer from "@/components/Footer"

// Two workshop teasers. Each card lifts on hover (the "float" effect).
const workshops = [
  { title: "Pottery", href: "#" },
  { title: "Rug-tufting", href: "#" },
]

export default function Home() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-cream text-ink">
      {/* Header sits outside the flex so it never moves when the nav collapses */}
      <Header />

      <div className="flex">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-16 px-8 py-6 md:px-12">
            {/* hover-to-scroll carousel */}
            <Carousel />

            {/* about us */}
            <section className="flex flex-col gap-6 md:flex-row">
              <div className="md:w-1/3">
                <h2 className="font-script text-4xl leading-tight">about us</h2>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink/80">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                  eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
              </div>
              {/* image placeholder */}
              <div className="flex min-h-44 flex-1 items-center justify-center rounded-2xl bg-panel text-sm text-ink/40 shadow-sm">
                image
              </div>
            </section>

            {/* studio workshops */}
            <section className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="flex flex-1 flex-col gap-5 rounded-2xl bg-panel p-5 shadow-sm sm:flex-row">
                {workshops.map((w) => (
                  <a
                    key={w.title}
                    href={w.href}
                    className="group relative flex h-48 flex-1 items-end overflow-hidden rounded-xl bg-sand shadow transition-transform duration-300 hover:-translate-y-2 hover:shadow-xl"
                  >
                    {/* image placeholder behind the label */}
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-ink/30">
                      image
                    </span>
                    <div className="relative flex w-full flex-col items-start gap-2 p-4">
                      <span className="font-script text-3xl text-cream drop-shadow">
                        {w.title}
                      </span>
                      <span className="rounded-full bg-olive/90 px-4 py-1.5 text-sm text-cream">
                        view available dates
                      </span>
                    </div>
                  </a>
                ))}
              </div>

              <div className="flex flex-col items-start gap-4 md:w-1/3 md:items-center">
                <h2 className="font-script text-4xl leading-tight md:text-center">
                  studio workshops
                </h2>
                <span className="rounded-full bg-olive px-10 py-3 text-cream">
                  coming soon
                </span>
              </div>
            </section>

            {/* heading */}
            <section>
              <h2 className="font-script text-4xl">heading</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/80">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem
                ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
