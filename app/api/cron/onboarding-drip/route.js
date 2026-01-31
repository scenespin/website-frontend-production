/**
 * Onboarding Drip Cron
 *
 * POST /api/cron/onboarding-drip
 *
 * Finds subscribers due for the next onboarding email, sends it with idempotency key, updates step and next_send_at.
 * Plan: docs/NEWSLETTER_AND_ONBOARDING_EMAIL_PLAN.md §5, §6. Security: CRON_SECRET (same as voice-retention-warnings).
 *
 * Schedule: Every hour (vercel.json). Excludes unsubscribed, bounced, complained.
 */

import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";
import { getUnsubscribeUrl } from "@/libs/newsletterToken";
import {
  sendOnboardingEmail,
  ONBOARDING_DELAYS_DAYS,
  MAX_ONBOARDING_STEP,
} from "@/libs/onboardingEmails";

export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("[Onboarding-drip] CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error("[Onboarding-drip] Invalid cron secret");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    const now = new Date();

    const due = await NewsletterSubscriber.find({
      onboarding_enrolled_at: { $ne: null },
      onboarding_step: { $gte: 1, $lt: MAX_ONBOARDING_STEP },
      onboarding_next_send_at: { $lte: now },
      unsubscribed_at: null,
      bounced_at: null,
      complaint_at: null,
    }).lean();

    console.log(`[Onboarding-drip] Found ${due.length} subscribers due for next email`);

    let sent = 0;
    const errors = [];

    for (const sub of due) {
      const nextStep = sub.onboarding_step + 1;
      const idempotencyKey = `${sub._id.toString()}-step-${nextStep}`;
      const unsubscribeUrl = getUnsubscribeUrl(
        sub.email,
        process.env.NEXT_PUBLIC_SITE_URL
      );

      const result = await sendOnboardingEmail({
        step: nextStep,
        toEmail: sub.email,
        toName: sub.name || undefined,
        unsubscribeUrl,
        idempotencyKey,
      });

      if (!result.ok) {
        errors.push({ email: sub.email, step: nextStep, error: result.error });
        continue;
      }

      const delayDays = ONBOARDING_DELAYS_DAYS[nextStep];
      let nextSendAt = null;
      if (delayDays > 0) {
        nextSendAt = new Date(now);
        nextSendAt.setDate(nextSendAt.getDate() + delayDays);
      }

      await NewsletterSubscriber.updateOne(
        { _id: sub._id },
        {
          $set: {
            onboarding_step: nextStep,
            onboarding_next_send_at: nextSendAt,
          },
        }
      );

      sent++;
    }

    return NextResponse.json({
      ok: true,
      due: due.length,
      sent,
      errors: errors.length ? errors : undefined,
    });
  } catch (e) {
    console.error("[Onboarding-drip] error:", e);
    return NextResponse.json(
      { error: e.message || "Cron failed" },
      { status: 500 }
    );
  }
}
