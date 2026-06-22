"use client"

// Top-of-page carousel. It only scrolls while hovered, and the speed depends
// on the cursor's horizontal position: a dead zone in the middle, ramping up
// toward either edge (quadratically) so it accelerates as you near an arrow.
// Cursor left of center scrolls back, right of center scrolls forward.
// Swap the placeholder boxes for <Image> tags when the photos are ready.

import { useEffect, useRef } from "react"

const slides = ["slide-1", "slide-2", "slide-3"]

const MAX_SPEED = 620 // px per second at the very edge
const DEAD_ZONE = 0.12 // fraction of half-width around center with no movement

export default function Carousel() {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const leftArrowRef = useRef<HTMLDivElement>(null)
  const rightArrowRef = useRef<HTMLDivElement>(null)

  const offsetRef = useRef(0) // current scroll offset in px
  const velocityRef = useRef(0) // target px/s, set from mouse position
  const halfRef = useRef(0) // width of one full set (track is duplicated)

  // Measure one repeat unit (distance from slide 0 to its duplicate) so the
  // loop wraps seamlessly regardless of margins/zoom.
  useEffect(() => {
    const measure = () => {
      const track = trackRef.current
      if (!track || track.children.length <= slides.length) return
      const first = track.children[0] as HTMLElement
      const dup = track.children[slides.length] as HTMLElement
      halfRef.current = dup.offsetLeft - first.offsetLeft
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  // Animation loop: advance the offset by the current velocity each frame.
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      const track = trackRef.current
      const half = halfRef.current
      if (track && half > 0) {
        let next = (offsetRef.current + velocityRef.current * dt) % half
        if (next < 0) next += half
        offsetRef.current = next
        track.style.transform = `translateX(${-next}px)`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const handleMove = (e: React.MouseEvent) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const centered = (e.clientX - rect.left) / rect.width - 0.5 // -0.5..0.5

    let ramp = 0
    if (Math.abs(centered) > DEAD_ZONE) {
      ramp = (Math.abs(centered) - DEAD_ZONE) / (0.5 - DEAD_ZONE) // 0..1
    }
    const sign = Math.sign(centered)
    velocityRef.current = sign * ramp * ramp * MAX_SPEED // quadratic accel

    // Reflect direction + intensity on the arrows.
    setArrow(leftArrowRef.current, sign < 0 ? ramp : 0)
    setArrow(rightArrowRef.current, sign > 0 ? ramp : 0)
  }

  const handleLeave = () => {
    velocityRef.current = 0
    setArrow(leftArrowRef.current, 0)
    setArrow(rightArrowRef.current, 0)
  }

  return (
    <div className="rounded-2xl bg-panel p-5 shadow-sm">
      <div
        ref={containerRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className="relative overflow-hidden rounded-xl"
      >
        <Arrow side="left" innerRef={leftArrowRef} />
        <Arrow side="right" innerRef={rightArrowRef} />

        <div ref={trackRef} className="flex w-max will-change-transform">
          {/* track duplicated so the offset can wrap seamlessly */}
          {[...slides, ...slides].map((_slide, i) => (
            <div
              key={i}
              className="mr-5 flex h-52 w-64 shrink-0 items-center justify-center rounded-lg bg-sand text-sm text-ink/40"
            >
              {/* image placeholder */}
              image
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Idle opacity/scale so the arrows are a faint hint until you approach them.
function setArrow(el: HTMLDivElement | null, intensity: number) {
  if (!el) return
  el.style.opacity = String(0.18 + 0.82 * intensity)
  el.style.transform = `translateY(-50%) scale(${1 + 0.35 * intensity})`
}

function Arrow({
  side,
  innerRef,
}: {
  side: "left" | "right"
  innerRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <div
      ref={innerRef}
      aria-hidden
      style={{ opacity: 0.18, transform: "translateY(-50%)" }}
      className={`pointer-events-none absolute top-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-cream/80 text-ink shadow ${
        side === "left" ? "left-3" : "right-3"
      }`}
    >
      <svg
        width={22}
        height={22}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {side === "left" ? (
          <path d="m15 18-6-6 6-6" />
        ) : (
          <path d="m9 18 6-6-6-6" />
        )}
      </svg>
    </div>
  )
}
