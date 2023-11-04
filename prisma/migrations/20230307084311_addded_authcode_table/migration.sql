-- CreateTable
CREATE TABLE "AuthCodeTable" (
    "id" TEXT NOT NULL,
    "host_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "status" "AuthCodeStatus" NOT NULL,
    "expiry_date_time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthCodeTable_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AuthCodeTable" ADD CONSTRAINT "AuthCodeTable_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthCodeTable" ADD CONSTRAINT "AuthCodeTable_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
