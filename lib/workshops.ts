// Display content for each workshop offering. `workshopId` maps to a DB
// workshop for capacity + booking (the two rug-tufting tiers share one pool);
// `slug` is the unique key used in the /book?w=<slug> URL.

export type WorkshopAddon = { price: number; label: string; items: string[] }

export type WorkshopOffering = {
  slug: string
  workshopId: string
  label: string
  titleScript: string
  image: string
  price: number
  description: string
  inclusions: string[]
  addon?: WorkshopAddon
}

const CERAMIC_INCLUSIONS = [
  "3-hour session",
  "900g stoneware clay",
  "Underglaze painting",
  "Food-safe clear glaze & firing",
  "Use of studio tools",
]

const CERAMIC_ADDON: WorkshopAddon = {
  price: 800,
  label: "second session + glazing",
  items: ["second session", "glazing (customer's choice of AMACO/Mayco glazes) & firing"],
}

const TUFTING_INCLUSIONS_BASE = ["Tufting gun & tools", "Unlimited yarn colors", "Backing kit", "Same-day take home"]

export const WORKSHOPS: WorkshopOffering[] = [
  {
    slug: "handbuilding",
    workshopId: "handbuilding",
    label: "Hand-building Workshop",
    titleScript: "hand-building workshop",
    image: "/images/carousel-3.JPG",
    price: 1200,
    description: "Create your own ceramic piece while learning the basics of pinching, coiling, and slab building.",
    inclusions: CERAMIC_INCLUSIONS,
    addon: CERAMIC_ADDON,
  },
  {
    slug: "wheel-throwing",
    workshopId: "wheel-throwing",
    label: "Introduction to Wheel-throwing",
    titleScript: "introduction to wheel-throwing",
    image: "/images/carousel-1.JPG",
    price: 1800,
    description: "Learn the fundamentals of wheel throwing and create your own pottery on the wheel.",
    inclusions: CERAMIC_INCLUSIONS,
    addon: CERAMIC_ADDON,
  },
  {
    slug: "medium-rug-tufting",
    workshopId: "rug-tufting",
    label: "Medium Rug Tufting",
    titleScript: "medium rug tufting",
    image: "/images/carousel-4.JPG",
    price: 1800,
    description: "Create your own custom rug from your chosen design.",
    inclusions: ["2.5-hour session", ...TUFTING_INCLUSIONS_BASE],
  },
  {
    slug: "large-rug-tufting",
    workshopId: "rug-tufting",
    label: "Large Rug Tufting",
    titleScript: "large rug tufting",
    image: "/images/carousel-5.JPG",
    price: 2500,
    description: "Perfect for larger and more detailed designs.",
    inclusions: ["3-hour session", ...TUFTING_INCLUSIONS_BASE],
  },
]

export function getWorkshop(slug: string): WorkshopOffering | undefined {
  return WORKSHOPS.find((w) => w.slug === slug)
}
