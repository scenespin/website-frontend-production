#!/usr/bin/env node
/**
 * Newsletter API integration test (subscribe, unsubscribe, cron).
 * No live sends if server has NEWSLETTER_SEND_DISABLED=1; or use delivered@resend.dev (Resend test address).
 *
 * Prereqs:
 * - Server running (e.g. npm run dev) at BASE_URL
 * - Env: NEWSLETTER_UNSUBSCRIBE_SECRET (same as server), CRON_SECRET (same as server)
 *
 * Run from website-frontend-production:
 *   npm run test:newsletter:api
 *   BASE_URL=http://localhost:3000 NEWSLETTER_UNSUBSCRIBE_SECRET=... CRON_SECRET=... node scripts/newsletter-api-test.js
 *
 * Subscribe-only (test email delivery to Resend):
 *   SUBSCRIBE_ONLY=1 BASE_URL=https://wryda.ai NEWSLETTER_TEST_EMAIL=delivered@resend.dev node scripts/newsletter-api-test.js
 * Then check Resend dashboard for the welcome email to delivered@resend.dev.
 *
 * Backend validation tests only (no subscribe/unsub/cron that need DB):
 *   VALIDATION_ONLY=1 BASE_URL=http://localhost:3000 node scripts/newsletter-api-test.js
 */

const crypto = require("crypto");

const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const SECRET = process.env.NEWSLETTER_UNSUBSCRIBE_SECRET;
const CRON_SECRET = process.env.CRON_SECRET;
const SUBSCRIBE_ONLY = process.env.SUBSCRIBE_ONLY === "1" || process.env.SUBSCRIBE_ONLY === "true";
const VALIDATION_ONLY = process.env.VALIDATION_ONLY === "1" || process.env.VALIDATION_ONLY === "true";

