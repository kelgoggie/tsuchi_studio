import Image from "next/image"

export default function ComingSoon() {
  return (
    <main
      className="relative min-h-screen bg-cover bg-center flex flex-col items-center justify-center gap-4"
      style={{ backgroundImage: "url('/images/background_wip.png')" }}
    >

      <div className="flex flex-row items-center justify-center gap-10">
        <Image
          src="/assets/tsuchi-icon.png"
          alt="Tsuchi spiral"
          width={100}
          height={100}
          className = "invert"
        />
        <h1 className="font-[family-name:var(--font-beth-ellen)] text-7xl"> tsuchi</h1>
      </div>
      <span className="font-[family-name:var(--font-inter)] text-center leading-none">tsuchi-studio.com is under construction - <p> see you soon!</p></span>
    
    <a href="https://www.instagram.com/tsuchi.studio" target="_blank" rel="noopener noreferrer" className = "absolute bottom-26 flex flex-row items-center gap-2">
        <Image 
        src="/assets/instagram_icon.svg"
        alt="instagram logo"
        width={30}
        height={30}
        />
        <h1 className="font-[family-name:var(--font-inter)] text-center leading-none text-lg">tsuchi.studio</h1>
    </a>
    
    </main>
  )
}