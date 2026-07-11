import Header from "@/components/Header"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import ContactSection from "@/components/ContactSection"
import GalleryGrid from "@/components/GalleryGrid"
import { getGalleryImages } from "@/lib/gallery"

// Re-check Cloudinary for newly uploaded photos at most once an hour. Each
// render makes ~1 + N EXIF calls, so a long window keeps us well under
// Cloudinary's 500 admin-ops/hour limit. New uploads appear within the hour.
export const revalidate = 3600

export default async function GalleryPage() {
  const images = await getGalleryImages()

  return (
    <div className="relative min-h-screen bg-paper">
      <Navbar />

      <Header compact />

      <div className="flex min-w-0 flex-col">

        <main className="flex-1 px-4 pb-8 pt-3 sm:px-6 md:px-12 md:pb-10 md:pt-5 xl:px-20 2xl:px-32 mb-10">
          <GalleryGrid
            images={images}
            title="⌒☆ our gallery ☆⌒"
            subtitle="All of our favorite pieces and memories, past and present."
          />
  
          
        </main>

        <ContactSection />

        <Footer />
      </div>
    </div>
  )
}
