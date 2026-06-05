import type { Metadata } from "next";
import "./globals.css";
import { Beth_Ellen, Inter } from "next/font/google"

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
  icons: {
    icon: "/assets/tsuchi-icon.png",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${bethEllen.variable} ${inter.variable}`}>
        {children}
      </body>
    </html>
  )
}