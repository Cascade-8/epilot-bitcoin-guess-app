/*
  Warnings:

  - Changed the type of `type` on the `Guess` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."GuessType" AS ENUM ('up', 'down');

-- AlterTable
ALTER TABLE "public"."GameConfig" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "public"."Guess" DROP COLUMN "type",
ADD COLUMN     "type" "public"."GuessType" NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."GameConfig" ADD CONSTRAINT "GameConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
