/**
 * Onboarding and newsletter email sending.
 * Copy from docs/NEWSLETTER_ONBOARDING_FINAL_COPY.md. Plan: docs/NEWSLETTER_AND_ONBOARDING_EMAIL_PLAN.md §1c, §5.
 *
 * Uses same Resend API key as libs/emailService.js. Additive only – does not modify existing emailService.
 * Idempotency keys and retries per Resend skill for production readiness.
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://wryda.ai";
const FROM_EMAIL = process.env.EMAIL_FROM || "Wryda.ai <noreply@wryda.ai>";

/**
 * Standard footer and legal block for every onboarding/newsletter email (final copy §2).
 * @param {string} unsubscribeUrl - Full one-click unsubscribe URL
 * @returns {string} HTML fragment
 */
export function getEmailFooterHtml(unsubscribeUrl) {
  return `
<p style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
  —<br>
  The Wryda.ai Team<br><br>
  You're receiving this because you signed up or subscribed at wryda.ai.<br>
  <a href="${unsubscribeUrl}">Unsubscribe</a><br><br>
  Garden State Concentrate LLC (DBA: Wryda.ai)<br>
  479 State Rt 17 UNIT 2008, Mahwah, NJ 07430-2116<br>
  <a href="${BASE_URL}/privacy-policy">Privacy</a> | <a href="${BASE_URL}/tos">Terms</a> | Support: support@wryda.ai
</p>`;
}

/**
 * Email 1 – Welcome (final copy §4). Subject: "You're in – here's your first step"
 */
