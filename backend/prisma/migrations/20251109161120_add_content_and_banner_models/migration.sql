-- AlterTable
ALTER TABLE "contents" ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "linkUrl" TEXT;

-- CreateIndex
CREATE INDEX "orders_userId_status_idx" ON "orders"("userId", "status");

-- CreateIndex
CREATE INDEX "orders_userId_createdAt_idx" ON "orders"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "orders_status_createdAt_idx" ON "orders"("status", "createdAt");

-- CreateIndex
CREATE INDEX "products_isActive_categoryId_idx" ON "products"("isActive", "categoryId");

-- CreateIndex
CREATE INDEX "products_isActive_isFeatured_idx" ON "products"("isActive", "isFeatured");

-- CreateIndex
CREATE INDEX "products_isActive_price_idx" ON "products"("isActive", "price");

-- CreateIndex
CREATE INDEX "products_isActive_createdAt_idx" ON "products"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "reviews_productId_isApproved_idx" ON "reviews"("productId", "isApproved");

-- CreateIndex
CREATE INDEX "reviews_productId_isApproved_createdAt_idx" ON "reviews"("productId", "isApproved", "createdAt");
