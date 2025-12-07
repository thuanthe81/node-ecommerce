/*
  Warnings:

  - You are about to drop the column `sessionId` on the `carts` table. All the data in the column will be lost.
  - Made the column `userId` on table `carts` required. This step will fail if there are existing NULL values in that column.

*/

-- Step 1: Delete orphaned guest carts (carts without userId)
-- This removes all guest carts that were stored with sessionId only
DELETE FROM "carts" WHERE "userId" IS NULL;

-- Step 2: Drop the sessionId index
DROP INDEX "carts_sessionId_idx";

-- Step 3: Remove sessionId column and make userId required
ALTER TABLE "carts" DROP COLUMN "sessionId",
ALTER COLUMN "userId" SET NOT NULL;
