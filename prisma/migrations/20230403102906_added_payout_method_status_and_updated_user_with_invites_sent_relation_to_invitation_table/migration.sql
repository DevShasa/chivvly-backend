/*
  Warnings:

  - Added the required column `sender_id` to the `Invitation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "sender_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "PayoutMethod" ADD COLUMN     "status" "tITemStatus" NOT NULL DEFAULT 'ACTIVE';

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
