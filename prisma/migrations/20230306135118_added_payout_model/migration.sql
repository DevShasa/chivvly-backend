-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('COMPLETE', 'DENIED', 'INCOMPLETE', 'SUCCESS', 'HOLD');

-- CreateTable
CREATE TABLE "Payout" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "amount" DOUBLE PRECISION,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "market_id" UUID NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'INCOMPLETE',

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payout_id_key" ON "Payout"("id");

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