const EMAIL_1 = {
  subject: "You're in – here's your first step",
  buildHtml(name, unsubscribeUrl) {
    const greeting = name ? `Hi ${name},` : "Hi,";
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>${greeting}</p>
  <p>You're in. Thanks for signing up.</p>
  <p>Wryda.ai is the first Integrated Screenwriting Environment: you write a screenplay, then we help you turn it into video with AI.</p>
  <p>Over the next few emails we'll walk you through Write → Produce → Direct, one step at a time. No rush – just one small step per email.</p>
  <p>First step: open your dashboard and get familiar with the editor. When you're ready, we'll send the next tip.</p>
  <p style="margin: 24px 0;"><a href="${BASE_URL}/dashboard" style="display: inline-block; background: #DC143C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Open dashboard</a></p>
  <p style="font-size: 14px; color: #6b7280;"><a href="${BASE_URL}/dashboard">${BASE_URL}/dashboard</a></p>
  ${getEmailFooterHtml(unsubscribeUrl)}
</body>
</html>`;
  },
};

/** Email 2 – First scene (final copy §4) */
const EMAIL_2 = {
  subject: "Your first win: one scene on the page",
  buildHtml(name, unsubscribeUrl) {
    const greeting = name ? `Hi ${name},` : "Hi,";
    return `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>${greeting}</p>
  <p>Your first win is simple: get one scene on the page.</p>
  <p>Everything else – characters, locations, video – builds on the script. So we start there.</p>
  <p>Open the editor and write a short scene: a character in a place, doing something. Even 3–5 lines is enough. If you're stuck, use the Screenwriter agent (in the editor) to suggest dialogue or action.</p>
  <p style="margin: 24px 0;"><a href="${BASE_URL}/write" style="display: inline-block; background: #DC143C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Open the editor</a></p>
  <p style="font-size: 14px; color: #6b7280;"><a href="${BASE_URL}/write">${BASE_URL}/write</a></p>
  ${getEmailFooterHtml(unsubscribeUrl)}
</body></html>`;
  },
};

/** Email 3 – AI agents + Produce (final copy §4) */
const EMAIL_3 = {
  subject: "You don't have to write alone – 5 AI agents + Production",
  buildHtml(name, unsubscribeUrl) {
    const greeting = name ? `Hi ${name},` : "Hi,";
    return `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>${greeting}</p>
  <p>You don't have to write alone. The editor has 5 AI agents: Story Advisor, Screenwriter, Director, Dialogue, and Rewrite. Select a line and try "Rewrite" to tighten or change the tone – it's the fastest way to see how they work.</p>
  <p>Once you have a scene (or a few), the next step is Production. Open Produce and pick a scene. We'll help you add characters and locations so the AI can generate consistent visuals.</p>
  <p style="margin: 24px 0;"><a href="${BASE_URL}/help/writing" style="display: inline-block; background: #DC143C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Try an agent, then open Produce</a></p>
  <p style="font-size: 14px; color: #6b7280;"><a href="${BASE_URL}/help/writing">${BASE_URL}/help/writing</a> · <a href="${BASE_URL}/produce">${BASE_URL}/produce</a></p>
  ${getEmailFooterHtml(unsubscribeUrl)}
</body></html>`;
  },
};

/** Email 4 – First character + location (final copy §4) */
const EMAIL_4 = {
  subject: "Add one character and one location",
  buildHtml(name, unsubscribeUrl) {
    const greeting = name ? `Hi ${name},` : "Hi,";
    return `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>${greeting}</p>
  <p>Characters and locations are the backbone of consistency: the same face and place across shots. Define them once, and the AI keeps them consistent.</p>
  <p>In Produce, use Character Bank to add one character: name, a short description, and (optional) a reference image or generate one with AI. Then add one location – e.g. "Coffee shop – daytime." If your scene needs a prop, add one asset (e.g. "red mug"). You can upload a reference or generate with AI.</p>
  <p>One character and one location are enough to generate your first video.</p>
  <p style="margin: 24px 0;"><a href="${BASE_URL}/produce" style="display: inline-block; background: #DC143C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Go to Character Bank & locations</a></p>
  <p style="font-size: 14px; color: #6b7280;"><a href="${BASE_URL}/produce">${BASE_URL}/produce</a> · <a href="${BASE_URL}/help/production">Help – Production</a></p>
  ${getEmailFooterHtml(unsubscribeUrl)}
</body></html>`;
  },
};

/** Email 5 – First video (final copy §4) */
const EMAIL_5 = {
  subject: "Generate your first video",
  buildHtml(name, unsubscribeUrl) {
    const greeting = name ? `Hi ${name},` : "Hi,";
    return `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>${greeting}</p>
  <p>With a scene, at least one character, and a location, you can generate video.</p>
  <p>In the Scene Builder (Produce), configure the shot – quality, duration – then hit Generate. Credits are used per shot; start with a short clip if you like. The first run can take a few minutes; we'll email you when it's ready if you're not on the page.</p>
  <p style="margin: 24px 0;"><a href="${BASE_URL}/produce" style="display: inline-block; background: #DC143C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Generate one shot</a></p>
  <p style="font-size: 14px; color: #6b7280;"><a href="${BASE_URL}/produce">${BASE_URL}/produce</a></p>
  ${getEmailFooterHtml(unsubscribeUrl)}
</body></html>`;
  },
};

/** Email 6 – Direct + you're ready (final copy §4) */
const EMAIL_6 = {
  subject: "You're ready – review your shots and what's next",
  buildHtml(name, unsubscribeUrl) {
    const greeting = name ? `Hi ${name},` : "Hi,";
    return `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>${greeting}</p>
  <p>You've had a guided tour of Write → Produce → Direct. You're ready to build at your own pace.</p>
  <p>After generation, use Direct to review: storyboard view, playback, download. If a shot isn't right, you can regenerate or tweak the prompt and try again. From here you can go deeper – more quality tiers, dialogue and voice, style profiles – or stick to what you've got. We'll occasionally send tips and product updates. If you prefer only important updates, you can unsubscribe below.</p>
  <p style="margin: 24px 0;"><a href="${BASE_URL}/direct" style="display: inline-block; background: #DC143C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Review storyboard</a></p>
  <p style="font-size: 14px; color: #6b7280;"><a href="${BASE_URL}/direct">${BASE_URL}/direct</a> · <a href="${BASE_URL}/help">Help Center</a> · <a href="${BASE_URL}/help/faq">FAQ</a></p>
  <p>If you get stuck, reply to this email or contact support@wryda.ai. We're here to help.</p>
  ${getEmailFooterHtml(unsubscribeUrl)}
</body></html>`;
  },
};

/** Onboarding step config: subject + buildHtml(name, unsubscribeUrl). */
const ONBOARDING_EMAILS = {
  1: EMAIL_1,
  2: EMAIL_2,
  3: EMAIL_3,
  4: EMAIL_4,
  5: EMAIL_5,
  6: EMAIL_6,
};

/**
 * Send a single onboarding email via Resend with optional idempotency key.
 * Retries once on 5xx. Plan §1c: idempotency keys, retries.
 *
 * @param {{ step: number, toEmail: string, toName?: string, unsubscribeUrl: string, idempotencyKey?: string }}
 * @returns {Promise<{ ok: boolean, id?: string, error?: string }>}
 */
export async function sendOnboardingEmail({
  step,
  toEmail,
  toName,
  unsubscribeUrl,
  idempotencyKey,
}) {
  const config = ONBOARDING_EMAILS[step];
  if (!config) {
    return { ok: false, error: `Unknown step: ${step}` };
  }

  const sendDisabled =
    process.env.NEWSLETTER_SEND_DISABLED === "1" ||
    process.env.NEWSLETTER_SEND_DISABLED === "true";
  if (sendDisabled) {
    console.log("[Onboarding] Send disabled (NEWSLETTER_SEND_DISABLED) – would have sent step", step, "to", toEmail);
    return { ok: true };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.warn("[Onboarding] RESEND_API_KEY not configured – email not sent");
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  const subject = config.subject;
  const html = config.buildHtml(toName || null, unsubscribeUrl);

  const headers = {
    Authorization: `Bearer ${RESEND_API_KEY}`,
    "Content-Type": "application/json",
  };
  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  const body = {
    from: FROM_EMAIL,
    to: [toEmail],
    subject,
    html,
  };

  const maxAttempts = 2;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`[Onboarding] Sent step ${step} to ${toEmail}:`, result.id);
        return { ok: true, id: result.id || undefined };
      }

      const errText = await response.text();
      lastError = errText;
      const isRetryable = response.status >= 500;
      if (isRetryable && attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }
      console.error(`[Onboarding] Resend error (step ${step}):`, response.status, errText);
      return { ok: false, error: errText };
    } catch (err) {
      lastError = err.message;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }
      console.error("[Onboarding] Send failed:", err);
      return { ok: false, error: err.message };
    }
  }

  return { ok: false, error: lastError };
}

/**
 * Delay in days until next email after sending step N. Plan §4b: 0, 1, 2, 4, 7, 14.
 * After step 1 => +1 day, step 2 => +1 day, step 3 => +2 days, step 4 => +3 days, step 5 => +7 days, step 6 => done.
 */
export const ONBOARDING_DELAYS_DAYS = {
  1: 1,
  2: 1,
  3: 2,
  4: 3,
  5: 7,
  6: 0, // completed
};

export const MAX_ONBOARDING_STEP = 6;
