-- DropForeignKey
ALTER TABLE "Withdrawal" DROP CONSTRAINT "Withdrawal_payout_id_fkey";

-- AlterTable
ALTER TABLE "Withdrawal" ALTER COLUMN "payout_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "Payout"("id") ON DELETE SET NULL ON UPDATE CASCADE;
