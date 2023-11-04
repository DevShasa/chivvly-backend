/*
  Warnings:

  - Added the required column `payout_method_id` to the `Payout` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "tPayoutMethodType" AS ENUM ('MPESA', 'BANK_ACCOUNT', 'PAYPAL');

-- AlterTable
ALTER TABLE "DriverCredentials" ADD COLUMN     "drivers_licence" TEXT,
ALTER COLUMN "is_verified" SET DEFAULT false;

-- AlterTable
ALTER TABLE "Payout" ADD COLUMN     "payout_method_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "PayoutMethod" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "connected_account_id" TEXT,
    "mobile_money_number" TEXT,
    "paypal_email" TEXT,
    "type" "tPayoutMethodType" NOT NULL DEFAULT 'BANK_ACCOUNT',
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PayoutMethod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PayoutMethod_id_key" ON "PayoutMethod"("id");

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_payout_method_id_fkey" FOREIGN KEY ("payout_method_id") REFERENCES "PayoutMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayoutMethod" ADD CONSTRAINT "PayoutMethod_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
