/*
  Warnings:

  - You are about to drop the column `address` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `building_name` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `Vehicle` table. All the data in the column will be lost.
  - The `hourly_rate` column on the `Vehicle` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `currency` to the `Market` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ITemStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_market_id_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_sub_market_id_fkey";

-- AlterTable
ALTER TABLE "Market" ADD COLUMN     "currency" "CurrencyType" NOT NULL,
ADD COLUMN     "status" "ITemStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Station" ADD COLUMN     "status" "ITemStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "SubMarket" ADD COLUMN     "status" "ITemStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "market_id" DROP NOT NULL,
ALTER COLUMN "sub_market_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Vehicle" DROP COLUMN "address",
DROP COLUMN "building_name",
DROP COLUMN "currency",
ADD COLUMN     "status" "ITemStatus" NOT NULL DEFAULT 'ACTIVE',
DROP COLUMN "hourly_rate",
ADD COLUMN     "hourly_rate" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "DriverCredentials" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "drivers_licence_front" TEXT NOT NULL,
    "drivers_licence_back" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL,
    "status" "ITemStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "DriverCredentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DriverCredentials_user_id_key" ON "DriverCredentials"("user_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "Market"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_sub_market_id_fkey" FOREIGN KEY ("sub_market_id") REFERENCES "SubMarket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverCredentials" ADD CONSTRAINT "DriverCredentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
