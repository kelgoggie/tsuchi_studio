"use client"

import { useState } from "react"
import Link from "next/link"

// Shared icon wrapper so every nav glyph lines up at the same size/stroke.
function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {children}
    </svg>
  )
}

type NavItem = { label: string; href: string; icon: React.ReactNode }

const groups: NavItem[][] = [
  [
    {
      label: "home",
      href: "/home",
      icon: (
        <Icon>
          <path d="M3 9.5 12 3l9 6.5" />
          <path d="M5 10v10h14V10" />
        </Icon>
      ),
    },
    {
      label: "about us",
      href: "#",
      icon: (
        <Icon>
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l8.8 8.7 8.8-8.7a5.5 5.5 0 0 0 0-7.8z" />
        </Icon>
      ),
    },
    {
      label: "creations",
      href: "#",
      icon: (
        <Icon>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </Icon>
      ),
    },
  ],
  [
    {
      label: "workshops",
      href: "#",
      icon: (
        <Icon>
          <path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.7 1.5-1.5 0-.4-.2-.8-.2-1.2 0-.7.5-1.2 1.2-1.2H17a4 4 0 0 0 4-4c0-5-4-8-9-8z" />
          <circle cx="7.5" cy="10.5" r="1" />
          <circle cx="12" cy="7.5" r="1" />
          <circle cx="16" cy="10.5" r="1" />
        </Icon>
      ),
    },
    {
      label: "get in touch",
      href: "#",
      icon: (
        <Icon>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </Icon>
      ),
    },
  ],
]

// Account/auth items depend on whether someone is signed in.
const accountItem: NavItem = {
  label: "my account",
  href: "#",
  icon: (
    <Icon>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </Icon>
  ),
}

const logOutItem: NavItem = {
  label: "log out",
  href: "#",
  icon: (
    <Icon>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </Icon>
  ),
}

const logInItem: NavItem = {
  label: "log in",
  href: "#",
  icon: (
    <Icon>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="m10 17 5-5-5-5" />
      <path d="M15 12H3" />
    </Icon>
  ),
}

export default function Sidebar({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [collapsed, setCollapsed] = useState(false)

  // Logged in: my account + log out. Logged out: just log in.
  const accountGroup: NavItem[] = isLoggedIn
    ? [accountItem, logOutItem]
    : [logInItem]
  const navGroups = [...groups, accountGroup]

  return (
    <aside
      className={`${
        collapsed ? "w-16 px-3" : "w-56 px-6"
      } shrink-0 bg-cream/80 py-7 backdrop-blur-sm transition-all duration-300`}
    >
      {/* menu toggle */}
      <button
        aria-label={collapsed ? "Expand menu" : "Collapse menu"}
        aria-expanded={!collapsed}
        onClick={() => setCollapsed((c) => !c)}
        className={`mb-10 flex text-ink/80 transition-colors hover:text-olive ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <Icon>
          <path d="M3 6h18M3 12h18M3 18h18" />
        </Icon>
      </button>

      <nav className="flex flex-col gap-8">
        {navGroups.map((group, i) => (
          <ul key={i} className="flex flex-col gap-4">
            {group.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 text-ink/85 transition-colors hover:text-olive ${
                    collapsed ? "justify-center" : ""
                  }`}
                >
                  {item.icon}
                  {!collapsed && (
                    <span className="whitespace-nowrap text-sm">
                      {item.label}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        ))}
      </nav>
    </aside>
  )
}
