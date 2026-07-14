// Client-safe constants. Keep this module free of server-only imports (Prisma,
// node builtins) — client components import from here.

/** Sentinel for the admin's "All workshops" option when blocking slots. */
export const ALL_WORKSHOPS = "__all__"

/** The studio takes the full class fee upfront; nothing is left owing. */
export const PAYMENT_NOTICE =
  "Please note that payment is non-refundable once your reservation request has been approved."

/** Where customers send proof of payment. */
export const INSTAGRAM_HANDLE = "tsuchi.studio"
export const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_HANDLE}`
