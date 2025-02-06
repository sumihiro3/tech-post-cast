-- CreateTable
CREATE TABLE "terms" (
    "id" SERIAL NOT NULL,
    "term" VARCHAR(255) NOT NULL,
    "reading" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "terms_pkey" PRIMARY KEY ("id")
);
