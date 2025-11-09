import { Suspense } from 'react';
import ContentListContent from './ContentListContent';

export default function ContentListPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContentListContent />
    </Suspense>
  );
}
