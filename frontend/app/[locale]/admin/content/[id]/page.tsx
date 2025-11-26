import { Suspense } from 'react';
import EditContentContent from './EditContentContent';

export default function EditContentPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditContentContent params={params} />
    </Suspense>
  );
}
