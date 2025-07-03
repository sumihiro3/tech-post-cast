-- CreateEnum
CREATE TYPE "SpeakerMode" AS ENUM ('SINGLE', 'MULTI');

-- AlterTable
ALTER TABLE "personalized_feeds" ADD COLUMN     "speaker_mode" "SpeakerMode" NOT NULL DEFAULT 'SINGLE';
