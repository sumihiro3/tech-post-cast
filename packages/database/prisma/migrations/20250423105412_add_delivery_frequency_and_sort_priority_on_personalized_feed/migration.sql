-- CreateEnum
CREATE TYPE "DeliveryFrequency" AS ENUM ('DAILY', 'TWICE_WEEKLY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "SortPriority" AS ENUM ('PUBLISHED_AT_DESC', 'LIKES_DESC');

-- AlterTable
ALTER TABLE "personalized_feeds" ADD COLUMN     "delivery_frequency" "DeliveryFrequency" NOT NULL DEFAULT 'WEEKLY',
ADD COLUMN     "sort_priority" "SortPriority" NOT NULL DEFAULT 'PUBLISHED_AT_DESC';
