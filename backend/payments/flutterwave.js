import { timingSafeEqual } from "node:crypto";

const apiBaseUrl = "https://api.flutterwave.com/v3";

export function normalizeRwandaMobileMoneyPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  const nationalNumber = digits.startsWith("250")
    ? digits.slice(3)
    : digits.startsWith("0") ? digits.slice(1) : digits;
  return /^7\d{8}$/.test(nationalNumber) ? `+250${nationalNumber}` : null;
}

export function verifyWebhookSignature(signature, secret) {
  const received = Buffer.from(String(signature || ""));
  const expected = Buffer.from(String(secret || ""));
  return received.length > 0 && received.length === expected.length && timingSafeEqual(received, expected);
}

export async function initializeFlutterwavePayment({
  order,
  customer,
  callbackUrl,
  secretKey,
  currency = "USD",
  fetchImpl = fetch
}) {
  if (!secretKey) throw new Error("FLW_SECRET_KEY is required to accept Flutterwave payments.");
  const response = await fetchImpl(`${apiBaseUrl}/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      tx_ref: order.orderNumber,
      amount: Number(order.total),
      currency,
      redirect_url: callbackUrl,
      customer: {
        email: customer.email,
        name: customer.name,
        phonenumber: customer.phone || undefined
      },
      customizations: {
        title: "Shop Eazy",
        description: `Payment for order ${order.orderNumber}`
      },
      meta: { orderId: Number(order.id) }
    })
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.status !== "success" || !result.data?.link) {
    throw new Error("Flutterwave could not initialize the payment.");
  }
  return result.data.link;
}

export async function initializeRwandaMobileMoneyPayment({
  order,
  customer,
  phoneNumber,
  provider,
  amountRwf,
  secretKey,
  fetchImpl = fetch
}) {
  if (!secretKey) throw new Error("FLW_SECRET_KEY is required to accept Flutterwave payments.");
  if (!Number.isInteger(amountRwf) || amountRwf < 1) throw new Error("A valid RWF payment amount is required.");
  const response = await fetchImpl(`${apiBaseUrl}/charges?type=mobile_money_rwanda`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      tx_ref: order.orderNumber,
      order_id: String(order.id),
      amount: amountRwf,
      currency: "RWF",
      email: customer.email,
      phone_number: phoneNumber,
      fullname: customer.name,
      meta: { orderId: Number(order.id), provider }
    })
  });
  const result = await response.json().catch(() => null);
  const redirectUrl = result?.meta?.authorization?.redirect;
  if (!response.ok || result?.status !== "success" || !redirectUrl) {
    throw new Error("Flutterwave could not initialize the Rwanda Mobile Money payment.");
  }
  return redirectUrl;
}

export async function verifyFlutterwaveTransaction({
  transactionId,
  orderNumber,
  amount,
  currency = "USD",
  secretKey,
  fetchImpl = fetch
}) {
  if (!secretKey) throw new Error("FLW_SECRET_KEY is required to verify Flutterwave payments.");
  if (!transactionId) return false;
  const response = await fetchImpl(`${apiBaseUrl}/transactions/${encodeURIComponent(transactionId)}/verify`, {
    headers: { Authorization: `Bearer ${secretKey}` }
  });
  const result = await response.json().catch(() => null);
  const transaction = result?.data;
  return Boolean(
    response.ok &&
    result?.status === "success" &&
    transaction?.status === "successful" &&
    transaction?.tx_ref === orderNumber &&
    String(transaction?.currency || "").toUpperCase() === String(currency).toUpperCase() &&
    Number(transaction?.amount) >= Number(amount)
  );
}