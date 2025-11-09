'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getPublishedContents, Content } from '@/lib/content-api';

export default function FAQContent() {
  const params = useParams();
  const locale = params.locale as string;

  const [faqs, setFaqs] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      setLoading(true);
      const data = await getPublishedContents('FAQ');
      setFaqs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg">Loading FAQs...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {locale === 'vi' ? 'Câu hỏi thường gặp' : 'Frequently Asked Questions'}
        </h1>
        <p className="text-gray-600 mb-12">
          {locale === 'vi'
            ? 'Tìm câu trả lời cho các câu hỏi phổ biến về sản phẩm và dịch vụ của chúng tôi.'
            : 'Find answers to common questions about our products and services.'}
        </p>

        {faqs.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            {locale === 'vi' ? 'Chưa có câu hỏi nào.' : 'No FAQs available yet.'}
          </div>
        ) : (
          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const title = locale === 'vi' ? faq.titleVi : faq.titleEn;
              const content = locale === 'vi' ? faq.contentVi : faq.contentEn;
              const isOpen = openIndex === index;

              return (
                <div
                  key={faq.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleAccordion(index)}
                    className="w-full px-6 py-4 text-left bg-white hover:bg-gray-50 flex justify-between items-center transition-colors"
                  >
                    <span className="font-semibold text-gray-900">{title}</span>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${
                        isOpen ? 'transform rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <div
                        className="prose max-w-none text-gray-700"
                        dangerouslySetInnerHTML={{ __html: content }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
