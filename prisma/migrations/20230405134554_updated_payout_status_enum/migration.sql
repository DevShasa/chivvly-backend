/*
  Warnings:

  - The values [COMPLETE,DENIED,INCOMPLETE,SUCCESS] on the enum `tPayoutStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "tPayoutStatus_new" AS ENUM ('PROCESSING', 'FAILED', 'CANCELLED', 'SUCCEEDED', 'HOLD');
ALTER TABLE "Payout" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Payout" ALTER COLUMN "status" TYPE "tPayoutStatus_new" USING ("status"::text::"tPayoutStatus_new");
ALTER TYPE "tPayoutStatus" RENAME TO "tPayoutStatus_old";
ALTER TYPE "tPayoutStatus_new" RENAME TO "tPayoutStatus";
DROP TYPE "tPayoutStatus_old";
ALTER TABLE "Payout" ALTER COLUMN "status" SET DEFAULT 'PROCESSING';
COMMIT;

-- AlterTable
ALTER TABLE "Payout" ALTER COLUMN "status" SET DEFAULT 'PROCESSING';
