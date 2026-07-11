import type { Metadata } from "next";
import "./globals.css";
import { Beth_Ellen, Inter } from "next/font/google"
import PageFade from "@/components/PageFade"

const bethEllen = Beth_Ellen({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-beth-ellen"
})

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
})

export const metadata: Metadata = {
  title: "Tsuchi Studio Iloilo",
  description: "Coming Soon",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${bethEllen.variable} ${inter.variable}`}>
        <PageFade>{children}</PageFade>
      </body>
    </html>
  )
}