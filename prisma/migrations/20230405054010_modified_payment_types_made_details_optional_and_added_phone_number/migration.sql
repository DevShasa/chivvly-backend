-- AlterTable
ALTER TABLE "PaymentTypes" ADD COLUMN     "phone_number" INTEGER,
ALTER COLUMN "details" DROP NOT NULL;
