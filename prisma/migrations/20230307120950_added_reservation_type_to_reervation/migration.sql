-- CreateEnum
CREATE TYPE "ReservationType" AS ENUM ('HOURLY', 'DAILY', 'BLOCK', 'HOST');

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "type" "ReservationType" NOT NULL DEFAULT 'HOURLY';
