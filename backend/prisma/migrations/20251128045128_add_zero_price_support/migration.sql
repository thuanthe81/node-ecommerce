-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'PENDING_QUOTE';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "requiresPricing" BOOLEAN NOT NULL DEFAULT false;
