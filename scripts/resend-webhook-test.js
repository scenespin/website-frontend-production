#!/usr/bin/env node
/**
 * Resend webhook integration test – sends a signed email.bounced (or email.complained) event
 * to POST /api/webhooks/resend to verify the handler updates NewsletterSubscriber.
 *
 * Prereqs:
 * - Server running at BASE_URL (local or staging)
 * - RESEND_WEBHOOK_SECRET must match the server (same as in Resend dashboard)
 *
 * Run from website-frontend-production:
 *   RESEND_WEBHOOK_SECRET=whsec_xxx BASE_URL=http://localhost:3000 node scripts/resend-webhook-test.js
 *   RESEND_WEBHOOK_SECRET=whsec_xxx BASE_URL=https://wryda.ai node scripts/resend-webhook-test.js
 *
 * Optional: EVENT=email.complained to test complaint handling instead of bounce.
 */

const { Webhook } = require("svix");

const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;
const EVENT = process.env.EVENT || "email.bounced";
const TEST_EMAIL = process.env.NEWSLETTER_TEST_EMAIL || "delivered@resend.dev";

async function main() {
  if (!WEBHOOK_SECRET) {
    console.error("RESEND_WEBHOOK_SECRET is required");
    process.exit(1);
  }

  const payload = JSON.stringify({
    type: EVENT,
    data: { to: [TEST_EMAIL] },
  });

  const msgId = "msg_test_" + Date.now();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const wh = new Webhook(WEBHOOK_SECRET);
  const signature = wh.sign(msgId, timestamp, payload);

  const url = `${BASE_URL}/api/webhooks/resend`;
  console.log("POST", url, "event:", EVENT, "to:", TEST_EMAIL);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "svix-id": msgId,
      "svix-timestamp": timestamp,
      "svix-signature": signature,
    },
    body: payload,
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    console.error("❌ Webhook failed:", res.status, json);
    process.exit(1);
  }

  if (json.received !== true && json.error) {
    console.error("❌ Unexpected response:", json);
    process.exit(1);
  }

  console.log("✅ Webhook 200", json);
  console.log("  Check DB: subscriber for", TEST_EMAIL, "should have", EVENT === "email.bounced" ? "bounced_at" : "complaint_at", "set.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
