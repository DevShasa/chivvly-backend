/*
  Warnings:

  - The values [PROCESSING] on the enum `tWithdrawalStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "tWithdrawalStatus_new" AS ENUM ('PENDING', 'APPROVED', 'COMPLETED', 'FAILED', 'CANCELLED');
ALTER TABLE "Withdrawal" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Withdrawal" ALTER COLUMN "status" TYPE "tWithdrawalStatus_new" USING ("status"::text::"tWithdrawalStatus_new");
ALTER TYPE "tWithdrawalStatus" RENAME TO "tWithdrawalStatus_old";
ALTER TYPE "tWithdrawalStatus_new" RENAME TO "tWithdrawalStatus";
DROP TYPE "tWithdrawalStatus_old";
ALTER TABLE "Withdrawal" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "Withdrawal" ALTER COLUMN "status" SET DEFAULT 'PENDING';
