import EventPageClient from "./page.client"

// Use dynamic rendering for event pages
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default function EventPage({ params }: { params: { id: string } }) {
  return <EventPageClient id={params.id} />
}
