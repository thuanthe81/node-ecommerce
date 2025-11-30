---
inclusion: always
---

# Translation Standards

## ALWAYS Add Translations

When creating or modifying ANY user-facing text, you MUST add translations for both English and Vietnamese.

## Translation File Location

- **File**: `frontend/locales/translations.json`
- **Structure**: Nested JSON with `en` and `vi` keys for each translation

## Translation Process

### 1. Check Existing Translations First
Before adding new keys, search the translations file to see if a suitable translation already exists:
```bash
# Search for existing translations
grep -i "keyword" frontend/locales/translations.json
```

### 2. Add New Translation Keys
Follow the existing structure:
```json
{
  "section": {
    "keyName": {
      "en": "English text",
      "vi": "Vietnamese text"
    }
  }
}
```

### 3. Use Translations in Components
```typescript
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('section');

  return <h1>{t('keyName')}</h1>;
}
```

## Translation Key Organization

Keys are organized by section:
- `common` - Shared UI elements (buttons, labels, etc.)
- `nav` - Navigation items
- `account` - User account pages
- `admin` - Admin panel
- `cart` - Shopping cart
- `checkout` - Checkout flow
- `products` - Product pages
- `orders` - Order management
- `footer` - Footer content
- `home` - Homepage content

## Naming Conventions

- Use camelCase for key names
- Be descriptive but concise
- Group related translations under the same section
- Use consistent terminology across the app

## Examples from Codebase

### Simple Translation
```json
"admin": {
  "edit": {
    "en": "Edit",
    "vi": "Chỉnh sửa"
  }
}
```

### Parameterized Translation
```json
"admin": {
  "promotionUsedTimes": {
    "en": "This promotion has been used {count} time(s)",
    "vi": "Khuyến mãi này đã được sử dụng {count} lần"
  }
}
```

Usage:
```typescript
t('promotionUsedTimes', { count: usageCount })
```

## Required for All Components

- Page titles
- Button labels
- Form labels and placeholders
- Error messages
- Success messages
- Loading states
- Empty states
- Confirmation dialogs
- Table headers
- Status badges
- Help text and hints

## Quality Standards

- Translations must be accurate and natural in both languages
- Maintain consistent tone and terminology
- Test both languages to ensure proper display
- Consider text length differences between languages in UI design

## Reference Documents

See these files for comprehensive translation examples:
- `ADMIN_CONTENT_TRANSLATIONS.md`
- `ADMIN_PROMOTIONS_TRANSLATIONS.md`
