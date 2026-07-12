const STROKE = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
}

const EMAIL = "ma.threshiageonigo@gmail.com"

const LINKS = [
  {
    label: "Instagram",
    tooltip: "tsuchi.studio on Instagram",
    href: "https://instagram.com/tsuchi.studio",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" {...STROKE}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    tooltip: "Tsuchi Studio on Facebook",
    href: "https://facebook.com/profile.php?id=61591392980721",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" {...STROKE}>
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    label: "Email",
    tooltip: EMAIL,
    // opens a Gmail compose tab with the studio address prefilled
    href: `https://mail.google.com/mail/?view=cm&fs=1&to=${EMAIL}`,
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" {...STROKE}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    ),
  },
  {
    label: "Phone",
    tooltip: "+63 939 263 3855",
    href: "tel:+639392633855",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" {...STROKE}>
        <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
      </svg>
    ),
  },
]

export default function ContactSection() {
  return (
    <section id="contact" className="scroll-mt-24 border-t border-divider px-4 py-16 text-center sm:px-6 md:px-12">
      <h2 className="font-script text-4xl leading-tight md:text-5xl">get in touch</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
        Got any questions or inquiries? We&apos;d love to hear from you.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-5 pb-10 sm:gap-6">
        {LINKS.map((l) => (
          <a
            key={l.label}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={l.label}
            className="group relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-olive text-olive transition hover:bg-olive hover:text-cream"
          >
            {l.icon}
            <span className="pointer-events-none absolute left-1/2 top-full mt-3 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-3 py-1 text-xs text-cream opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              {l.tooltip}
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}
