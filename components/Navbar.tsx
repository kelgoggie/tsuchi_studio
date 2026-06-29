"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { navItems } from "./navItems"

export default function Navbar() {
  const [solid, setSolid] = useState(false)
  const pathname = usePathname()

  // Transparent while the header sits behind the bar; solid once scrolled past it.
  useEffect(() => {
    const onScroll = () => {
      const header = document.querySelector("header")
      if (!header) {
        setSolid(window.scrollY > 8)
        return
      }
      setSolid(header.getBoundingClientRect().bottom <= 64)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [pathname])

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid ? "border-b border-divider bg-cream/95 backdrop-blur" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">

        <div className="flex items-center gap-x-4 overflow-x-auto whitespace-nowrap text-sm [scrollbar-width:none] sm:gap-x-6 [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 transition hover:opacity-70 ${
                solid ? "text-foreground" : "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
