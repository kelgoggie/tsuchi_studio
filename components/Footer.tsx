import Image from "next/image"

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width={18}
      height={18}
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

export default function Footer() {
  return (
    <footer className="bg-ink px-8 py-7 text-cream/90 md:px-12">
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        {/* brand */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/tsuchi-icon.png"
              alt="Tsuchi spiral"
              width={44}
              height={44}
              className="invert"
            />
            <span className="font-script text-4xl">tsuchi</span>
          </div>
          <p className="text-sm text-cream/70">Multidisciplinary art studio 2026</p>
        </div>

        {/* contact */}
        <ul className="flex flex-col gap-3 text-sm">
          <li className="flex items-center gap-3">
            <Icon>
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </Icon>
            tsuchi.studio
          </li>
          <li className="flex items-center gap-3">
            <Icon>
              <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
            </Icon>
            +63 9XX XXXX XXXX
          </li>
          <li className="flex items-center gap-3">
            <Icon>
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </Icon>
            tsuchi-email@gmail.com
          </li>
        </ul>
      </div>
    </footer>
  )
}
