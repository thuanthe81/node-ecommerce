import { Suspense } from 'react';
import NewContentContent from './NewContentContent';

export default function NewContentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewContentContent />
    </Suspense>
  );
}
