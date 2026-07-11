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
  // For workshops priced by piece ("starts at") rather than a flat per-person rate.
  priceOptions?: { label: string; price: number }[]
  // Custom price line shown instead of the default "₱X/person".
  priceNote?: string
  // Flat reservation fee (deducted from the total) instead of a 50% deposit.
  bookingFee?: number
  // Extra paragraphs shown on the booking page (disclaimers / details).
  bookingNotes?: string[]
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

const TUFTING_NOTES = [
  "This workshop is beginner-friendly, and no prior experience is needed. You'll be guided through the entire tufting process at your own pace.",
  "Please note that this workshop is not recommended for children below 13 years old, as the tufting gun is a high-speed, heavy power tool that requires proper handling and supervision.",
]

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
    image: "/images/rug-tugting-01.JPG",
    price: 1800,
    description: "Create your own custom rug from your chosen design.",
    inclusions: ["2.5-hour session", "45 × 45 cm frame", ...TUFTING_INCLUSIONS_BASE],
    bookingNotes: TUFTING_NOTES,
  },
  {
    slug: "large-rug-tufting",
    workshopId: "rug-tufting",
    label: "Large Rug Tufting",
    titleScript: "large rug tufting",
    image: "/images/rug-tugting-02.JPG",
    price: 2500,
    description: "Perfect for larger and more detailed designs.",
    inclusions: ["3-hour session", "60 × 60 cm frame", ...TUFTING_INCLUSIONS_BASE],
    bookingNotes: TUFTING_NOTES,
  },
  {
    slug: "ceramic-painting",
    workshopId: "ceramic-painting",
    label: "Ceramic Painting",
    titleScript: "ceramic painting",
    image: "/images/ceramic-painting.jpg",
    price: 500,
    priceNote: "Pieces start at ₱500",
    bookingFee: 250,
    description: "Paint and personalize a ready-to-paint ceramic piece.",
    inclusions: [
      "Underglaze paints",
      "Clear glaze finish or glaze combinations",
      "All materials, glazing & firing included",
    ],
    bookingNotes: [
      "Choose from a curated selection of ready-to-paint ceramic pieces available at the studio, with prices starting at ₱500. Pieces range from small to large, allowing you to choose one that suits your style.",
      "A ₱250 booking fee is required to reserve your slot. The booking fee will be deducted from your total workshop fee. You may decorate your piece using underglaze with a clear glaze finish for a smooth, glossy surface that highlights your design, or choose from our selection of glaze combinations for a more expressive, layered finish.",
      "All materials, glazing, and firing are included.",
    ],
  },
]

export function getWorkshop(slug: string): WorkshopOffering | undefined {
  return WORKSHOPS.find((w) => w.slug === slug)
}
