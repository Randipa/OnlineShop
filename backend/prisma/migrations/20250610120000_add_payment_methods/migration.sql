-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('STRIPE', 'PAYHERE', 'BINANCE');

-- AlterTable
ALTER TABLE "Order" RENAME COLUMN "stripePaymentId" TO "paymentId";
ALTER TABLE "Order" ADD COLUMN "paymentMethod" "PaymentMethod";
