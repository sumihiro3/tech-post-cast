/*
  Warnings:

  - The primary key for the `headline_topic_program_vectors` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `headline_topic_program_id` on the `headline_topic_program_vectors` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `headline_topic_program_vectors` table. All the data in the column will be lost.
  - Added the required column `id` to the `headline_topic_program_vectors` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "headline_topic_program_vectors" DROP CONSTRAINT "headline_topic_program_vectors_headline_topic_program_id_fkey";

-- AlterTable
ALTER TABLE "headline_topic_program_vectors" DROP CONSTRAINT "headline_topic_program_vectors_pkey",
DROP COLUMN "headline_topic_program_id",
DROP COLUMN "updated_at",
ADD COLUMN     "id" VARCHAR(100) NOT NULL,
ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP,
ADD CONSTRAINT "headline_topic_program_vectors_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "headline_topic_program_vectors" ADD CONSTRAINT "headline_topic_program_vectors_id_fkey" FOREIGN KEY ("id") REFERENCES "headline_topic_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
