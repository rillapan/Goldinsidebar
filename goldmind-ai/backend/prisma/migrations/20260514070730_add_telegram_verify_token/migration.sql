/*
  Warnings:

  - A unique constraint covering the columns `[telegram_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[telegram_verify_token]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "telegram_connected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "telegram_settings" JSONB,
ADD COLUMN     "telegram_username" TEXT,
ADD COLUMN     "telegram_verify_token" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_id_key" ON "users"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_verify_token_key" ON "users"("telegram_verify_token");
