-- DropForeignKey
ALTER TABLE "Invitation" DROP CONSTRAINT "Invitation_sender_id_fkey";

-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "sender_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
