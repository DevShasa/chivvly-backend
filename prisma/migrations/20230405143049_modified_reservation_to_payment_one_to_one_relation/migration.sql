/*
  Warnings:

  - A unique constraint covering the columns `[payment_id]` on the table `Reservation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Reservation_payment_id_key" ON "Reservation"("payment_id");
