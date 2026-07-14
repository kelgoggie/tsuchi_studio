import Link from "next/link"

/** Page numbers with ellipses, e.g. 1 … 4 [5] 6 … 20. */
function pageList(page: number, pageCount: number): (number | "…")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1)

  const pages: (number | "…")[] = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(pageCount - 1, page + 1)

  if (start > 2) pages.push("…")
  for (let p = start; p <= end; p++) pages.push(p)
  if (end < pageCount - 1) pages.push("…")

  pages.push(pageCount)
  return pages
}

const BOX =
  "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm transition"

export default function Paginator({
  page,
  pageCount,
  total,
  pageSize,
  href,
}: {
  page: number
  pageCount: number
  total: number
  pageSize: number
  /** Builds the URL for a page, preserving filters. */
  href: (page: number) => string
}) {
  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">
        Showing {first}–{last} of {total}
      </p>

      {pageCount > 1 && (
        <nav className="flex items-center gap-1">
          {page > 1 ? (
            <Link href={href(page - 1)} className={`${BOX} border border-divider hover:bg-paper`}>
              ←
            </Link>
          ) : (
            <span className={`${BOX} border border-divider opacity-40`}>←</span>
          )}

          {pageList(page, pageCount).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className={`${BOX} text-muted`}>
                …
              </span>
            ) : (
              <Link
                key={p}
                href={href(p)}
                aria-current={p === page ? "page" : undefined}
                className={`${BOX} ${
                  p === page
                    ? "bg-olive font-medium text-cream"
                    : "border border-divider text-muted hover:bg-paper"
                }`}
              >
                {p}
              </Link>
            )
          )}

          {page < pageCount ? (
            <Link href={href(page + 1)} className={`${BOX} border border-divider hover:bg-paper`}>
              →
            </Link>
          ) : (
            <span className={`${BOX} border border-divider opacity-40`}>→</span>
          )}
        </nav>
      )}
    </div>
  )
}
