"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
    setLoading(false)
    if (res.ok) {
      router.push("/admin")
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? "Login failed.")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl bg-card p-8 shadow-sm">
        <h1 className="mb-1 font-script text-3xl">admin</h1>
        <p className="mb-6 text-sm text-muted">Enter the studio password to continue.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full rounded-lg border border-divider bg-paper px-3 py-2 text-sm outline-none focus:border-olive"
        />
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-full bg-olive px-4 py-2 text-sm text-cream transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  )
}
