-- AlterTable
ALTER TABLE "app_users" ADD COLUMN     "notification_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slack_webhook_url" VARCHAR(500);
