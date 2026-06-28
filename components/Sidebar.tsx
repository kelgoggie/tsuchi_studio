"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { navGroups } from "./navItems"

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <aside
      className={`fixed left-0 top-0 z-40 hidden h-screen overflow-hidden border-r border-divider bg-cream/60 backdrop-blur-md transition-all duration-300 md:block ${
        isOpen ? "w-48" : "w-16"
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
        className="flex px-6 py-4 hover:opacity-70 transition-opacity"
      >
        <Image src="/assets/navbar_hamburger.svg" alt="menu" width={22} height={22} className="shrink-0" />
      </button>

      <nav className="flex min-h-[calc(100vh-4rem)] flex-col gap-7 px-6 pb-10 pt-10">
        {navGroups.map((group, i) => (
          <div key={i} className={`flex flex-col gap-3.5 ${i === navGroups.length - 1 ? "mt-auto" : ""}`}>
            {group.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 text-[13px] transition-opacity hover:opacity-70"
              >
                <Image src={`/assets/${item.icon}.svg`} alt="" width={18} height={18} className="shrink-0" />
                {isOpen && <span className="whitespace-nowrap">{item.label}</span>}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
