/*
  Warnings:

  - A unique constraint covering the columns `[rss_token]` on the table `app_users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "app_users" ADD COLUMN     "rss_created_at" TIMESTAMP(3),
ADD COLUMN     "rss_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rss_token" VARCHAR(36),
ADD COLUMN     "rss_updated_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "app_users_rss_token_key" ON "app_users"("rss_token");
