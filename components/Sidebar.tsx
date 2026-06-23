"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { navGroups } from "./navItems"

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <aside
      className={`hidden min-h-screen shrink-0 overflow-hidden border-r border-divider bg-cream transition-all duration-300 md:block ${
        isOpen ? "w-60" : "w-20"
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
        className="flex px-7 py-5 hover:opacity-70 transition-opacity"
      >
        <Image src="/assets/navbar_hamburger.svg" alt="menu" width={26} height={26} className="shrink-0" />
      </button>

      <nav className="flex min-h-[calc(100vh-4.75rem)] flex-col gap-9 px-7 pb-10">
        {navGroups.map((group, i) => (
          <div key={i} className={`flex flex-col gap-4 ${i === navGroups.length - 1 ? "mt-auto" : ""}`}>
            {group.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 text-[15px] transition-opacity hover:opacity-70"
              >
                <Image src={`/assets/${item.icon}.svg`} alt="" width={22} height={22} className="shrink-0" />
                {isOpen && <span className="whitespace-nowrap">{item.label}</span>}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
