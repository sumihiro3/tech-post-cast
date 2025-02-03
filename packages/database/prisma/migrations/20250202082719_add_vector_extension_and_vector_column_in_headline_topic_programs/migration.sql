-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- AlterTable
ALTER TABLE "headline_topic_programs" ADD COLUMN     "vector" vector;
