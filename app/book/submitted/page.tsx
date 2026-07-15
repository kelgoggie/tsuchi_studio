import Link from "next/link"
import Header from "@/components/Header"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import ContactSection from "@/components/ContactSection"
import { PAYMENT_NOTICE } from "@/lib/constants"

export const metadata = { title: "Reservation submitted · Tsuchi Studio" }

export default function BookingSubmittedPage() {
  return (
    <div className="relative min-h-screen bg-paper">
      <Navbar />
      <Header compact />

      <div className="flex min-w-0 flex-col">
        <main className="flex-1 px-4 pb-12 pt-8 sm:px-6 md:px-12 md:pt-10 xl:px-20 2xl:px-32">
          <div className="mx-auto max-w-2xl py-10 text-center md:py-16">
            <h1 className="font-script text-4xl leading-tight md:text-5xl">Reservation Submitted!</h1>

            <div className="mt-8 space-y-4 text-justify text-sm leading-relaxed text-muted">
              <p>Thank you for booking a workshop with us.</p>
              <p>
                Your reservation request has been received and is currently under review. Once your request has been
                approved, we will send you the payment instructions and QR code for the full class fee via your email address. 
                Once you receive your QR codes, kindly settle your fees within 24 hours. Please note that we operate on a first-to-pay basis, so be sure to secure your slots as soon as possible!
              </p>
              <p>{PAYMENT_NOTICE}</p>
              <p>Thank you for your patience. We look forward to seeing you at the studio!</p>
            </div>

            <Link
              href="/workshops"
              className="mt-10 inline-block rounded-full bg-olive px-10 py-2.5 text-sm text-cream transition hover:opacity-90"
            >
              done
            </Link>
          </div>
        </main>

        <ContactSection />

        <Footer />
      </div>
    </div>
  )
}
