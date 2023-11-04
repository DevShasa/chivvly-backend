-- CreateEnum
CREATE TYPE "IssueStatus" AS ENUM ('RESOLVED', 'PENDING', 'DUPLICATE');

-- DropIndex
DROP INDEX "User_phone_key";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "phone" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Issue" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "market_id" UUID NOT NULL,
    "status" "IssueStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_market_id_fkey" FOREIGN KEY ("market_id") REFERENCES "Market"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
