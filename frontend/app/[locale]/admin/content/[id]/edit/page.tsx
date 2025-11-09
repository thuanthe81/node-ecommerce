import { Suspense } from 'react';
import EditContentContent from './EditContentContent';

export default function EditContentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditContentContent />
    </Suspense>
  );
}
