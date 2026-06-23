export type NavItem = { href: string; label: string; icon: string }

// grouped for the desktop sidebar (spacing between groups)
export const navGroups: NavItem[][] = [
  [
    { href: "/home", label: "home", icon: "navbar_home" },
    { href: "/about", label: "about us", icon: "navbar_heart" },
    { href: "/gallery", label: "creations", icon: "navbar_gallery" },
  ],
  [
    { href: "/workshops", label: "workshops", icon: "navbar_workshops" },
    { href: "/contact", label: "get in touch", icon: "navbar_touch" },
  ],
  [
    { href: "/account", label: "my account", icon: "navbar_account" },
    { href: "/logout", label: "log out", icon: "navbar_logout" },
  ],
]

// flat list for the mobile bar
export const navItems: NavItem[] = navGroups.flat()
