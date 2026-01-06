# Sitemap Integration Guide

This guide explains how to integrate the comprehensive sitemap generation system with your content management workflow.

## Overview

The sitemap system provides:
- **Dynamic sitemap generation** for products, categories, blog posts, and static pages
- **Separate sitemaps** for different content types
- **Automatic revalidation** when content changes
- **Search engine submission** capabilities
- **Webhook integration** for real-time updates

## Available Sitemaps

| Sitemap | URL | Content | Update Frequency |
|---------|-----|---------|------------------|
| Main | `/sitemap.xml` | All content combined | When any content changes |
| Index | `/sitemap-index.xml` | References to all sitemaps | When any content changes |
| Products | `/sitemap-products.xml` | Product pages | When products change |
| Categories | `/sitemap-categories.xml` | Category pages | When categories change |
| Blog | `/sitemap-blog.xml` | Blog posts | When blog content changes |
| Static | `/sitemap-static.xml` | Static pages and content | When pages change |

## API Endpoints

### Revalidate Sitemaps
```
POST /api/revalidate-sitemap
Authorization: Bearer <REVALIDATION_TOKEN>

Body:
{
  "type": "product|category|blog|content|page|all",
  "action": "create|update|delete",
  "id": "content-id",
  "slug": "content-slug"
}
```

### Submit to Search Engines
```
POST /api/submit-sitemaps
Authorization: Bearer <REVALIDATION_TOKEN>

Body:
{
  "action": "submit|instructions"
}
```

## Backend Integration

### 1. Environment Variables

Add to your `.env` file:
```env
REVALIDATION_TOKEN=your-secure-token-here
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 2. Webhook Integration

In your backend services (NestJS controllers), add sitemap revalidation:

```typescript
// products.service.ts
import { triggerSitemapUpdate } from '@/lib/sitemap-automation';

async createProduct(createProductDto: CreateProductDto) {
  const product = await this.productRepository.save(createProductDto);

  // Trigger sitemap update
  await triggerSitemapUpdate({
    type: 'product',
    action: 'create',
    id: product.id,
    slug: product.slug
  });

  return product;
}

async updateProduct(id: string, updateProductDto: UpdateProductDto) {
  const product = await this.productRepository.update(id, updateProductDto);

  // Trigger sitemap update
  await triggerSitemapUpdate({
    type: 'product',
    action: 'update',
    id: product.id,
    slug: product.slug
  });

  return product;
}
```

### 3. Batch Updates

For bulk operations:

```typescript
import { triggerBatchSitemapUpdate } from '@/lib/sitemap-automation';

async bulkUpdateProducts(updates: UpdateProductDto[]) {
  const results = await this.productRepository.bulkUpdate(updates);

  // Trigger batch sitemap updates
  const events = results.map(product => ({
    type: 'product' as const,
    action: 'update' as const,
    id: product.id,
    slug: product.slug
  }));

  await triggerBatchSitemapUpdate(events);

  return results;
}
```

## Manual Operations

### Trigger Sitemap Revalidation

```bash
# Revalidate all sitemaps
curl -X POST "https://your-domain.com/api/revalidate-sitemap" \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"type": "all", "action": "update"}'

# Revalidate specific content type
curl -X POST "https://your-domain.com/api/revalidate-sitemap" \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"type": "product", "action": "update"}'
```

### Submit to Search Engines

```bash
# Submit all sitemaps
curl -X POST "https://your-domain.com/api/submit-sitemaps" \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"action": "submit"}'

# Get submission instructions
curl -X GET "https://your-domain.com/api/submit-sitemaps?token=your-token"
```

## Scheduled Updates

### Using Cron Jobs

Add to your server's crontab:

```bash
# Update sitemaps every hour
0 * * * * curl -X POST "https://your-domain.com/api/revalidate-sitemap" \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"type": "all", "action": "update"}'

# Submit to search engines daily at 2 AM
0 2 * * * curl -X POST "https://your-domain.com/api/submit-sitemaps" \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"action": "submit"}'
```

### Using Node.js Scheduler

```typescript
import { scheduledSitemapUpdate } from '@/lib/sitemap-automation';
import cron from 'node-cron';

// Schedule sitemap updates every hour
cron.schedule('0 * * * *', async () => {
  console.log('Running scheduled sitemap update...');
  await scheduledSitemapUpdate();
});
```

## Search Engine Submission

### Automatic Submission

The system provides URLs for automatic submission:

- **Google**: `https://www.google.com/ping?sitemap=<sitemap-url>`
- **Bing**: `https://www.bing.com/ping?sitemap=<sitemap-url>`

### Manual Submission

1. **Google Search Console**:
   - Visit: https://search.google.com/search-console
   - Add your sitemaps under "Sitemaps" section

2. **Bing Webmaster Tools**:
   - Visit: https://www.bing.com/webmasters
   - Submit sitemaps in the "Sitemaps" section

## Monitoring

### Check Sitemap Status

```bash
# Check if sitemaps are accessible
curl -I "https://your-domain.com/sitemap.xml"
curl -I "https://your-domain.com/sitemap-products.xml"
curl -I "https://your-domain.com/sitemap-categories.xml"
curl -I "https://your-domain.com/sitemap-blog.xml"
curl -I "https://your-domain.com/sitemap-static.xml"
```

### Validate Sitemaps

Use online tools:
- Google Search Console Sitemap Tester
- XML Sitemap Validator tools
- Screaming Frog SEO Spider

## Troubleshooting

### Common Issues

1. **Sitemap not updating**:
   - Check if revalidation API is being called
   - Verify REVALIDATION_TOKEN is set correctly
   - Check server logs for errors

2. **Missing content in sitemap**:
   - Verify API endpoints are returning data
   - Check if content is published/active
   - Review fetch logic in sitemap utilities

3. **Search engines not indexing**:
   - Verify sitemaps are submitted to search consoles
   - Check robots.txt includes sitemap references
   - Ensure sitemaps are accessible (not blocked)

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will show detailed logs for sitemap generation and submission processes.

## Performance Considerations

- Sitemaps are cached for 1 hour by default
- Large sites (>50,000 URLs) should use sitemap index files
- Consider implementing pagination for very large sitemaps
- Monitor server resources during sitemap generation

## Security

- Always use HTTPS for sitemap URLs
- Protect revalidation endpoints with authentication tokens
- Regularly rotate REVALIDATION_TOKEN
- Monitor API endpoint usage for abuse