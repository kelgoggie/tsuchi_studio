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

// group the images into pages of `visible` (wrapping the last page) -> dots = pages
function paginate(visible: number) {
  return Array.from({ length: Math.ceil(images.length / visible) }, (_, p) =>
    Array.from({ length: visible }, (_, k) => images[(p * visible + k) % images.length])
  )
}

export default function Carousel() {
  const [visible, setVisible] = useState(3)
  const [page, setPage] = useState(0)

  // 1 image per slide on mobile, 3 on >= md
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    const update = () => setVisible(mq.matches ? 3 : 1)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  const pages = paginate(visible)

  // auto-advance, and keep `page` in range when the layout (page count) changes
  useEffect(() => {
    setPage((prev) => prev % pages.length)
    const timer = setInterval(() => {
      setPage((prev) => (prev + 1) % pages.length)
    }, 4500)

    return () => clearInterval(timer)
  }, [pages.length])

  return (
    <div>
      {/* slides */}
      <div className="relative">
        {pages.map((group, i) => (
          <div
            key={i}
            className={`flex gap-4 transition-all duration-700 ease-out ${
              i === page
                ? "relative translate-x-0 opacity-100"
                : "pointer-events-none absolute inset-0 translate-x-8 opacity-0"
            }`}
          >
            {group.map((src, k) => (
              <div key={k} className="relative aspect-[4/3] flex-1 overflow-hidden rounded-xl">
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
