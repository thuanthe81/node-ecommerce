import { notFound } from 'next/navigation';

export default function CatchAllPage() {
  // Catch all unmatched routes and show the custom not-found page
  notFound();
}
