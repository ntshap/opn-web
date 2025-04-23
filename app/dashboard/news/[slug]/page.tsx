import NewsDetailPageClient from "./page.client"

// Use dynamic rendering for news pages
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default function NewsDetailPage({ params }: { params: { slug: string } }) {
  return <NewsDetailPageClient slug={params.slug} />
}
