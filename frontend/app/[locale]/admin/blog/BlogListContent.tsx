'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminBlogList from '@/components/AdminBlogList';

export default function BlogListContent({ locale }: { locale: string }) {
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

  return <AdminBlogList locale={locale} token={token} />;
}