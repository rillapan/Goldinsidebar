-- CreateEnum
CREATE TYPE "JournalResult" AS ENUM ('WIN', 'LOSS', 'BE');

-- CreateTable
CREATE TABLE "trading_journals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "instrument" TEXT NOT NULL DEFAULT 'XAUUSD',
    "lot_size" DOUBLE PRECISION NOT NULL,
    "entry_price" DOUBLE PRECISION NOT NULL,
    "take_profit" DOUBLE PRECISION,
    "stop_loss" DOUBLE PRECISION,
    "result" "JournalResult" NOT NULL,
    "pnl_usd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "trade_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trading_journals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trading_journals_user_id_idx" ON "trading_journals"("user_id");

-- CreateIndex
CREATE INDEX "trading_journals_trade_date_idx" ON "trading_journals"("trade_date");

-- AddForeignKey
ALTER TABLE "trading_journals" ADD CONSTRAINT "trading_journals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
