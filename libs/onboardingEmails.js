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
 * Email 1 – Welcome. Theme: skeleton framework + writer's block. Script-first, preserve + enhance. Create → then visualization in later emails.
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
  <p>Wryda.ai is built around the script first. We preserve the art of screenwriting – your voice, your structure, your format – and only enhance it. In <strong>Create</strong> (the writer area), you write in industry-standard <strong>Fountain</strong> or use our UI; everything stays script-centric.</p>
  <p>Stuck or not sure where to start? The writer area includes a <strong>Story Advisor</strong> and AI agents that can give you a <strong>skeleton framework</strong> – beats, structure, premise – so you're never staring at a blank page. They're there to push you through writer's block and get something down; you stay in control. In the next email we'll walk you through exactly how to use them to get your first scene on the page. After that, we'll focus on visualization and advanced AI – characters, locations, storyboard, and video – all extending from your script.</p>
  <p><strong>First step:</strong> Open your dashboard, then go to <strong>Create</strong>. That's where you write or upload your screenplay. We'll send the next tip with clear steps to get started.</p>
  <p style="margin: 24px 0;"><a href="${BASE_URL}/dashboard" style="display: inline-block; background: #DC143C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Open dashboard</a></p>
  <p style="font-size: 14px; color: #6b7280;"><a href="${BASE_URL}/dashboard">${BASE_URL}/dashboard</a></p>
  ${getEmailFooterHtml(unsubscribeUrl)}
</body>
</html>`;
  },
};

/** Email 2 – Create in depth: skeleton + writer's block theme; thorough instruction using Story Advisor + agents to get first scene */
const EMAIL_2 = {
  subject: "Your first win: one scene on the page",
  buildHtml(name, unsubscribeUrl) {
    const greeting = name ? `Hi ${name},` : "Hi,";
    return `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>${greeting}</p>
  <p>In <strong>Create</strong>, you write or upload your screenplay. We're built for screenwriters: the editor supports <strong>Fountain</strong> (plain-text, industry-standard) and our UI gives you outline and beats. The goal of this email: get one scene on the page – and if you're stuck, use the <strong>Story Advisor</strong> and AI agents as a skeleton framework to push through writer's block. You stay in control; they just give you something to react to and edit.</p>
  <p><strong>How to get started:</strong></p>
  <p>1. Open Create (the editor). Paste in a script, upload a file, or start from scratch.</p>
  <p>2. If you're stuck: try the <strong>Story Advisor</strong> first. It can help with premise, beats, or structure – a skeleton you can build on. Once you have an idea, the <strong>Screenwriter</strong> agent can suggest dialogue or action (select a line or a blank spot, open the agent). <strong>Director</strong> can suggest blocking; <strong>Dialogue</strong> can sharpen character voice. Use them to jump-start a draft – you don't have to keep every suggestion; pick what fits your voice.</p>
  <p>3. Your first win: one short scene. A character in a place, doing something. Even 3–5 lines is enough. If a line feels flat, select it and try <strong>Rewrite</strong> to tighten or change the tone. The script stays yours; we just help it along.</p>
  <p>4. Once you have that scene, we'll cover the full set of agents and then how to add characters and locations (they're tied to Fountain – we'll show you how) and props. After that, visualization and video.</p>
  <p style="margin: 24px 0;"><a href="${BASE_URL}/write" style="display: inline-block; background: #DC143C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Open Create (editor)</a></p>
  <p style="font-size: 14px; color: #6b7280;"><a href="${BASE_URL}/write">${BASE_URL}/write</a> · <a href="${BASE_URL}/help/writing">Help – Writing</a></p>
  ${getEmailFooterHtml(unsubscribeUrl)}
</body></html>`;
  },
};

/** Email 3 – Create continued: 5 AI agents; characters/locations (Fountain + UI); props (UI only); then Produce */
const EMAIL_3 = {
  subject: "You don't have to write alone – 5 AI agents, then Produce",
  buildHtml(name, unsubscribeUrl) {
    const greeting = name ? `Hi ${name},` : "Hi,";
    return `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>${greeting}</p>
  <p>In Create, you don't have to write alone. The editor has 5 AI agents: <strong>Story Advisor</strong>, <strong>Screenwriter</strong>, <strong>Director</strong>, <strong>Dialogue</strong>, and <strong>Rewrite</strong>. Select a line and try Rewrite to tighten or change the tone – it's the fastest way to see how they work. Use Screenwriter for suggestions, Director for blocking, and Dialogue for character voice.</p>
  <p><strong>Characters and locations</strong> – they're tied to Fountain. In Fountain, character names (in dialogue) and scene headings (INT. COFFEE SHOP – DAY) are part of the format. When you write in Fountain and scan (or rescan) the script, characters and locations auto-populate from your script. You can also add or edit them by hand in the UI. Either way, you do it in Create first; they then show up in Produce.</p>
  <p><strong>Props</strong> – Fountain doesn't have a standard for props, so we handle them in the UI. In Create you can add props (assets) by hand – e.g. "red mug," "newspaper." In Produce you can add reference images for them if you like, same as for characters and locations.</p>
  <p>Once you have a scene and your cast, places, and any props set up in Create, the next step is <strong>Produce</strong>. There you add reference images for each character and location (and any props) – those images are what feed into AI image generation and, later, video, so your cast and locations stay consistent in every shot. We'll cover Produce in detail in the next email.</p>
  <p style="margin: 24px 0;"><a href="${BASE_URL}/produce" style="display: inline-block; background: #DC143C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Try an agent, then open Produce</a></p>
  <p style="font-size: 14px; color: #6b7280;"><a href="${BASE_URL}/help/writing">${BASE_URL}/help/writing</a> · <a href="${BASE_URL}/produce">${BASE_URL}/produce</a></p>
  ${getEmailFooterHtml(unsubscribeUrl)}
