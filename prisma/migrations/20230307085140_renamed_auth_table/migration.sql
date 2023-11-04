/*
  Warnings:

  - You are about to drop the `AuthCodeTable` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AuthCodeTable" DROP CONSTRAINT "AuthCodeTable_host_id_fkey";

-- DropForeignKey
ALTER TABLE "AuthCodeTable" DROP CONSTRAINT "AuthCodeTable_vehicle_id_fkey";

-- DropTable
DROP TABLE "AuthCodeTable";

-- CreateTable
CREATE TABLE "AuthCode" (
    "id" UUID NOT NULL,
    "host_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "status" "AuthCodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiry_date_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthCode_code_key" ON "AuthCode"("code");

-- AddForeignKey
ALTER TABLE "AuthCode" ADD CONSTRAINT "AuthCode_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthCode" ADD CONSTRAINT "AuthCode_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
