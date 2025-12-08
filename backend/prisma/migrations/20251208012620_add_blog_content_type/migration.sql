-- AlterEnum
ALTER TYPE "ContentType" ADD VALUE 'BLOG';

-- AlterTable
ALTER TABLE "contents" ADD COLUMN     "authorName" TEXT,
ADD COLUMN     "excerptEn" TEXT,
ADD COLUMN     "excerptVi" TEXT;

-- CreateTable
CREATE TABLE "blog_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_category_associations" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_category_associations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blog_categories_slug_key" ON "blog_categories"("slug");

-- CreateIndex
CREATE INDEX "blog_categories_slug_idx" ON "blog_categories"("slug");

-- CreateIndex
CREATE INDEX "blog_category_associations_contentId_idx" ON "blog_category_associations"("contentId");

-- CreateIndex
CREATE INDEX "blog_category_associations_categoryId_idx" ON "blog_category_associations"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "blog_category_associations_contentId_categoryId_key" ON "blog_category_associations"("contentId", "categoryId");

-- CreateIndex
CREATE INDEX "contents_type_isPublished_displayOrder_publishedAt_idx" ON "contents"("type", "isPublished", "displayOrder", "publishedAt");

-- CreateIndex
CREATE INDEX "contents_type_isPublished_slug_idx" ON "contents"("type", "isPublished", "slug");

-- AddForeignKey
ALTER TABLE "blog_category_associations" ADD CONSTRAINT "blog_category_associations_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_category_associations" ADD CONSTRAINT "blog_category_associations_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "blog_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
