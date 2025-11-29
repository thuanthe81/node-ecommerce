# Backward Compatibility for Image Retrieval

## Overview

This document describes the backward compatibility implementation for product image retrieval during the transition from flat directory structure to hierarchical directory structure.

## Implementation

### 1. Image Retrieval Helper Method

**Location:** `ProductsImageService.resolveImagePath()`

This method provides intelligent image path resolution with the following behavior:

1. **Hierarchical Location First**: Checks the new hierarchical structure (`uploads/products/[product-id]/[filename]`)
2. **Legacy Fallback**: Falls back to the legacy flat structure (`uploads/products/[filename]`)
3. **Warning Logging**: Logs a warning when serving from legacy location for monitoring purposes

**Supported URL Formats:**
- New hierarchical: `/uploads/products/[product-id]/[filename]`
- New hierarchical thumbnail: `/uploads/products/[product-id]/thumbnails/[filename]`
- Legacy flat: `/uploads/products/[filename]`
- Legacy flat thumbnail: `/uploads/products/thumbnails/[filename]`

### 2. Image Retrieval Middleware

**Location:** `ImageRetrievalMiddleware`

A NestJS middleware that intercepts all requests to `/uploads/products/*` and:

1. Uses `ProductsImageService.resolveImagePath()` to find the image
2. Sets appropriate MIME types based on file extension
3. Sets caching headers (1 year cache for immutable images)
4. Adds `X-Image-Source` header to indicate if served from legacy or hierarchical location
5. Streams the file to the response

**Headers Set:**
- `Content-Type`: Determined from file extension (jpeg, png, webp, gif)
- `Cache-Control`: `public, max-age=31536000, immutable`
- `X-Image-Source`: `hierarchical` or `legacy` (for monitoring)

### 3. Static File Serving Configuration

**Location:** `AppModule.configure()`

The middleware is applied to all routes matching `/uploads/products/*`, ensuring that:
- All product image requests go through the backward compatibility logic
- Images are served from the correct location (hierarchical or legacy)
- Proper headers are set for caching and monitoring

## Monitoring

### Identifying Legacy Image Usage

You can monitor legacy image usage by:

1. **Checking Logs**: Look for warnings like:
   ```
   [ProductsImageService] Image served from legacy location: /uploads/products/[filename]. Consider running migration.
   ```

2. **Checking Response Headers**: The `X-Image-Source` header indicates the source:
   - `hierarchical`: Image served from new structure
   - `legacy`: Image served from legacy structure

3. **Metrics**: Track the ratio of `X-Image-Source: legacy` responses to identify unmigrated images

## Migration Path

1. **Before Migration**: All images served from legacy location with warnings
2. **During Migration**: Mix of hierarchical and legacy, with warnings for legacy
3. **After Migration**: All images served from hierarchical location, no warnings
4. **Cleanup**: Once all images are migrated and verified, the backward compatibility code can be removed

## Testing

Unit tests are provided in `image-retrieval.spec.ts` that verify:
- Images are found in hierarchical location first
- Fallback to legacy location works correctly
- Thumbnail paths are handled correctly
- Both URL formats are supported
- Proper error handling when images don't exist

## Performance Considerations

- **File System Checks**: The middleware performs up to 2 file system checks per request (hierarchical, then legacy)
- **Caching**: Aggressive caching (1 year) minimizes repeated requests
- **Async Operations**: All file operations are asynchronous to avoid blocking

## Security Considerations

- **Path Validation**: Product IDs are validated as UUIDs
- **No Path Traversal**: All paths are constructed using `path.join()` to prevent traversal attacks
- **Error Handling**: Errors are logged but don't expose file system details to clients

## Future Cleanup

Once all images are migrated (verified by absence of legacy warnings), the following can be removed:

1. `ImageRetrievalMiddleware` (replace with standard static file serving)
2. `resolveImagePath()` method (no longer needed)
3. Legacy directory references in `ProductsImageService`
4. Backward compatibility tests

The migration can be verified by:
```bash
npm run verify:migration
```
