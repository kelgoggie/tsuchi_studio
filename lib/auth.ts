import { cookies } from "next/headers"
import crypto from "crypto"

export const ADMIN_COOKIE = "tsuchi_admin"

/**
 * Cookie value = HMAC(secret, password). An attacker can't forge it without
 * knowing both ADMIN_PASSWORD and ADMIN_SECRET, and it changes if either does.
 */
export function adminToken(): string {
  const pw = process.env.ADMIN_PASSWORD ?? ""
  const secret = process.env.ADMIN_SECRET ?? "tsuchi-dev-secret-change-me"
  return crypto.createHmac("sha256", secret).update(pw).digest("hex")
}

/** True only when an admin password is configured AND the cookie matches. */
export async function isAdmin(): Promise<boolean> {
  if (!process.env.ADMIN_PASSWORD) return false
  const store = await cookies()
  return store.get(ADMIN_COOKIE)?.value === adminToken()
}
