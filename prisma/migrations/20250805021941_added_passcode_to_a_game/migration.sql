/*
  Warnings:

  - Added the required column `passcode` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `private` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Game" ADD COLUMN     "passcode" TEXT NOT NULL,
ADD COLUMN     "private" BOOLEAN NOT NULL;
