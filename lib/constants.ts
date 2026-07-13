// Client-safe constants. Keep this module free of server-only imports (Prisma,
// node builtins) — client components import from here.

/** Sentinel for the admin's "All workshops" option when blocking slots. */
export const ALL_WORKSHOPS = "__all__"

export const DOWN_PAYMENT_NOTICE =
  "Please note that the down payment is non-refundable once your reservation request has been approved."
