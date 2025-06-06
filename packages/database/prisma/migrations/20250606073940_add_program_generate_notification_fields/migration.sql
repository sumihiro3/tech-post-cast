-- AlterTable
ALTER TABLE "personalized_program_attempts" ADD COLUMN     "notification_error" VARCHAR(255),
ADD COLUMN     "notification_success" BOOLEAN,
ADD COLUMN     "notified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notified_at" TIMESTAMP(3);
