/*
  Warnings:

  - You are about to drop the column `payment_type` on the `Payment` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_payment_type_fkey";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "payment_type",
ADD COLUMN     "payment_type_id" UUID;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_payment_type_id_fkey" FOREIGN KEY ("payment_type_id") REFERENCES "PaymentTypes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
