/*
  Warnings:

  - You are about to drop the column `currency` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `hourly_rate` on the `Reservation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Reservation" DROP COLUMN "currency",
DROP COLUMN "hourly_rate";
