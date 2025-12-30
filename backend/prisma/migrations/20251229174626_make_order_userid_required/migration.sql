/*
  Warnings:

  - Made the column `userId` on table `orders` required. This step will fail if there are existing NULL values in that column.

*/

-- Step 1: Delete guest orders (orders without userId) as per requirements to eliminate guest orders
-- This removes all guest orders that were created without user authentication
DELETE FROM "orders" WHERE "userId" IS NULL;

-- Step 2: Drop the existing foreign key constraint
ALTER TABLE "orders" DROP CONSTRAINT "orders_userId_fkey";

-- Step 3: Make userId required (NOT NULL)
ALTER TABLE "orders" ALTER COLUMN "userId" SET NOT NULL;

-- Step 4: Add foreign key constraint with RESTRICT to ensure data integrity
-- Changed from SET NULL to RESTRICT to prevent orphaned orders
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
