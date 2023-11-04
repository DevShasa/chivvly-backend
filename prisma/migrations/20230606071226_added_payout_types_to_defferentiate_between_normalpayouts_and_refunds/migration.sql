-- CreateEnum
CREATE TYPE "tPayoutType" AS ENUM ('HOST_PAYMENT', 'CUSTOMER_REFUND');

-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "type" "tPayoutType" NOT NULL DEFAULT 'HOST_PAYMENT';
