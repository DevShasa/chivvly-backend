-- DropForeignKey
ALTER TABLE "Payout" DROP CONSTRAINT "Payout_payout_method_id_fkey";

-- AlterTable
ALTER TABLE "Payout" ALTER COLUMN "payout_method_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_payout_method_id_fkey" FOREIGN KEY ("payout_method_id") REFERENCES "PayoutMethod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
