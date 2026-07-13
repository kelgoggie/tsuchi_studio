// Display helpers for the admin. The studio is in Iloilo City, so timestamps
// render in Philippine time no matter where the server (Vercel = UTC) runs.

export const STUDIO_TZ = "Asia/Manila"

/** Workshop dates are stored date-only (@db.Date), so they read back in UTC. */
export function fmtDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

export function fmtDay(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" })
}

export function fmtLongDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

/** `createdAt` is a real instant, so it gets converted into studio time. */
export function fmtDateTime(d: Date) {
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: STUDIO_TZ,
  })
}

export const peso = (n: number | null | undefined) => (n == null ? "—" : `₱${n.toLocaleString()}`)

/** "YYYY-MM-DD" for today in studio time — not the server's timezone. */
export function todayInStudio(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: STUDIO_TZ }).format(new Date())
}
