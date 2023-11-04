/*
  Warnings:

  - The `type` column on the `PaymentTypes` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "PaymentTypes" ADD COLUMN     "is_primary" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'STRIPE';
