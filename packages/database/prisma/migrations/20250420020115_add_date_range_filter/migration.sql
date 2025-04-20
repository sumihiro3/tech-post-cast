-- CreateTable
CREATE TABLE "date_range_filters" (
    "id" VARCHAR(50) NOT NULL,
    "group_id" VARCHAR(50) NOT NULL,
    "days_ago" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "date_range_filters_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "date_range_filters" ADD CONSTRAINT "date_range_filters_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "feed_filter_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
