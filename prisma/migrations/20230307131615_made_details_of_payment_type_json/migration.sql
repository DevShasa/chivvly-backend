/*
  Warnings:

  - Added the required column `details` to the `PaymentTypes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PaymentTypes" DROP COLUMN "details",
ADD COLUMN     "details" JSONB NOT NULL;
