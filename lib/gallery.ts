import { v2 as cloudinary } from "cloudinary"

export type GalleryImage = { src: string; date?: string }

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// EXIF dates look like "2026:06:19 15:55:06" — not parseable by `new Date()`.
function parseExifDate(s?: string): Date | null {
  if (!s) return null
  const m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(s)
  if (!m) return null
  const [, y, mo, d, h, mi, se] = m
  return new Date(+y, +mo - 1, +d, +h, +mi, +se)
}

// Safety net if Cloudinary is ever unreachable. No dates — those only come
// from real uploads.
const FALLBACK_IMAGES: GalleryImage[] = [
  { src: "/images/carousel-1.JPG" },
  { src: "/images/carousel-2.JPG" },
  { src: "/images/carousel-3.JPG" },
  { src: "/images/carousel-4.JPG" },
  { src: "/images/carousel-5.JPG" },
  { src: "/images/carousel-6.JPG" },
  { src: "/images/display-img.JPG" },
]

/**
 * Returns the gallery images, sorted newest-first by the date each photo was
 * *taken* (EXIF `DateTimeOriginal`), falling back to the Cloudinary upload date
 * for photos whose EXIF was stripped (e.g. screenshots, shared/exported files).
 *
 * Note: Cloudinary's list/search endpoints only return limited metadata, so we
 * fetch full EXIF per asset via `api.resource`. Fine for a studio-sized gallery;
 * results are cached by the page's `revalidate` window.
 */
export async function getGalleryImages(): Promise<GalleryImage[]> {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME
  const api_key = process.env.CLOUDINARY_API_KEY
  const api_secret = process.env.CLOUDINARY_API_SECRET
  const folder = process.env.CLOUDINARY_GALLERY_FOLDER || "gallery"

  if (!cloud_name || !api_key || !api_secret) return FALLBACK_IMAGES

  try {
    cloudinary.config({ cloud_name, api_key, api_secret })
    // Search by `asset_folder` so this works with Cloudinary "dynamic folders",
    // where the folder is not part of the asset's public_id.
    const res = await cloudinary.search
      .expression(`asset_folder:${folder}`)
      .max_results(200)
      .execute()

    const resources = res.resources as {
      public_id: string
      secure_url: string
      created_at: string
    }[]

    const enriched = await Promise.all(
      resources.map(async (r) => {
        let taken: Date | null = null
        try {
          const full = await cloudinary.api.resource(r.public_id, { image_metadata: true })
          const m = (full.image_metadata || {}) as Record<string, string>
          taken =
            parseExifDate(m.DateTimeOriginal) ||
            parseExifDate(m.CreateDate) ||
            parseExifDate(m.ModifyDate)
        } catch {
          // no EXIF available — fall back to upload date below
        }
        return { src: r.secure_url, when: taken ?? new Date(r.created_at) }
      })
    )

    enriched.sort((a, b) => b.when.getTime() - a.when.getTime()) // newest taken first

    const items: GalleryImage[] = enriched.map((e) => ({
      src: e.src,
      date: formatDate(e.when),
    }))
    return items.length ? items : FALLBACK_IMAGES
  } catch (err) {
    console.error("Cloudinary gallery fetch failed, using fallback:", err)
    return FALLBACK_IMAGES
  }
}
