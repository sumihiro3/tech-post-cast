/*
  Warnings:

  - The primary key for the `_QiitaPostToQiitaPostTag` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `qiita_post_tags` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `post_id` on the `qiita_post_tags` table. All the data in the column will be lost.
  - You are about to drop the `_PersonalizedProgramToQiitaPost` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `filter_groups` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `personalized_programs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_feed_filters` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updated_at` to the `qiita_post_tags` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_PersonalizedProgramToQiitaPost" DROP CONSTRAINT "_PersonalizedProgramToQiitaPost_A_fkey";

-- DropForeignKey
ALTER TABLE "_PersonalizedProgramToQiitaPost" DROP CONSTRAINT "_PersonalizedProgramToQiitaPost_B_fkey";

-- DropForeignKey
ALTER TABLE "_QiitaPostToQiitaPostTag" DROP CONSTRAINT "_QiitaPostToQiitaPostTag_B_fkey";

-- DropForeignKey
ALTER TABLE "author_filters" DROP CONSTRAINT "author_filters_group_id_fkey";

-- DropForeignKey
ALTER TABLE "filter_groups" DROP CONSTRAINT "filter_groups_filter_id_fkey";

-- DropForeignKey
ALTER TABLE "personalized_programs" DROP CONSTRAINT "personalized_programs_user_id_fkey";

-- DropForeignKey
ALTER TABLE "tag_filters" DROP CONSTRAINT "tag_filters_group_id_fkey";

-- DropForeignKey
ALTER TABLE "user_feed_filters" DROP CONSTRAINT "user_feed_filters_user_id_fkey";

-- AlterTable
ALTER TABLE "_QiitaPostToQiitaPostTag" DROP CONSTRAINT "_QiitaPostToQiitaPostTag_AB_pkey",
ALTER COLUMN "B" SET DATA TYPE VARCHAR(100),
ADD CONSTRAINT "_QiitaPostToQiitaPostTag_AB_pkey" PRIMARY KEY ("A", "B");

-- AlterTable
ALTER TABLE "qiita_post_tags" DROP CONSTRAINT "qiita_post_tags_pkey",
DROP COLUMN "post_id",
ADD COLUMN     "icon_url" VARCHAR(255),
ADD COLUMN     "items_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" SET DATA TYPE VARCHAR(100),
ADD CONSTRAINT "qiita_post_tags_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "_PersonalizedProgramToQiitaPost";

-- DropTable
DROP TABLE "filter_groups";

-- DropTable
DROP TABLE "personalized_programs";

-- DropTable
DROP TABLE "user_feed_filters";

-- CreateTable
CREATE TABLE "personalized_feeds" (
    "id" VARCHAR(50) NOT NULL,
    "user_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "data_source" VARCHAR(50) NOT NULL,
    "filter_config" JSONB NOT NULL,
    "delivery_config" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personalized_feeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feed_filter_groups" (
    "id" VARCHAR(50) NOT NULL,
    "filter_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "logic_type" VARCHAR(10) NOT NULL DEFAULT 'OR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feed_filter_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personalized_feed_programs" (
    "id" VARCHAR(100) NOT NULL,
    "user_id" VARCHAR(50) NOT NULL,
    "feed_id" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "script" JSON NOT NULL,
    "audio_url" VARCHAR(255) NOT NULL DEFAULT '',
    "audio_duration" INTEGER NOT NULL DEFAULT 0,
    "chapters" JSON NOT NULL DEFAULT '[]',
    "image_url" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personalized_feed_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PersonalizedFeedProgramToQiitaPost" (
    "A" VARCHAR(100) NOT NULL,
    "B" VARCHAR(50) NOT NULL,

    CONSTRAINT "_PersonalizedFeedProgramToQiitaPost_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PersonalizedFeedProgramToQiitaPost_B_index" ON "_PersonalizedFeedProgramToQiitaPost"("B");

-- AddForeignKey
ALTER TABLE "personalized_feeds" ADD CONSTRAINT "personalized_feeds_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feed_filter_groups" ADD CONSTRAINT "feed_filter_groups_filter_id_fkey" FOREIGN KEY ("filter_id") REFERENCES "personalized_feeds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_filters" ADD CONSTRAINT "tag_filters_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "feed_filter_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "author_filters" ADD CONSTRAINT "author_filters_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "feed_filter_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personalized_feed_programs" ADD CONSTRAINT "personalized_feed_programs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personalized_feed_programs" ADD CONSTRAINT "personalized_feed_programs_feed_id_fkey" FOREIGN KEY ("feed_id") REFERENCES "personalized_feeds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_QiitaPostToQiitaPostTag" ADD CONSTRAINT "_QiitaPostToQiitaPostTag_B_fkey" FOREIGN KEY ("B") REFERENCES "qiita_post_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PersonalizedFeedProgramToQiitaPost" ADD CONSTRAINT "_PersonalizedFeedProgramToQiitaPost_A_fkey" FOREIGN KEY ("A") REFERENCES "personalized_feed_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PersonalizedFeedProgramToQiitaPost" ADD CONSTRAINT "_PersonalizedFeedProgramToQiitaPost_B_fkey" FOREIGN KEY ("B") REFERENCES "qiita_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
