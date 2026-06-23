import Image from "next/image"

export default function Header() {
  return (
    <header
      className="relative h-60 w-full overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url('/images/header-img.jpg')" }}
    >
      {/* olive top strip + studio label */}
      <div className="absolute inset-x-0 top-0 flex h-8 items-center justify-end bg-sage/85 px-6">
        <p className="text-sm text-cream/90">earthen reverie | tsuchi studio 2026</p>
      </div>

      {/* wordmark */}
      <div className="flex h-full items-center gap-5 pl-10">
        <Image
          src="/assets/tsuchi-icon.png"
          alt="Tsuchi spiral"
          width={90}
          height={90}
          className="invert drop-shadow-[0_4px_3px_rgba(0,0,0,0.45)]"
        />
        <h1 className="font-script text-7xl text-white drop-shadow-[0_3px_2px_rgba(0,0,0,0.35)]">
          tsuchi
        </h1>
      </div>
    </header>
  )
}
