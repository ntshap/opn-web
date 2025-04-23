import { eventApi } from "@/lib/api-service" // Updated path
import EventPageClient from "./page.client"

// This function is required for static site generation with dynamic routes
export async function generateStaticParams() {
  try {
    // Fetch all events to generate static paths
    const events = await eventApi.getEvents()
    
    // Return an array of objects with the id parameter
    return events.map((event) => ({
      id: String(event.id),
    }))
  } catch (error) {
    console.error('Error generating static params for events:', error)
    // Return an empty array as fallback
    return []
  }
}

export default function EventPage({ params }: { params: { id: string } }) {
  return <EventPageClient id={params.id} />
}
