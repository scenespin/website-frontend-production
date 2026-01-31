import crypto from "crypto";

const ALGORITHM = "sha256";
const TOKEN_BYTES = 16;

/**
 * Create a signed token for one-click unsubscribe links.
 * Used in onboarding/newsletter emails. Verify with verifyUnsubscribeToken.
 *
 * @param {string} email - Subscriber email (lowercase)
 * @returns {string} Hex-encoded token
 */
export function createUnsubscribeToken(email) {
  const secret = process.env.NEWSLETTER_UNSUBSCRIBE_SECRET;
  if (!secret) {
    throw new Error("NEWSLETTER_UNSUBSCRIBE_SECRET is required for unsubscribe links");
  }
  const payload = email.toLowerCase().trim();
  const hmac = crypto.createHmac(ALGORITHM, secret);
  hmac.update(payload);
  return hmac.digest("hex");
}

/**
 * Verify an unsubscribe token for the given email.
 * Constant-time comparison to avoid timing attacks.
 *
 * @param {string} email - Subscriber email (lowercase)
 * @param {string} token - Token from query string
 * @returns {boolean}
 */
export function verifyUnsubscribeToken(email, token) {
  const secret = process.env.NEWSLETTER_UNSUBSCRIBE_SECRET;
  if (!secret || !email || !token) return false;
  try {
    const expected = createUnsubscribeToken(email);
    const expectedBuf = Buffer.from(expected, "hex");
    const tokenBuf = Buffer.from(token, "hex");
    if (expectedBuf.length !== tokenBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, tokenBuf);
  } catch {
    return false;
  }
}

/**
 * Build the full one-click unsubscribe URL for a subscriber.
 * Points to /api/unsubscribe so the API verifies the token, sets unsubscribed_at, then redirects to /unsubscribe?done=1.
 *
 * @param {string} email - Subscriber email
 * @param {string} baseUrl - e.g. process.env.NEXT_PUBLIC_SITE_URL || 'https://wryda.ai'
 * @returns {string}
 */
export function getUnsubscribeUrl(email, baseUrl) {
  const base = (baseUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://wryda.ai").replace(
    /\/$/,
    ""
  );
  const token = createUnsubscribeToken(email);
  const encodedEmail = encodeURIComponent(email.toLowerCase().trim());
  return `${base}/api/unsubscribe?email=${encodedEmail}&token=${token}`;
}
