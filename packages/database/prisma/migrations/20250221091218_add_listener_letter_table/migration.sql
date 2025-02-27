-- CreateTable
CREATE TABLE "listener_letters" (
    "id" VARCHAR(100) NOT NULL,
    "body" TEXT NOT NULL,
    "penName" VARCHAR(50) NOT NULL,
    "sender_id" VARCHAR(50),
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "program_id" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listener_letters_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "listener_letters" ADD CONSTRAINT "listener_letters_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "headline_topic_programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
