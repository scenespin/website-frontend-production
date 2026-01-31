#!/usr/bin/env node
/**
 * Newsletter API integration test (subscribe, unsubscribe, cron).
 * No live sends if server has NEWSLETTER_SEND_DISABLED=1; or use delivered@resend.dev (Resend test address).
 *
 * Prereqs:
 * - Server running (e.g. npm run dev) at BASE_URL
 * - Env: NEWSLETTER_UNSUBSCRIBE_SECRET (same as server), CRON_SECRET (same as server)
 *
 * Run from repo root:
 *   NEWSLETTER_UNSUBSCRIBE_SECRET=your-secret CRON_SECRET=your-cron node scripts/newsletter-api-test.js
 *   BASE_URL=http://localhost:3000 NEWSLETTER_UNSUBSCRIBE_SECRET=... CRON_SECRET=... node scripts/newsletter-api-test.js
 */

const crypto = require("crypto");

const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const SECRET = process.env.NEWSLETTER_UNSUBSCRIBE_SECRET;
const CRON_SECRET = process.env.CRON_SECRET;

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
  console.log("  NEWSLETTER_SEND_DISABLED on server = no real send\n");

  let failed = 0;

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
    }
  } catch (e) {
    console.error("❌ Subscribe request failed:", e.message);
    failed++;
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

  // --- Cron ---
  if (!CRON_SECRET) {
    console.log("⏭ Skip cron (CRON_SECRET not set)");
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
