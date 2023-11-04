/*
  Warnings:

  - Added the required column `payment_method` to the `Reservation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "payment_method" TEXT NOT NULL;
