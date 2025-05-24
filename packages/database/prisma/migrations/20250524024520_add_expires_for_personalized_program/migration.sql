-- AlterTable
ALTER TABLE "personalized_feed_programs" ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "is_expired" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "program_duration" INTEGER NOT NULL DEFAULT 1;
