-- CreateTable
CREATE TABLE "qiita_post_tags" (
    "id" VARCHAR(50) NOT NULL,
    "post_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qiita_post_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "price" INTEGER NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" VARCHAR(50) NOT NULL,
    "user_id" VARCHAR(50) NOT NULL,
    "plan_id" VARCHAR(50) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_feed_filters" (
    "id" VARCHAR(50) NOT NULL,
    "user_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "filter_config" JSONB NOT NULL,
    "delivery_config" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_feed_filters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "filter_groups" (
    "id" VARCHAR(50) NOT NULL,
    "filter_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "logic_type" VARCHAR(10) NOT NULL DEFAULT 'OR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "filter_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag_filters" (
    "id" VARCHAR(50) NOT NULL,
    "group_id" VARCHAR(50) NOT NULL,
    "tag_name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tag_filters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "author_filters" (
    "id" VARCHAR(50) NOT NULL,
    "group_id" VARCHAR(50) NOT NULL,
    "author_id" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "author_filters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personalized_programs" (
    "id" VARCHAR(100) NOT NULL,
    "user_id" VARCHAR(50) NOT NULL,
    "filter_id" VARCHAR(50),
    "title" VARCHAR(255) NOT NULL,
    "script" JSON NOT NULL,
    "audio_url" VARCHAR(255) NOT NULL DEFAULT '',
    "audio_duration" INTEGER NOT NULL DEFAULT 0,
    "chapters" JSON NOT NULL DEFAULT '[]',
    "image_url" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personalized_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_QiitaPostToQiitaPostTag" (
    "A" VARCHAR(50) NOT NULL,
    "B" VARCHAR(50) NOT NULL,

    CONSTRAINT "_QiitaPostToQiitaPostTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PersonalizedProgramToQiitaPost" (
    "A" VARCHAR(100) NOT NULL,
    "B" VARCHAR(50) NOT NULL,

    CONSTRAINT "_PersonalizedProgramToQiitaPost_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_QiitaPostToQiitaPostTag_B_index" ON "_QiitaPostToQiitaPostTag"("B");

-- CreateIndex
CREATE INDEX "_PersonalizedProgramToQiitaPost_B_index" ON "_PersonalizedProgramToQiitaPost"("B");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_feed_filters" ADD CONSTRAINT "user_feed_filters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "filter_groups" ADD CONSTRAINT "filter_groups_filter_id_fkey" FOREIGN KEY ("filter_id") REFERENCES "user_feed_filters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_filters" ADD CONSTRAINT "tag_filters_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "filter_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "author_filters" ADD CONSTRAINT "author_filters_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "filter_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personalized_programs" ADD CONSTRAINT "personalized_programs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_QiitaPostToQiitaPostTag" ADD CONSTRAINT "_QiitaPostToQiitaPostTag_A_fkey" FOREIGN KEY ("A") REFERENCES "qiita_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_QiitaPostToQiitaPostTag" ADD CONSTRAINT "_QiitaPostToQiitaPostTag_B_fkey" FOREIGN KEY ("B") REFERENCES "qiita_post_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PersonalizedProgramToQiitaPost" ADD CONSTRAINT "_PersonalizedProgramToQiitaPost_A_fkey" FOREIGN KEY ("A") REFERENCES "personalized_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PersonalizedProgramToQiitaPost" ADD CONSTRAINT "_PersonalizedProgramToQiitaPost_B_fkey" FOREIGN KEY ("B") REFERENCES "qiita_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
