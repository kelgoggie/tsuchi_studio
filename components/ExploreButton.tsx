"use client"

export default function ExploreButton() {
  function scrollPastHeader(e: React.MouseEvent<HTMLButtonElement>) {
    const header = e.currentTarget.closest("header")
    const top = header
      ? header.getBoundingClientRect().bottom + window.scrollY
      : window.innerHeight
    window.scrollTo({ top, behavior: "smooth" })
  }

  return (
    <button
      onClick={scrollPastHeader}
      className="rounded-full bg-olive px-7 py-2.5 text-sm font-medium text-cream shadow-md drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] transition hover:opacity-90"
    >
      explore tsuchi
    </button>
  )
}
