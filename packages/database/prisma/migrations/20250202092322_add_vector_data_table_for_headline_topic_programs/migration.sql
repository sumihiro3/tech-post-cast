/*
  Warnings:

  - You are about to drop the column `vector` on the `headline_topic_programs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "headline_topic_programs" DROP COLUMN "vector";

-- CreateTable
CREATE TABLE "headline_topic_program_vectors" (
    "headline_topic_program_id" VARCHAR(100) NOT NULL,
    "vector" vector NOT NULL,
    "model" TEXT NOT NULL,
    "total_tokens" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "headline_topic_program_vectors_pkey" PRIMARY KEY ("headline_topic_program_id")
);

-- AddForeignKey
ALTER TABLE "headline_topic_program_vectors" ADD CONSTRAINT "headline_topic_program_vectors_headline_topic_program_id_fkey" FOREIGN KEY ("headline_topic_program_id") REFERENCES "headline_topic_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
