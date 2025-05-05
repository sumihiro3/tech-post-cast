-- CreateTable
CREATE TABLE "likes_count_filters" (
    "id" VARCHAR(50) NOT NULL,
    "group_id" VARCHAR(50) NOT NULL,
    "min_likes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_count_filters_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "likes_count_filters" ADD CONSTRAINT "likes_count_filters_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "feed_filter_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
