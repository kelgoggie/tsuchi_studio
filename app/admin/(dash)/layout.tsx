import { redirect } from "next/navigation"
import Link from "next/link"
import { isAdmin } from "@/lib/auth"
import LogoutButton from "@/components/admin/LogoutButton"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login")

  return (
    <div className="min-h-screen bg-paper">
      <header className="flex items-center justify-between border-b border-divider bg-card px-6 py-4">
        <div className="flex items-center gap-6">
          <span className="font-script text-2xl">tsuchi admin</span>
          <nav className="flex gap-4 text-sm text-muted">
            <Link href="/admin" className="transition hover:text-foreground">Bookings</Link>
            <Link href="/admin/schedule" className="transition hover:text-foreground">Studio schedules</Link>
            <Link href="/admin/calendar" className="transition hover:text-foreground">Calendar</Link>
            <Link href="/admin/products" className="transition hover:text-foreground">Shop - Empty, Do Not Open</Link>
          </nav>
        </div>
        <LogoutButton />
      </header>
      <main className="mx-auto w-full max-w-[92rem] px-6 py-8">{children}</main>
    </div>
  )
}
