/*
  Warnings:

  - You are about to drop the `_UserGames` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."_UserGames" DROP CONSTRAINT "_UserGames_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_UserGames" DROP CONSTRAINT "_UserGames_B_fkey";

-- DropTable
DROP TABLE "public"."_UserGames";

-- CreateTable
CREATE TABLE "public"."UserState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserState_userId_gameId_key" ON "public"."UserState"("userId", "gameId");

-- AddForeignKey
ALTER TABLE "public"."UserState" ADD CONSTRAINT "UserState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserState" ADD CONSTRAINT "UserState_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
