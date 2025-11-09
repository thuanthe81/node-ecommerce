import { Suspense } from 'react';
import ContactContent from './ContactContent';

export default function ContactPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContactContent />
    </Suspense>
  );
}
