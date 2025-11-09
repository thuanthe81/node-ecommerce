# Internationalization (i18n) Setup

This project uses `next-intl` for internationalization support with Vietnamese (default) and English locales.

## Configuration

### Supported Locales

- **Vietnamese (vi)**: Default locale, no URL prefix
- **English (en)**: URL prefix `/en`

### File Structure

```
frontend/
├── i18n/
│   ├── config.ts          # Locale configuration
│   ├── request.ts         # Server-side i18n setup
│   ├── routing.ts         # Routing configuration
│   └── README.md          # This file
├── locales/
│   └── translations.json  # All translations (en + vi)
├── middleware.ts          # Locale detection middleware
└── app/
    └── [locale]/          # Locale-based routing
        ├── layout.tsx     # Root layout with i18n provider
        └── page.tsx       # Example page using translations
```

## Usage

### In Server Components

```tsx
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('common');
  
  return <h1>{t('home')}</h1>;
}
```

### In Client Components

```tsx
'use client';

import { useTranslations } from 'next-intl';

export default function MyClientComponent() {
  const t = useTranslations('product');
  
  return <button>{t('addToCart')}</button>;
}
```

### Navigation

Use the custom navigation utilities from `@/i18n/routing`:

```tsx
import { Link, useRouter, usePathname } from '@/i18n/routing';

// Link component (automatically handles locale)
<Link href="/products">Products</Link>

// Programmatic navigation
const router = useRouter();
router.push('/products');

// Get current pathname (without locale prefix)
const pathname = usePathname();
```

### Locale Switcher

The `LocaleSwitcher` component is available for switching between languages:

```tsx
import LocaleSwitcher from '@/components/LocaleSwitcher';

<LocaleSwitcher />
```

## Adding New Translations

1. Open `frontend/locales/translations.json`
2. Add your new keys with both `en` and `vi` properties
3. Use nested structure for organization:

```json
{
  "myNewSection": {
    "key1": {
      "en": "English text",
      "vi": "Văn bản tiếng Việt"
    },
    "key2": {
      "en": "More English text",
      "vi": "Thêm văn bản tiếng Việt"
    }
  }
}
```

4. Use in components:

```tsx
const t = useTranslations('myNewSection');
<p>{t('key1')}</p>
```

### Translation File Structure

The translations file uses a key-based structure where each translation key contains both language versions:

```json
{
  "welcome": {
    "en": "Welcome",
    "vi": "Chào mừng"
  }
}
```

This structure ensures:
- All translations stay in sync (you can't forget to add a language)
- Easy to see missing translations at a glance
- Single source of truth for all languages

## SEO Configuration

### hreflang Tags

The layout automatically includes hreflang tags for SEO:

```html
<link rel="alternate" hrefLang="vi" href="/" />
<link rel="alternate" hrefLang="en" href="/en" />
<link rel="alternate" hrefLang="x-default" href="/" />
```

### Dynamic Meta Tags

Update meta tags per locale in your page components:

```tsx
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: 'metadata' });
  
  return {
    title: t('title'),
    description: t('description'),
  };
}
```

## Locale Detection

The middleware automatically detects the user's locale based on:

1. URL path (e.g., `/en/products`)
2. Browser's `Accept-Language` header
3. Falls back to default locale (Vietnamese)

## URL Structure

- Vietnamese (default): `/products`, `/cart`, `/checkout`
- English: `/en/products`, `/en/cart`, `/en/checkout`

## Environment Variables

Set the site URL for proper hreflang tags:

```env
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## Best Practices

1. **Always use translation keys**: Never hardcode text in components
2. **Organize translations logically**: Group related translations under namespaces
3. **Keep translations in sync**: Ensure both `en` and `vi` have the same keys
4. **Use descriptive keys**: Make translation keys self-explanatory
5. **Test both locales**: Always verify functionality in both languages

## Troubleshooting

### Translations not showing

- Check that the key exists in `translations.json`
- Verify the namespace matches: `useTranslations('namespace')`
- Ensure the locale parameter is correctly passed in the URL

### Locale switcher not working

- Verify middleware is configured correctly
- Check that the `matcher` in `middleware.ts` includes your routes
- Ensure cookies are enabled in the browser

### Build errors

- Run `npm run build` to check for TypeScript errors
- Verify all translation keys are strings
- Check that the JSON structure is valid
