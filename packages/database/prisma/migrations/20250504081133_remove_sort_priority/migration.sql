/*
  Warnings:

  - You are about to drop the column `sort_priority` on the `personalized_feeds` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "personalized_feeds" DROP COLUMN "sort_priority";

-- DropEnum
DROP TYPE "SortPriority";
