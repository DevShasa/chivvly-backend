-- CreateEnum
CREATE TYPE "tWithdrawalStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- AlterTable
ALTER TABLE "PayoutMethod" ADD COLUMN     "details" JSONB DEFAULT '{}';

-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "tracking_enabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Withdrawal" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "amount" DOUBLE PRECISION,
    "payout_id" UUID NOT NULL,
    "status" "tWithdrawalStatus" NOT NULL DEFAULT 'PROCESSING',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Withdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Withdrawal_id_key" ON "Withdrawal"("id");

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Withdrawal" ADD CONSTRAINT "Withdrawal_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "Payout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
