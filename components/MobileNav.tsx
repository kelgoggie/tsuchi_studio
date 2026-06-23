import Link from "next/link"
import { navItems } from "./navItems"

export default function MobileNav() {
  return (
    <nav className="flex items-center gap-6 overflow-x-auto border-b border-divider bg-cream px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="shrink-0 whitespace-nowrap text-[15px] transition-opacity hover:opacity-70"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
