import { Suspense } from 'react';
import FAQContent from './FAQContent';

export default function FAQPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FAQContent />
    </Suspense>
  );
}
