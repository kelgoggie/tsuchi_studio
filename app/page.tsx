import { redirect } from "next/navigation"

export default function RootPage() {
  // Visitors now land on the homepage. The old landing lives at /coming-soon.
  redirect("/home")
}
