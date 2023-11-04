-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "issuer_id" UUID;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_issuer_id_fkey" FOREIGN KEY ("issuer_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
