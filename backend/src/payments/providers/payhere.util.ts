import { createHash } from "crypto";

function hashSecret(secret: string) {
  return createHash("md5").update(secret.trim()).digest("hex").toUpperCase();
}

export function formatPayHereAmount(totalUsd: string, currency: string, lkrRate: number) {
  const usd = Number(totalUsd);
  if (currency === "LKR") {
    return (usd * lkrRate).toFixed(2);
  }
  return usd.toFixed(2);
}

export function createPayHereCheckoutHash(
  merchantId: string,
  orderId: string,
  amount: string,
  currency: string,
  merchantSecret: string
) {
  const hashedSecret = hashSecret(merchantSecret);
  return createHash("md5")
    .update(merchantId.trim() + orderId.trim() + amount + currency.trim() + hashedSecret)
    .digest("hex")
    .toUpperCase();
}

export function verifyPayHereNotification(
  merchantId: string,
  orderId: string,
  amount: string,
  currency: string,
  statusCode: string,
  md5sig: string,
  merchantSecret: string
) {
  const hashedSecret = hashSecret(merchantSecret);
  const localSig = createHash("md5")
    .update(
      merchantId.trim() +
        orderId.trim() +
        amount +
        currency.trim() +
        statusCode +
        hashedSecret
    )
    .digest("hex")
    .toUpperCase();
  return localSig === md5sig;
}
