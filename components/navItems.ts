export type NavItem = { href: string; label: string; icon: string }

// grouped for the desktop sidebar (spacing between groups)
export const navGroups: NavItem[][] = [
  [
    { href: "/home", label: "home", icon: "navbar_home" },
    { href: "/gallery", label: "gallery", icon: "navbar_gallery" },
  ],
  [
    { href: "/workshops", label: "workshops", icon: "navbar_workshops" },
    { href: "/contact", label: "get in touch", icon: "navbar_touch" },
  ],
]

// flat list for the mobile bar
export const navItems: NavItem[] = navGroups.flat()
