'use client';

import { Suspense } from 'react';
import CreateFinancePageClient from './page.client';

export default function ClientWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateFinancePageClient />
    </Suspense>
  );
}
