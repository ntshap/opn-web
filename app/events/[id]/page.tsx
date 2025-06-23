import { EventDetail } from "@/components/events/event-detail"

// Use dynamic rendering for event pages
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default async function EventDetailsPage({ params }: { params: { id: string } }) {
  const { id } = params

  try {
    // Fetch the event data directly from the backend API
    const event = await fetch(`https://beopn.penaku.site/api/v1/events/${id}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(res => {
      if (!res.ok) throw new Error('Failed to fetch event')
      return res.json()
    })

    return (
      <div className="container mx-auto py-6">
        <EventDetail
          event={event}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      </div>
    )
  } catch (error) {
    // Handle errors gracefully
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Event Not Found</h1>
          <p className="text-red-700 mb-4">The event with ID {id} could not be found or has been removed.</p>
          <a href="/events" className="inline-block bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
            Back to Events
          </a>
        </div>
      </div>
    )
  }
}
