-- DropForeignKey
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_payment_id_fkey";

-- AlterTable
ALTER TABLE "Reservation" ALTER COLUMN "payment_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
