import Image from "next/image"
import Link from "next/link"
import { navItems } from "./navItems"

export default function MobileNav() {
  return (
    <nav className="flex items-center gap-5 overflow-x-auto border-b border-divider bg-cream px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-label={item.label}
          className="shrink-0 p-1.5 transition-opacity hover:opacity-70"
        >
          <Image src={`/assets/${item.icon}.svg`} alt={item.label} width={24} height={24} className="shrink-0" />
        </Link>
      ))}
    </nav>
  )
}
