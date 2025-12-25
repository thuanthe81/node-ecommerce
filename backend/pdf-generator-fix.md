# PDF Generator Fix for Frame Detachment Issue

## Problem
The PDF generation is failing with "Navigating frame was detached" error when calling `page.setContent()`. This is a common Puppeteer issue that occurs when the browser context gets disconnected or there are resource constraints.

## Root Cause
The error occurs at line 215 in `pdf-generator.service.ts` when calling:
```typescript
await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
```

## Solution
The fix involves three main changes:

### 1. Enhanced Page Creation with Error Handlers
Update the `createPageWithRetry` method to add error handlers and timeouts:

```typescript
private async createPageWithRetry(): Promise<puppeteer.Page> {
  const maxRetries = 3;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const browser = await this.initializeBrowser();
      const page = await browser.newPage();

      // Set up page error handlers to prevent frame detachment
      page.on('error', (error) => {
        this.logger.warn(`Page error detected: ${error.message}`);
      });

      page.on('pageerror', (error) => {
        this.logger.warn(`Page script error: ${error.message}`);
      });

      // Set reasonable timeouts
      page.setDefaultTimeout(30000); // 30 seconds
      page.setDefaultNavigationTimeout(30000);

      return page;
    } catch (error) {
      lastError = error as Error;
      this.logger.warn(`Failed to create page (attempt ${attempt}/${maxRetries}): ${error.message}`);

      if (attempt < maxRetries) {
        // Reset browser connection and try again
        this.browser = null;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      }
    }
  }

  throw new Error(`Failed to create page after ${maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}`);
}
```

### 2. Add Safe Content Setting Method
Add a new method to handle content setting with retry logic:

```typescript
private async setPageContentWithRetry(page: puppeteer.Page, htmlContent: string): Promise<void> {
  const maxRetries = 3;
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check if page is still connected
      if (page.isClosed()) {
        throw new Error('Page is closed');
      }

      // Set content with shorter timeout and retry on failure
      await page.setContent(htmlContent, {
        waitUntil: 'domcontentloaded', // Less strict than 'networkidle0'
        timeout: 15000 // 15 seconds timeout
      });

      // Success - exit retry loop
      return;
    } catch (error) {
      lastError = error as Error;
      this.logger.warn(`Failed to set page content (attempt ${attempt}/${maxRetries}): ${error.message}`);

      if (attempt < maxRetries) {
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));

        // If page is closed, we need to create a new one
        if (page.isClosed()) {
          throw new Error('Page closed during content setting - needs new page');
        }
      }
    }
  }

  throw new Error(`Failed to set page content after ${maxRetries} attempts. Last error: ${lastError?.message || 'Unknown error'}`);
}
```

### 3. Update generateOrderPDF Method
Replace the problematic content setting with the safer approach:

**Change this:**
```typescript
const page = await this.createPageWithRetry();
// ... other code ...
await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
```

**To this:**
```typescript
let page = await this.createPageWithRetry();
// ... other code ...
// Set HTML content with retry logic
try {
  await this.setPageContentWithRetry(page, htmlContent);
} catch (contentError) {
  // If setting content fails, try with a new page
  this.logger.warn(`Content setting failed, trying with new page: ${contentError.message}`);
  await page.close().catch(() => {}); // Close old page safely

  page = await this.createPageWithRetry();
  await page.setViewport({ width: 794, height: 1123 });
  await this.setPageContentWithRetry(page, htmlContent);
}
```

## Benefits of This Fix
1. **Retry Logic**: Automatically retries failed operations
2. **Better Error Handling**: Catches and handles frame detachment gracefully
3. **Resource Management**: Properly closes failed pages and creates new ones
4. **Timeout Management**: Uses more reasonable timeouts to prevent hanging
5. **Logging**: Provides better visibility into what's failing

## Testing
After applying this fix, the PDF generation should be more resilient to:
- Browser connection issues
- Memory constraints
- Network timeouts
- Frame detachment errors

The same pattern should be applied to all other PDF generation methods in the service.