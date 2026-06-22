import Image from "next/image"

export default function Header(){
    return(
        <header className = "w-full h-40 overflow-hidden bg-cover bg-center flex flex-col items-center justify-center gap-4"
        style={{ backgroundImage: "url('/images/header-img.jpg')"}}>

            <div className ="flex flex-row items-center justify-center gap-6">
                <Image
                src ="/assets/tsuchi-icon.png"
                alt="Tsuchi spiral"
                width={64}
                height={64}
                className="invert drop-shadow-[0_4px_1px_rgba(0,0,0,0.5)]"
                />
                <h1 className="font-[family-name:var(--font-beth-ellen)] text-6xl text-white text-shadow-md text-shadow-black/35">tsuchi</h1>
            </div>
        </header>
    )
}