"use client"

import Image from "next/image"
import { useState, useEffect } from "react"

const images = [
  "/images/carousel-1.JPG",
  "/images/carousel-2.JPG",
  "/images/carousel-3.JPG",
  "/images/carousel-4.JPG",
  "/images/carousel-5.JPG",
  "/images/carousel-6.JPG",
]


function paginate(visible: number) {
  return Array.from({ length: Math.ceil(images.length / visible) }, (_, p) =>
    Array.from({ length: visible }, (_, k) => images[(p * visible + k) % images.length])
  )
}

export default function Carousel() {
  const [visible, setVisible] = useState(3)
  const [page, setPage] = useState(0)

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    const update = () => setVisible(mq.matches ? 3 : 1)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  const pages = paginate(visible)
  const go = (dir: number) => setPage((p) => (p + dir + pages.length) % pages.length)

  // auto-advance, and keep `page` in range when the layout (page count) changes
  useEffect(() => {
    setPage((prev) => prev % pages.length)
    const timer = setInterval(() => {
      setPage((prev) => (prev + 1) % pages.length)
    }, 4500)

    return () => clearInterval(timer)
  }, [pages.length])

  return (
    <div className="relative px-9 sm:px-12">
      {/* arrows — sit in the side gutters, outside the images */}
      <button
        onClick={() => go(-1)}
        aria-label="Previous"
        className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-cream/80 p-2 text-ink shadow-sm transition hover:bg-cream"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <button
        onClick={() => go(1)}
        aria-label="Next"
        className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-cream/80 p-2 text-ink shadow-sm transition hover:bg-cream"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>

      {/* slides */}
      <div className="relative">
        {pages.map((group, i) => (
          <div
            key={i}
            style={{ gridTemplateColumns: `repeat(${visible}, minmax(0, 1fr))` }}
            className={`grid gap-4 transition-all duration-700 ease-out ${
              i === page
                ? "relative translate-x-0 opacity-100"
                : "pointer-events-none absolute inset-0 translate-x-8 opacity-0"
            }`}
          >
            {group.map((src, k) => (
              <div key={k} className="relative aspect-[4/3] overflow-hidden rounded-xl">
                <Image src={src} alt="carousel image" fill className="object-cover" />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* mini slider / dots */}
      <div className="mt-4 flex justify-center gap-2">
        {pages.map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === page ? "w-6 bg-olive" : "w-2 bg-olive/40 hover:bg-olive/60"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
