/*
  Warnings:

  - Changed the type of `script` on the `daily_headline_topics` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "daily_headline_topics" DROP COLUMN "script",
ADD COLUMN     "script" JSON NOT NULL;
