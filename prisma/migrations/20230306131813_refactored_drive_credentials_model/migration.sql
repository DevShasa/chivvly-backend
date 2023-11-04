-- AlterTable
ALTER TABLE "DriverCredentials" ADD COLUMN     "driver_licence_expiry" TIMESTAMP(3),
ALTER COLUMN "drivers_licence_front" DROP NOT NULL,
ALTER COLUMN "drivers_licence_back" DROP NOT NULL;
