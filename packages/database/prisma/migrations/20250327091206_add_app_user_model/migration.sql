-- CreateTable
CREATE TABLE "app_users" (
    "id" VARCHAR(50) NOT NULL,
    "first_name" VARCHAR(50),
    "last_name" VARCHAR(50),
    "email" VARCHAR(255),
    "image_url" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_sign_in_at" TIMESTAMP(3),

    CONSTRAINT "app_users_pkey" PRIMARY KEY ("id")
);
