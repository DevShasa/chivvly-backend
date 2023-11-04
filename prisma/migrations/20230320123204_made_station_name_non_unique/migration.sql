-- DropIndex
DROP INDEX "Station_name_key";

-- AlterTable
ALTER TABLE "Station" ADD COLUMN     "latitude" TEXT,
ADD COLUMN     "longitude" TEXT;
