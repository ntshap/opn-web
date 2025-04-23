import EditEventPageClient from "./page.client"

// Use dynamic rendering for event edit pages
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default function EditEventPage({ params }: { params: { id: string } }) {
  return <EditEventPageClient id={params.id} />
}
