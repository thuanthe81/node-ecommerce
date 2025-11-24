-- AlterTable
ALTER TABLE "contents" ADD COLUMN     "buttonTextEn" TEXT,
ADD COLUMN     "buttonTextVi" TEXT,
ADD COLUMN     "layout" TEXT;

-- CreateIndex
CREATE INDEX "contents_type_isPublished_displayOrder_idx" ON "contents"("type", "isPublished", "displayOrder");
