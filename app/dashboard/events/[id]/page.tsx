import EventPageClient from "./page.client"

// Use dynamic rendering for event pages
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Use a synchronous function to avoid the Next.js warning
// The warning occurs because we're using an async function but not awaiting anything
export default function EventPage({ params }: { params: { id: string } }) {
  // Access params.id synchronously since we're not using async/await
  return <EventPageClient id={params.id} />
}
