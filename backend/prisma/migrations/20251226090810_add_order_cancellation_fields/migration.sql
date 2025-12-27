-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledBy" TEXT;

-- CreateIndex
CREATE INDEX "orders_cancelledAt_idx" ON "orders"("cancelledAt");
