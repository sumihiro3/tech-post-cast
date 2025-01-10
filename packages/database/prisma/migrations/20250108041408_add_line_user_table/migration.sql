-- CreateTable
CREATE TABLE "line_users" (
    "id" VARCHAR(50) NOT NULL,
    "display_name" VARCHAR(50) NOT NULL,
    "is_followed" BOOLEAN NOT NULL DEFAULT false,
    "followed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "picture_url" VARCHAR(255),
    "language" VARCHAR(10),
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "line_users_pkey" PRIMARY KEY ("id")
);
