-- CreateTable
CREATE TABLE "personalized_program_attempts" (
    "id" VARCHAR(100) NOT NULL,
    "user_id" VARCHAR(50) NOT NULL,
    "feed_id" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "reason" VARCHAR(255),
    "postCount" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "program_id" VARCHAR(100),

    CONSTRAINT "personalized_program_attempts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "personalized_program_attempts" ADD CONSTRAINT "personalized_program_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personalized_program_attempts" ADD CONSTRAINT "personalized_program_attempts_feed_id_fkey" FOREIGN KEY ("feed_id") REFERENCES "personalized_feeds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personalized_program_attempts" ADD CONSTRAINT "personalized_program_attempts_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "personalized_feed_programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
