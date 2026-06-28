"use client"

import Image from "next/image"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { GalleryImage } from "@/lib/gallery"

export default function GalleryGrid({
  images,
  title,
  subtitle,
}: {
  images: GalleryImage[]
  title: string
  subtitle?: string
}) {
  const [active, setActive] = useState<number | null>(null)
  const [order, setOrder] = useState<"newest" | "oldest">("newest")
  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  // `images` arrives newest-first from the server, so "oldest" is just reversed.
  const sorted = useMemo(
    () => (order === "newest" ? images : [...images].reverse()),
    [images, order]
  )

  const close = useCallback(() => setActive(null), [])
  const step = useCallback(
    (dir: number) =>
      setActive((i) => (i === null ? i : (i + dir + images.length) % images.length)),
    [images.length]
  )


  useEffect(() => {
    if (active === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
      if (e.key === "ArrowRight") step(1)
      if (e.key === "ArrowLeft") step(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [active, close, step])

  // close the sort menu when clicking outside it
  useEffect(() => {
    if (!sortOpen) return
    const onClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [sortOpen])

  return (
    <>
      {/* title row: heading centered, sort dropdown aligned to it on the right */}
      <div className="relative mb-8 text-center">
        <div className="relative flex items-center justify-center">
        <h1 className="font-script text-3xl leading-tight md:text-4xl">{title}</h1>

        <div ref={sortRef} className="absolute right-0">
          <button
            onClick={() => setSortOpen((o) => !o)}
            className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs text-muted transition hover:opacity-70"
            aria-haspopup="listbox"
            aria-expanded={sortOpen}
          >
            Sort by...
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {sortOpen && (
            <div className="absolute right-0 z-20 mt-1 min-w-[7.5rem] overflow-hidden rounded-xl bg-card py-1 shadow-lg">
              {(["oldest", "newest"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setOrder(opt)
                    setSortOpen(false)
                  }}
                  className={`block w-full px-4 py-1.5 text-left text-xs transition hover:bg-olive/10 ${
                    order === opt ? "font-medium text-olive" : "text-muted"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
        </div>

        {subtitle && (
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">{subtitle}</p>
        )}
      </div>

      {/* instagram-style feed: 3 per row on mobile -> 5 on desktop */}
      <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 sm:gap-2 lg:grid-cols-5">
        {sorted.map((img, i) => (
          <div
            key={img.src + i}
            className="float-in"
            style={{ animationDelay: `${Math.min(i * 60, 900)}ms` }}
          >
            <button
              onClick={() => setActive(i)}
              className="group relative aspect-square w-full overflow-hidden bg-card transition duration-300 hover:z-10 hover:scale-105 hover:-translate-y-1 hover:shadow-lg"
              aria-label={`Open image ${i + 1}`}
            >
              <Image
                src={img.src}
                alt=""
                fill
                sizes="(min-width:1024px) 20vw, (min-width:768px) 25vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {/* darken the bottom + reveal the post date on hover */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end bg-gradient-to-t from-black/70 via-black/25 to-transparent p-2 pt-8 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {img.date && (
                  <span className="text-[10px] font-medium text-white/90 sm:text-xs">{img.date}</span>
                )}
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* lightbox */}
      {active !== null && (
        <div
          onClick={close}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm"
        >
          <button
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-cream/15 p-2 text-cream transition hover:bg-cream/30"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); step(-1) }}
            aria-label="Previous"
            className="absolute left-2 rounded-full bg-cream/15 p-2 text-cream transition hover:bg-cream/30 sm:left-6"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); step(1) }}
            aria-label="Next"
            className="absolute right-2 rounded-full bg-cream/15 p-2 text-cream transition hover:bg-cream/30 sm:right-6"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative h-[80vh] w-full max-w-4xl"
          >
            <Image
              src={sorted[active].src}
              alt=""
              fill
              sizes="100vw"
              className="object-contain"
              preload
            />
          </div>
        </div>
      )}
    </>
  )
}
