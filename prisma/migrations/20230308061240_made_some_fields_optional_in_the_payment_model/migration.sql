-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_payment_type_fkey";

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "payment_type" DROP NOT NULL,
ALTER COLUMN "tax" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_payment_type_fkey" FOREIGN KEY ("payment_type") REFERENCES "PaymentTypes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
