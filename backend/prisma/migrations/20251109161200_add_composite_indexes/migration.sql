-- Add composite indexes for better query performance

-- Product composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "products_isActive_categoryId_idx" ON "products"("isActive", "categoryId");
CREATE INDEX IF NOT EXISTS "products_isActive_isFeatured_idx" ON "products"("isActive", "isFeatured");
CREATE INDEX IF NOT EXISTS "products_isActive_price_idx" ON "products"("isActive", "price");
CREATE INDEX IF NOT EXISTS "products_isActive_createdAt_idx" ON "products"("isActive", "createdAt");

-- Order composite indexes for admin queries
CREATE INDEX IF NOT EXISTS "orders_userId_status_idx" ON "orders"("userId", "status");
CREATE INDEX IF NOT EXISTS "orders_userId_createdAt_idx" ON "orders"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "orders_status_createdAt_idx" ON "orders"("status", "createdAt");

-- Review composite indexes for product detail pages
CREATE INDEX IF NOT EXISTS "reviews_productId_isApproved_idx" ON "reviews"("productId", "isApproved");
CREATE INDEX IF NOT EXISTS "reviews_productId_isApproved_createdAt_idx" ON "reviews"("productId", "isApproved", "createdAt");
