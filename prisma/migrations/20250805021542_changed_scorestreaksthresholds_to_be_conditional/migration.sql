-- AlterTable
ALTER TABLE "public"."GameConfig" ALTER COLUMN "scoreStreakThresholds" DROP NOT NULL,
ALTER COLUMN "maxPlayers" SET DEFAULT 0,
ALTER COLUMN "duration" SET DEFAULT 0;
