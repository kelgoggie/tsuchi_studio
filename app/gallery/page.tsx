import Header from "@/components/Header"
import Sidebar from "@/components/Sidebar"
import MobileNav from "@/components/MobileNav"
import Footer from "@/components/Footer"
import GalleryGrid from "@/components/GalleryGrid"
import { getGalleryImages } from "@/lib/gallery"

// Re-check Cloudinary for newly uploaded photos at most once a minute.
export const revalidate = 60

export default async function GalleryPage() {
  const images = await getGalleryImages()

  return (
    <div className="relative min-h-screen bg-paper">
      <Sidebar />

      <Header compact />

      <div className="flex min-w-0 flex-col md:pl-16">
        <MobileNav />

        <main className="flex-1 px-4 pb-8 pt-3 sm:px-6 md:px-12 md:pb-10 md:pt-5 xl:px-20 2xl:px-32">
          <GalleryGrid
            images={images}
            title="⌒☆ our gallery ☆⌒"
            subtitle="All of our favorite pieces, past and present. Interested in owning your own Tsuchi? Shop here."
          />
          
        </main>

        <Footer />
      </div>
    </div>
  )
}
