-- CreateTable
CREATE TABLE "Inspection" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "reservation_id" UUID NOT NULL,
    "questions" JSONB,
    "fuel" DOUBLE PRECISION DEFAULT 0,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Inspection_reservation_id_key" ON "Inspection"("reservation_id");

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
