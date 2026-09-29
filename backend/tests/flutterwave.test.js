import test from "node:test";
import assert from "node:assert/strict";
import {
  initializeFlutterwavePayment,
  normalizeRwandaMobileMoneyPhone,
  initializeRwandaMobileMoneyPayment,
  verifyFlutterwaveTransaction,
  verifyWebhookSignature
} from "../payments/flutterwave.js";

test("webhook signature comparison rejects missing and mismatched values", () => {
  assert.equal(verifyWebhookSignature("expected-secret", "expected-secret"), true);
  assert.equal(verifyWebhookSignature("wrong-secret", "expected-secret"), false);
  assert.equal(verifyWebhookSignature("", "expected-secret"), false);
});

test("payment initialization returns the hosted checkout URL", async () => {
  let request;
  const link = await initializeFlutterwavePayment({
    order: { id: 12, orderNumber: "SE-ORDER-12", total: 42.5 },
    customer: { name: "Test Buyer", email: "buyer@example.com", phone: "123" },
    callbackUrl: "https://shop.example.com/api/payments/flutterwave/callback",
    secretKey: "test-secret",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => ({ status: "success", data: { link: "https://checkout.flutterwave.com/pay/test" } }) };
    }
  });

  assert.equal(link, "https://checkout.flutterwave.com/pay/test");
  assert.equal(request.url, "https://api.flutterwave.com/v3/payments");
  assert.equal(request.options.headers.Authorization, "Bearer test-secret");
  assert.equal(JSON.parse(request.options.body).tx_ref, "SE-ORDER-12");
});

test("transaction verification checks provider status, reference, currency, and amount", async () => {
  const verified = await verifyFlutterwaveTransaction({
    transactionId: "987",
    orderNumber: "SE-ORDER-12",
    amount: 42.5,
    currency: "USD",
    secretKey: "test-secret",
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        status: "success",
        data: { status: "successful", tx_ref: "SE-ORDER-12", currency: "USD", amount: 42.5 }
      })
    })
  });
  assert.equal(verified, true);

  const mismatched = await verifyFlutterwaveTransaction({
    transactionId: "987",
    orderNumber: "SE-OTHER-ORDER",
    amount: 42.5,
    currency: "USD",
    secretKey: "test-secret",
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        status: "success",
        data: { status: "successful", tx_ref: "SE-ORDER-12", currency: "USD", amount: 42.5 }
      })
    })
  });
  assert.equal(mismatched, false);
});

test("Rwanda mobile money initialization sends an RWF charge and returns its authorization URL", async () => {
  let request;
  const redirect = await initializeRwandaMobileMoneyPayment({
    order: { id: 12, orderNumber: "SE-ORDER-12" },
    customer: { name: "Test Buyer", email: "buyer@example.com" },
    phoneNumber: "+250781234567",
    provider: "MTN Rwanda",
    amountRwf: 55250,
    secretKey: "test-secret",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => ({ status: "success", meta: { authorization: { redirect: "https://flutterwave.example/authorize" } } }) };
    }
  });

  assert.equal(redirect, "https://flutterwave.example/authorize");
  assert.equal(request.url, "https://api.flutterwave.com/v3/charges?type=mobile_money_rwanda");
  assert.equal(request.options.headers.Authorization, "Bearer test-secret");
  assert.deepEqual(JSON.parse(request.options.body), {
    tx_ref: "SE-ORDER-12",
    order_id: "12",
    amount: 55250,
    currency: "RWF",
    email: "buyer@example.com",
    phone_number: "+250781234567",
    fullname: "Test Buyer",
    meta: { orderId: 12, provider: "MTN Rwanda" }
  });
});

test("Rwanda mobile money accepts local and international numbers without assuming the carrier from the prefix", () => {
  assert.equal(normalizeRwandaMobileMoneyPhone("+250795503938"), "+250795503938");
  assert.equal(normalizeRwandaMobileMoneyPhone("078 123 4567"), "+250781234567");
  assert.equal(normalizeRwandaMobileMoneyPhone("+1 555 123 4567"), null);
});