"use client"

import { usePathname } from "next/navigation"

// Keying on the pathname remounts the subtree on each navigation, so the
// CSS fade replays on every page (and on full reloads).
export default function PageFade({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div key={pathname} className="page-fade">
      {children}
    </div>
  )
}