</body></html>`;
  },
};

/** Email 4 – Produce in depth: characters/locations from Create, reference images, AI images (no video) */
const EMAIL_4 = {
  subject: "Add one character and one location in Produce",
  buildHtml(name, unsubscribeUrl) {
    const greeting = name ? `Hi ${name},` : "Hi,";
    return `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>${greeting}</p>
  <p>As we said, <strong>characters, locations, and props are created in Create</strong> – either by writing them into the script (Fountain) and rescanning so they auto-populate, or by creating them by hand in the UI. They then show up in <strong>Produce</strong>. Produce pulls your script and your cast/places from Create and is where you add <strong>reference images</strong> and generate AI images – the visuals that feed into video later. No video here; video happens in Direct.</p>
  <p>In Produce, use <strong>Character Bank</strong> and locations to add <strong>reference images</strong>. You need a reference image for each character to generate video later – we'll prompt you if one is missing. For locations you can add an image or, if you prefer, opt out and use a description. Add at least one character and one location (e.g. "Coffee shop – daytime") with reference images set here. If your scene needs a prop, add one asset and a reference image if you like. You can also use table reads and audio. One character and one location with reference images are enough to move on to Direct for video.</p>
  <p>This is where your script gets a face and a place for video.</p>
  <p style="margin: 24px 0;"><a href="${BASE_URL}/produce" style="display: inline-block; background: #DC143C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Go to Produce (Character Bank & locations)</a></p>
  <p style="font-size: 14px; color: #6b7280;"><a href="${BASE_URL}/produce">${BASE_URL}/produce</a> · <a href="${BASE_URL}/help/production">Help – Production</a></p>
  ${getEmailFooterHtml(unsubscribeUrl)}
</body></html>`;
  },
};

/** Email 5 – Direct in depth: Scene Builder shot types, storyboard, video generation */
const EMAIL_5 = {
  subject: "Generate your first video in Direct",
  buildHtml(name, unsubscribeUrl) {
    const greeting = name ? `Hi ${name},` : "Hi,";
    return `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>${greeting}</p>
  <p>With a scene from Create and at least one character and location from Produce, you're ready for video. That happens in <strong>Direct</strong> – not in Produce. Produce is for images and assets; Direct is where you storyboard and generate video.</p>
  <p>In Direct, open the <strong>Scene Builder</strong>. That's your storyboard: pick a scene, then configure each shot. You can choose the <strong>type of shot</strong> – e.g. wide shot (establishing), medium shot, close-up, extreme close-up, extreme wide, over-the-shoulder, low angle, high angle, dutch angle – or set it to auto and let the system suggest one. You also set quality and duration (quick-cut vs extended). Then hit Generate. Credits are used per shot; start with a short clip if you like. The first run can take a few minutes; we'll email you when it's ready if you're not on the page.</p>
  <p style="margin: 24px 0;"><a href="${BASE_URL}/direct" style="display: inline-block; background: #DC143C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Open Direct (Scene Builder)</a></p>
  <p style="font-size: 14px; color: #6b7280;"><a href="${BASE_URL}/direct">${BASE_URL}/direct</a> · <a href="${BASE_URL}/help/direct">Help – Direct</a></p>
  ${getEmailFooterHtml(unsubscribeUrl)}
</body></html>`;
  },
};

/** Email 6 – Direct wrap-up: review storyboard, playback, what's next */
const EMAIL_6 = {
  subject: "You're ready – review your shots and what's next",
  buildHtml(name, unsubscribeUrl) {
    const greeting = name ? `Hi ${name},` : "Hi,";
    return `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <p>${greeting}</p>
  <p>You've had a guided tour of <strong>Create</strong> (script) → <strong>Produce</strong> (characters, locations, assets) → <strong>Direct</strong> (Scene Builder and video). You're ready to build at your own pace.</p>
  <p>In Direct, after generation you get a storyboard view: playback, download, and the option to regenerate or tweak a shot and try again. From here you can go deeper – more quality tiers, dialogue and voice, style profiles – or stick to what you've got. We'll occasionally send tips and product updates. If you prefer only important updates, you can unsubscribe below.</p>
  <p style="margin: 24px 0;"><a href="${BASE_URL}/direct" style="display: inline-block; background: #DC143C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Review storyboard in Direct</a></p>
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
