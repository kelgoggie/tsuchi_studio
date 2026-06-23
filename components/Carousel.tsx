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

const VISIBLE = 3

// group the images into pages of 3 (wrapping the last page) -> dots = pages
const pages = Array.from({ length: Math.ceil(images.length / VISIBLE) }, (_, p) =>
  Array.from({ length: VISIBLE }, (_, k) => images[(p * VISIBLE + k) % images.length])
)

export default function Carousel() {
  const [page, setPage] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setPage((prev) => (prev + 1) % pages.length)
    }, 4500)

    return () => clearInterval(timer)
  }, [])

  return (
    <div>
      {/* slides */}
      <div className="relative h-72">
        {pages.map((group, i) => (
          <div
            key={i}
            className={`absolute inset-0 flex gap-4 transition-all duration-700 ease-out ${
              i === page
                ? "translate-x-0 opacity-100"
                : "pointer-events-none translate-x-8 opacity-0"
            }`}
          >
            {group.map((src, k) => (
              <div key={k} className="relative h-full flex-1 overflow-hidden rounded-xl">
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
