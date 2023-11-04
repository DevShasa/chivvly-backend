/*
  Warnings:

  - A unique constraint covering the columns `[payout_method_id]` on the table `Withdrawal` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `payout_method_id` to the `Withdrawal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Withdrawal" ADD COLUMN     "payout_method_id" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Withdrawal_payout_method_id_key" ON "Withdrawal"("payout_method_id");

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_payout_method_id_fkey" FOREIGN KEY ("payout_method_id") REFERENCES "PayoutMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
