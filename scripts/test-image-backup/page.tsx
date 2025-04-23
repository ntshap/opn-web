import dynamic from 'next/dynamic';

// Skip static generation for this page
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Use dynamic import with no SSR to avoid window is not defined errors
const TestImagePageClient = dynamic(
  () => import('./page.client'),
  { 
    loading: () => (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Image Loading Test Page</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }
)

export default function TestImagePage() {
  return <TestImagePageClient />
}
