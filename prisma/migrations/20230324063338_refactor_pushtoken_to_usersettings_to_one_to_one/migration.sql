/*
  Warnings:

  - You are about to drop the `PushTokens` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PushTokens" DROP CONSTRAINT "PushTokens_user_settings_id_fkey";

-- DropTable
DROP TABLE "PushTokens";

-- CreateTable
CREATE TABLE "PushToken" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "user_settings_id" UUID NOT NULL,

    CONSTRAINT "PushToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PushToken_token_key" ON "PushToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PushToken_user_settings_id_key" ON "PushToken"("user_settings_id");

-- AddForeignKey
ALTER TABLE "PushToken" ADD CONSTRAINT "PushToken_user_settings_id_fkey" FOREIGN KEY ("user_settings_id") REFERENCES "UserSettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
