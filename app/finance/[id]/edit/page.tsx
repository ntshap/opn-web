import ClientWrapper from './client-wrapper'

// Use config object for page options
export const generateStaticParams = () => []
export const fetchCache = 'force-no-store'
export const revalidate = 0

interface EditFinancePageProps {
  params: { id: string }
}

export default function EditFinancePage({ params }: EditFinancePageProps) {
  return (
    <div className="container mx-auto py-6">
      <ClientWrapper id={params.id} />
    </div>
  )
}
