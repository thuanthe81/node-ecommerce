-- AlterEnum
ALTER TYPE "ContentType" ADD VALUE 'HOMEPAGE_SECTION';

-- CreateTable
CREATE TABLE "footer_settings" (
    "id" TEXT NOT NULL,
    "copyrightText" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "facebookUrl" TEXT,
    "twitterUrl" TEXT,
    "tiktokUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "footer_settings_pkey" PRIMARY KEY ("id")
);
