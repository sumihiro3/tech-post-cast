/*
  Warnings:

  - You are about to drop the `daily_headline_topics` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "qiita_posts" DROP CONSTRAINT "qiita_posts_headline_topic_program_id_fkey";

-- DropTable
DROP TABLE "daily_headline_topics";

-- CreateTable
CREATE TABLE "headline_topic_programs" (
    "id" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "script" JSON NOT NULL,
    "audio_url" TEXT NOT NULL,
    "audio_duration" INTEGER NOT NULL,
    "image_url" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "headline_topic_programs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "qiita_posts" ADD CONSTRAINT "qiita_posts_headline_topic_program_id_fkey" FOREIGN KEY ("headline_topic_program_id") REFERENCES "headline_topic_programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
