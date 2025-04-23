import NewEventPageClient from "./page.client"

// This function is required for static site generation with dynamic routes
export async function generateStaticParams() {
  // For a static page with no dynamic parameters, return an empty array
  return []
}

export default function NewEventPage() {
  return <NewEventPageClient />
}
