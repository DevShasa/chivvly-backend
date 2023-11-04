/*
  Warnings:

  - The `status` column on the `AuthCode` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `DriverCredentials` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `market_id` on the `Issue` table. All the data in the column will be lost.
  - The `status` column on the `Issue` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Market` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Payment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Payout` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Reservation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `type` column on the `Reservation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Station` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `SubMarket` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Vehicle` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `VehiclePictures` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `currency` on the `Market` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "tITemStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "tCurrencyType" AS ENUM ('KES', 'USD', 'ZSD', 'GBP', 'CAD', 'THB');

-- CreateEnum
CREATE TYPE "tReservationStatus" AS ENUM ('COMPLETE', 'ACTIVE', 'UPCOMING', 'CANCELLED', 'OTHER');

-- CreateEnum
CREATE TYPE "tPaymentStatus" AS ENUM ('REQUIRES_PAYMENT_METHOD', 'REQUIRES_CONFIRMATION', 'REQUIRES_ACTION', 'PROCESSING', 'REQUIRES_CAPTURE', 'CANCELLED', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "tPayoutStatus" AS ENUM ('COMPLETE', 'DENIED', 'INCOMPLETE', 'SUCCESS', 'HOLD');

-- CreateEnum
CREATE TYPE "tVehiclePicture" AS ENUM ('ACTIVE', 'NONACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "tBookingStatus" AS ENUM ('ACTIVE', 'NONACTIVE', 'CANCELLED', 'PENDING');

-- CreateEnum
CREATE TYPE "tAuthCodeStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED', 'NONACTIVE');

-- CreateEnum
CREATE TYPE "tIssueStatus" AS ENUM ('RESOLVED', 'PENDING', 'DUPLICATE');

-- CreateEnum
CREATE TYPE "tReservationType" AS ENUM ('HOURLY', 'DAILY', 'BLOCK', 'HOST');

-- DropForeignKey
ALTER TABLE "Issue" DROP CONSTRAINT "Issue_market_id_fkey";

-- AlterTable
ALTER TABLE "AuthCode" DROP COLUMN "status",
ADD COLUMN     "status" "tAuthCodeStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "DriverCredentials" DROP COLUMN "status",
ADD COLUMN     "status" "tITemStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Issue" DROP COLUMN "market_id",
ADD COLUMN     "marketId" UUID,
ADD COLUMN     "reservation_id" UUID,
DROP COLUMN "status",
ADD COLUMN     "status" "tIssueStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Market" DROP COLUMN "currency",
ADD COLUMN     "currency" "tCurrencyType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "tITemStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "status",
ADD COLUMN     "status" "tPaymentStatus" NOT NULL DEFAULT 'SUCCEEDED';

-- AlterTable
ALTER TABLE "Payout" DROP COLUMN "status",
ADD COLUMN     "status" "tPayoutStatus" NOT NULL DEFAULT 'INCOMPLETE';

-- AlterTable
ALTER TABLE "Reservation" DROP COLUMN "status",
ADD COLUMN     "status" "tReservationStatus" NOT NULL DEFAULT 'UPCOMING',
DROP COLUMN "type",
ADD COLUMN     "type" "tReservationType" NOT NULL DEFAULT 'HOURLY';

-- AlterTable
ALTER TABLE "Station" DROP COLUMN "status",
ADD COLUMN     "status" "tITemStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "SubMarket" DROP COLUMN "status",
ADD COLUMN     "status" "tITemStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "status",
ADD COLUMN     "status" "tITemStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "VehiclePictures" DROP COLUMN "status",
ADD COLUMN     "status" "tVehiclePicture" NOT NULL DEFAULT 'ACTIVE';

-- DropEnum
DROP TYPE "AuthCodeStatus";

-- DropEnum
DROP TYPE "BookingStatus";

-- DropEnum
DROP TYPE "CurrencyType";

-- DropEnum
DROP TYPE "ITemStatus";

-- DropEnum
DROP TYPE "IssueStatus";

-- DropEnum
DROP TYPE "PaymentStatus";

-- DropEnum
DROP TYPE "PayoutStatus";

-- DropEnum
DROP TYPE "ReservationStatus";

-- DropEnum
DROP TYPE "ReservationType";

-- DropEnum
DROP TYPE "VehiclePicture";

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "Market"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "Reservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