function createUnsubscribeToken(email) {
  if (!SECRET) throw new Error("NEWSLETTER_UNSUBSCRIBE_SECRET is required");
  const payload = email.toLowerCase().trim();
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

const TEST_EMAIL = process.env.NEWSLETTER_TEST_EMAIL || "delivered@resend.dev";

async function main() {
  console.log("Newsletter API test");
  console.log("  BASE_URL:", BASE_URL);
  console.log("  TEST_EMAIL:", TEST_EMAIL);
  console.log("  SUBSCRIBE_ONLY:", SUBSCRIBE_ONLY);
  console.log("  VALIDATION_ONLY:", VALIDATION_ONLY);
  console.log("  (Server NEWSLETTER_SEND_DISABLED = no real send; use delivered@resend.dev to test sends)\n");

  let failed = 0;

  // --- Subscribe validation: invalid email → 400 ---
  try {
    const res = await fetch(`${BASE_URL}/api/newsletter/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", source: "manual" }),
    });
    const json = await res.json();
    if (res.status !== 400 || !json.error) {
      console.error("❌ Subscribe invalid email should 400:", res.status, json);
      failed++;
    } else {
      console.log("✅ Subscribe invalid email 400", json.error?.slice?.(0, 40) + "...");
    }
  } catch (e) {
    console.error("❌ Subscribe invalid email request failed:", e.message);
    failed++;
  }

  // --- Subscribe validation: missing source → 400 ---
  try {
    const res = await fetch(`${BASE_URL}/api/newsletter/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "valid@example.com" }),
    });
    const json = await res.json();
    if (res.status !== 400 || !json.error) {
      console.error("❌ Subscribe missing source should 400:", res.status, json);
      failed++;
    } else {
      console.log("✅ Subscribe missing source 400", json.error?.slice?.(0, 40) + "...");
    }
  } catch (e) {
    console.error("❌ Subscribe missing source request failed:", e.message);
    failed++;
  }

  // --- Unsubscribe invalid token → 400 (redirect=0 for JSON) ---
  try {
    const unsubUrl = `${BASE_URL}/api/unsubscribe?email=${encodeURIComponent("nobody@example.com")}&token=invalidhex&redirect=0`;
    const res = await fetch(unsubUrl, { method: "GET", redirect: "manual" });
    const json = res.status === 200 ? await res.json() : null;
    if (res.status !== 400) {
      console.error("❌ Unsubscribe invalid token should 400, got:", res.status, json);
      failed++;
    } else {
      console.log("✅ Unsubscribe invalid token 400");
    }
  } catch (e) {
    console.error("❌ Unsubscribe invalid token request failed:", e.message);
    failed++;
  }

  if (VALIDATION_ONLY) {
    console.log("\n" + (failed ? `Failed: ${failed}` : "All validation tests passed"));
    process.exit(failed ? 1 : 0);
  }

  // --- Subscribe ---
  try {
    const subRes = await fetch(`${BASE_URL}/api/newsletter/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: TEST_EMAIL,
        source: "manual",
        enrollOnboarding: true,
      }),
    });
    const subJson = await subRes.json();
    if (!subRes.ok) {
      console.error("❌ Subscribe failed:", subRes.status, subJson);
      failed++;
    } else {
      console.log("✅ Subscribe 200", subJson);
      if (SUBSCRIBE_ONLY) {
        console.log("\n📧 If sends are enabled, check Resend dashboard for welcome email to", TEST_EMAIL);
        console.log("   (delivered@resend.dev accepts sends but does not deliver to a real mailbox.)");
        process.exit(0);
      }
    }
  } catch (e) {
    console.error("❌ Subscribe request failed:", e.message);
    failed++;
  }

  if (SUBSCRIBE_ONLY) {
    console.log("\n" + (failed ? `Failed: ${failed}` : "Done"));
    process.exit(failed ? 1 : 0);
  }

  // --- Unsubscribe (need same secret as server) ---
  if (!SECRET) {
    console.log("⏭ Skip unsubscribe (NEWSLETTER_UNSUBSCRIBE_SECRET not set)");
  } else {
    try {
      const token = createUnsubscribeToken(TEST_EMAIL);
      const unsubUrl = `${BASE_URL}/api/unsubscribe?email=${encodeURIComponent(TEST_EMAIL)}&token=${token}&redirect=0`;
      const unsubRes = await fetch(unsubUrl, { method: "GET", redirect: "manual" });
      const unsubJson = unsubRes.status === 200 ? await unsubRes.json() : null;
      if (unsubRes.status !== 200 || !unsubJson?.unsubscribed) {
        console.error("❌ Unsubscribe failed:", unsubRes.status, unsubJson);
        failed++;
      } else {
        console.log("✅ Unsubscribe 200", unsubJson);
      }
    } catch (e) {
      console.error("❌ Unsubscribe request failed:", e.message);
      failed++;
    }
  }

  // --- Cron: without auth should 401 ---
  try {
    const cronNoAuth = await fetch(`${BASE_URL}/api/cron/onboarding-drip`, { method: "POST" });
    if (cronNoAuth.status !== 401) {
      console.error("❌ Cron without auth should 401, got:", cronNoAuth.status);
      failed++;
    } else {
      console.log("✅ Cron without auth 401 (correct)");
    }
  } catch (e) {
    console.error("❌ Cron (no auth) request failed:", e.message);
    failed++;
  }

  // --- Cron with secret ---
  if (!CRON_SECRET) {
    console.log("⏭ Skip cron with auth (CRON_SECRET not set)");
  } else {
    try {
      const cronRes = await fetch(`${BASE_URL}/api/cron/onboarding-drip`, {
        method: "POST",
        headers: { Authorization: `Bearer ${CRON_SECRET}` },
      });
      const cronJson = await cronRes.json();
      if (!cronRes.ok) {
        console.error("❌ Cron failed:", cronRes.status, cronJson);
        failed++;
      } else {
        console.log("✅ Cron 200", cronJson);
      }
    } catch (e) {
      console.error("❌ Cron request failed:", e.message);
      failed++;
    }
  }

  console.log("\n" + (failed ? `Failed: ${failed}` : "All passed"));
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
