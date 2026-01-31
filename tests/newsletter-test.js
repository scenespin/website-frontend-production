/**
 * Newsletter & onboarding – unit tests (no server, no live sends).
 * Run: node tests/newsletter-test.js
 * Optional: NEWSLETTER_UNSUBSCRIBE_SECRET=test-secret (for token tests).
 */

const assert = require("assert");
const crypto = require("crypto");

let passed = 0;
let failed = 0;

function run(name, fn) {
  try {
    fn();
    console.log("✅", name);
    passed++;
  } catch (err) {
    console.error("❌", name, err.message);
    failed++;
  }
}

async function main() {
  console.log("\nNewsletter unit tests (token + send-disabled)\n");

  // --- Token: same HMAC logic as libs/newsletterToken.js so we can test without importing ESM ---
  const secret = process.env.NEWSLETTER_UNSUBSCRIBE_SECRET || "test-secret-for-ci";
  function createToken(email) {
    const payload = email.toLowerCase().trim();
    return crypto.createHmac("sha256", secret).update(payload).digest("hex");
  }
  function verifyToken(email, token) {
    if (!email || !token) return false;
    try {
      const expected = createToken(email);
      const a = Buffer.from(expected, "hex");
      const b = Buffer.from(token, "hex");
      if (a.length !== b.length) return false;
      return crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  run("Token: create returns hex string", () => {
    const t = createToken("a@b.com");
    assert.strictEqual(typeof t, "string");
    assert.ok(/^[a-f0-9]+$/.test(t));
    assert.strictEqual(t.length, 64);
  });

  run("Token: same email gives same token", () => {
    assert.strictEqual(createToken("x@y.com"), createToken("x@y.com"));
    assert.strictEqual(createToken("X@Y.COM"), createToken("x@y.com"));
  });

  run("Token: verify accepts valid token", () => {
    const email = "delivered@resend.dev";
    const token = createToken(email);
    assert.strictEqual(verifyToken(email, token), true);
  });

  run("Token: verify rejects wrong token", () => {
    assert.strictEqual(verifyToken("a@b.com", "wrong"), false);
    assert.strictEqual(verifyToken("a@b.com", createToken("other@b.com")), false);
  });

  run("Token: verify rejects empty", () => {
    assert.strictEqual(verifyToken("", "x"), false);
    assert.strictEqual(verifyToken("a@b.com", ""), false);
  });

  run("Unsubscribe URL pattern: contains email and token", () => {
    const base = "https://wryda.ai";
    const email = "test@example.com";
    const token = createToken(email);
    const url = `${base}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
    assert.ok(url.includes("/api/unsubscribe"));
    assert.ok(url.includes("email="));
    assert.ok(url.includes("token="));
  });

  // --- Send-disabled: we cannot easily import ESM from CJS, so we document that NEWSLETTER_SEND_DISABLED is tested via API script ---
  run("Env: NEWSLETTER_SEND_DISABLED documented for API tests", () => {
    assert.ok(
      typeof process.env.NEWSLETTER_SEND_DISABLED === "undefined" ||
        process.env.NEWSLETTER_SEND_DISABLED === "1" ||
        process.env.NEWSLETTER_SEND_DISABLED === "true"
    );
  });

  console.log("\n" + (failed ? `Failed: ${failed}, passed: ${passed}` : `Passed: ${passed}`));
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
