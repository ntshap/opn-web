// We need to split this into two files - a server component for generateStaticParams and a client component for the page

import EditEventPageClient from "./page.client"

// This function is required for static site generation with dynamic routes
export async function generateStaticParams() {
  try {
    // Create an array of IDs from 1 to 50 to ensure we cover all possible IDs
    // We're not fetching from the API since it requires authentication
    const staticIds = Array.from({ length: 50 }, (_, i) => String(i + 1))

    // Return an array of objects with the id parameter
    return staticIds.map(id => ({ id }))
  } catch (error) {
    console.error('Error generating static params for events edit page:', error)

    // If something fails, generate a range of IDs as fallback
    const fallbackIds = Array.from({ length: 10 }, (_, i) => String(i + 1))
    return fallbackIds.map(id => ({ id }))
  }
}

export default async function EditEventPage({ params }: { params: { id: string } }) {
  // In Next.js 15, params is a Promise that needs to be awaited
  const { id } = await params
  return <EditEventPageClient id={id} />
}

