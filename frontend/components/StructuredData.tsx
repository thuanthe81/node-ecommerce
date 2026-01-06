import React from 'react';

interface StructuredDataProps {
  data: object | object[] | string;
}

export default function StructuredData({ data }: StructuredDataProps) {
  // Handle string data (JSON-LD string from SSR utils)
  if (typeof data === 'string') {
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: data }}
      />
    );
  }

  // Handle object or array data
  const jsonLd = Array.isArray(data) ? data : [data];

  return (
    <>
      {jsonLd.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
