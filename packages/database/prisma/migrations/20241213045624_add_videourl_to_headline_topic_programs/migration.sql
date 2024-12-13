/*
  Warnings:

  - You are about to alter the column `audio_url` on the `headline_topic_programs` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE "headline_topic_programs" ADD COLUMN     "video_url" VARCHAR(255) NOT NULL DEFAULT '',
ALTER COLUMN "audio_url" SET DEFAULT '',
ALTER COLUMN "audio_url" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "audio_duration" SET DEFAULT 0;
