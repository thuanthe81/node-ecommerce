-- CreateTable
CREATE TABLE "shipping_methods" (
    "id" TEXT NOT NULL,
    "methodId" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "descriptionVi" TEXT NOT NULL,
    "carrier" TEXT,
    "baseRate" DECIMAL(10,2) NOT NULL,
    "estimatedDaysMin" INTEGER NOT NULL,
    "estimatedDaysMax" INTEGER NOT NULL,
    "weightThreshold" DECIMAL(10,2),
    "weightRate" DECIMAL(10,2),
    "freeShippingThreshold" DECIMAL(10,2),
    "regionalPricing" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_methods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shipping_methods_methodId_key" ON "shipping_methods"("methodId");

-- CreateIndex
CREATE INDEX "shipping_methods_isActive_displayOrder_idx" ON "shipping_methods"("isActive", "displayOrder");

-- CreateIndex
CREATE INDEX "shipping_methods_methodId_idx" ON "shipping_methods"("methodId");
