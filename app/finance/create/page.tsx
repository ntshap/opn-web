// Server component that renders the client component
import ClientWrapper from './client-wrapper';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function CreateFinancePage() {
  return (
    <div className="container mx-auto py-6">
      <ClientWrapper />
    </div>
  )
}
