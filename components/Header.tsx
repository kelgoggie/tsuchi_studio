import Image from "next/image"

export default function Header() {
  return (
    <header
      className="relative h-40 w-full overflow-hidden bg-cover bg-center sm:h-52 md:h-60"
      style={{ backgroundImage: "url('/images/header-img.JPG')" }}
    >
      {/* olive top strip + studio label */}
      <div className="absolute inset-x-0 top-0 flex h-7 items-center justify-end bg-sage/85 px-4 sm:h-8 sm:px-6">
        <p className="text-xs text-cream/90 sm:text-sm">earthen reverie | tsuchi studio 2026</p>
      </div>

      {/* wordmark */}
      <div className="flex h-full items-center gap-3 pl-5 sm:gap-5 sm:pl-10">
        <Image
          src="/assets/tsuchi-icon.png"
          alt="Tsuchi spiral"
          width={90}
          height={90}
          className="h-12 w-12 invert drop-shadow-[0_4px_3px_rgba(0,0,0,0.45)] sm:h-16 sm:w-16 md:h-[90px] md:w-[90px]"
        />
        <h1 className="font-script text-4xl text-white drop-shadow-[0_3px_2px_rgba(0,0,0,0.35)] sm:text-5xl md:text-7xl">
          tsuchi
        </h1>
      </div>
    </header>
  )
}
