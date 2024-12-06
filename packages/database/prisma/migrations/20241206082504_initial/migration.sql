-- CreateTable
CREATE TABLE "daily_headline_topics" (
    "id" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "script" TEXT NOT NULL,
    "audio_url" TEXT NOT NULL,
    "audio_duration" INTEGER NOT NULL,
    "image_url" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_headline_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qiita_posts" (
    "id" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "author_name" VARCHAR(50) NOT NULL,
    "author_id" VARCHAR(50) NOT NULL,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "stocks_count" INTEGER NOT NULL DEFAULT 0,
    "private" BOOLEAN NOT NULL DEFAULT false,
    "refreshed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "summary" TEXT,
    "headline_topic_program_id" TEXT,

    CONSTRAINT "qiita_posts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "qiita_posts" ADD CONSTRAINT "qiita_posts_headline_topic_program_id_fkey" FOREIGN KEY ("headline_topic_program_id") REFERENCES "daily_headline_topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;
