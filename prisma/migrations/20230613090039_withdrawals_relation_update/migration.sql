/*
  Warnings:

  - You are about to drop the column `payout_id` on the `Withdrawal` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Withdrawal" DROP CONSTRAINT "Withdrawal_payout_id_fkey";

-- DropIndex
DROP INDEX "Withdrawal_payout_method_id_key";

-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "withdrawal_id" UUID;

-- AlterTable
ALTER TABLE "Withdrawal" DROP COLUMN "payout_id";

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_withdrawal_id_fkey" FOREIGN KEY ("withdrawal_id") REFERENCES "Withdrawal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
