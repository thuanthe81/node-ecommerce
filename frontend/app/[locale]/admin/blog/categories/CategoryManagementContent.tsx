'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BlogCategoryManager from '@/components/BlogCategoryManager';

export default function CategoryManagementContent({ locale }: { locale: string }) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('accessToken');
    if (!storedToken) {
      router.push(`/${locale}/login`);
      return;
    }
    setToken(storedToken);
  }, [locale, router]);

  if (!token) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return <BlogCategoryManager locale={locale} token={token} />;
}