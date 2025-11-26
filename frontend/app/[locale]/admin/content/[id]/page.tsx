import { Suspense } from 'react';
import EditContentContent from './EditContentContent';

export default async function EditContentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditContentContent params={resolvedParams} />
    </Suspense>
  );
}
