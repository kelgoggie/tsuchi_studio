import Image from "next/image"
import ExploreButton from "./ExploreButton"

export default function Header({ compact = false }: { compact?: boolean }) {
  return (
    <header
      className={`relative w-full overflow-hidden bg-cover bg-fixed bg-bottom sm:bg-center ${
        compact ? "h-40 sm:h-48 md:h-52" : "h-svh"
      }`}
      style={{ backgroundImage: "url('/images/header-img.JPG')" }}
    >

      {/* corner label */}
      <span className="absolute bottom-3 right-4 text-xs text-white/90 drop-shadow-[0_2px_2px_rgba(0,0,0,0.35)] sm:bottom-4 sm:right-6 sm:text-sm">
        earthen reverie | 2026
      </span>

      {/* wordmark */}
      <div className="flex h-full flex-col items-center justify-center gap-12 px-5 mb-10">
        <div className="flex items-center justify-center gap-4 sm:gap-6">
          <Image
            src="/assets/tsuchi-icon.png"
            alt="Tsuchi spiral"
            width={180}
            height={180}
            className={`invert drop-shadow-[0_4px_3px_rgba(0,0,0,0.45)] ${
              compact
                ? "h-12 w-12 sm:h-14 sm:w-14 md:h-[68px] md:w-[68px]"
                : "h-20 w-20 sm:h-28 sm:w-28 md:h-36 md:w-36"
            }`}
          />
          <h1
            className={`font-script text-white drop-shadow-[0_3px_2px_rgba(0,0,0,0.35)] ${
              compact
                ? "text-5xl sm:text-6xl md:text-7xl"
                : "text-7xl sm:text-8xl md:text-9xl"
            }`}
          >
            tsuchi
          </h1>
        </div>

        {!compact && <ExploreButton />}
      </div>
    </header>
  )
}
