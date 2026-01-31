#!/usr/bin/env node
/**
 * Trigger the onboarding-drip cron manually (for testing drip emails without waiting for Vercel Cron).
 *
 * Prereqs:
 * - Server running at BASE_URL
 * - CRON_SECRET must match the server
 *
 * Run from website-frontend-production:
 *   CRON_SECRET=xxx BASE_URL=http://localhost:3000 node scripts/trigger-onboarding-drip.js
 *   CRON_SECRET=xxx BASE_URL=https://wryda.ai node scripts/trigger-onboarding-drip.js
 *
 * Use after subscribing a test address (e.g. with newsletter-api-test.js SUBSCRIBE_ONLY=1).
 * To receive drip #2 immediately, set the subscriber's onboarding_next_send_at to now in MongoDB,
 * or wait until the delay from welcome email has passed; then run this script.
 */

const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const CRON_SECRET = process.env.CRON_SECRET;

async function main() {
  if (!CRON_SECRET) {
    console.error("CRON_SECRET is required");
    process.exit(1);
  }

  const url = `${BASE_URL}/api/cron/onboarding-drip`;
  console.log("POST", url, "(onboarding-drip cron)");

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${CRON_SECRET}` },
  });

  const json = await res.json();

  if (!res.ok) {
    console.error("❌ Cron failed:", res.status, json);
    process.exit(1);
  }

  console.log("✅ Cron 200", json);
  if (json.sent > 0) {
    console.log("  Emails sent:", json.sent, "| Due:", json.due);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
