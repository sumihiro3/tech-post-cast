-- AlterTable
ALTER TABLE "app_users" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "line_users" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "listener_letters" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;
