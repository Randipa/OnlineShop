-- Remove BINANCE from PaymentMethod enum
CREATE TYPE "PaymentMethod_new" AS ENUM ('STRIPE', 'PAYHERE');

ALTER TABLE "Order"
  ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new"
  USING ("paymentMethod"::text::"PaymentMethod_new");

DROP TYPE "PaymentMethod";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
