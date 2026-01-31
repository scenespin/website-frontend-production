import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";
import { getUnsubscribeUrl } from "@/libs/newsletterToken";
import {
  sendOnboardingEmail,
  ONBOARDING_DELAYS_DAYS,
} from "@/libs/onboardingEmails";

const SOURCES = ["lead_form", "signup", "contact", "manual"];

/**
 * POST /api/newsletter/subscribe
 *
 * Create or update a newsletter subscriber. Optionally enroll in onboarding and send Email 1 (welcome).
 * Additive only: does not modify Lead or auth. Plan: docs/NEWSLETTER_AND_ONBOARDING_EMAIL_PLAN.md §2.2, §5b.
 *
 * Body: { email: string, name?: string, user_id?: string, source: 'lead_form'|'signup'|'contact'|'manual', enrollOnboarding?: boolean }
 * - enrollOnboarding: if true (default for new subscribers), enroll in 6-email onboarding and send welcome.
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const name = typeof body.name === "string" ? body.name.trim() || null : null;
    const user_id = typeof body.user_id === "string" ? body.user_id.trim() || null : null;
    const source = SOURCES.includes(body.source) ? body.source : null;
    const enrollOnboarding = body.enrollOnboarding !== false;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }
    if (!source) {
      return NextResponse.json(
        { error: "source is required (lead_form, signup, contact, or manual)" },
        { status: 400 }
      );
    }

    await connectMongo();

    let subscriber = await NewsletterSubscriber.findOne({ email });

    if (subscriber) {
      // Update name / user_id / source if provided; do not overwrite with null unless explicitly merging
      const updates = {};
      if (name !== undefined) updates.name = name;
      if (user_id !== undefined) updates.user_id = user_id;
      if (source) updates.source = source;
      if (Object.keys(updates).length) {
        await NewsletterSubscriber.updateOne({ email }, { $set: updates });
        subscriber = await NewsletterSubscriber.findOne({ email });
      }

      // Already in onboarding: do not restart
      if (subscriber.onboarding_enrolled_at && subscriber.onboarding_step >= 1) {
        return NextResponse.json({ subscribed: true, alreadyEnrolled: true });
      }

      // Not in onboarding yet: enroll and send Email 1
      if (enrollOnboarding) {
        const now = new Date();
        const nextSendAt = new Date(now);
        nextSendAt.setDate(nextSendAt.getDate() + ONBOARDING_DELAYS_DAYS[1]);

        const unsubscribeUrl = getUnsubscribeUrl(email, process.env.NEXT_PUBLIC_SITE_URL);
        const idempotencyKey = `${email}-step-1`;
        const sendResult = await sendOnboardingEmail({
          step: 1,
          toEmail: email,
          toName: subscriber.name || name,
          unsubscribeUrl,
          idempotencyKey,
        });

        await NewsletterSubscriber.updateOne(
          { email },
          {
            $set: {
              onboarding_enrolled_at: subscriber.onboarding_enrolled_at || now,
              onboarding_step: 1,
              onboarding_next_send_at: nextSendAt,
            },
          }
        );

        return NextResponse.json({
          subscribed: true,
          welcomeSent: sendResult.ok,
        });
      }

      return NextResponse.json({ subscribed: true });
    }

    // New subscriber
    const now = new Date();
    let onboarding_enrolled_at = null;
    let onboarding_step = 0;
    let onboarding_next_send_at = null;

    if (enrollOnboarding) {
      const unsubscribeUrl = getUnsubscribeUrl(email, process.env.NEXT_PUBLIC_SITE_URL);
      const idempotencyKey = `${email}-step-1`;
      const sendResult = await sendOnboardingEmail({
        step: 1,
        toEmail: email,
        toName: name,
        unsubscribeUrl,
        idempotencyKey,
      });

      onboarding_enrolled_at = now;
      onboarding_step = 1;
      const nextSend = new Date(now);
      nextSend.setDate(nextSend.getDate() + ONBOARDING_DELAYS_DAYS[1]);
      onboarding_next_send_at = nextSend;

      await NewsletterSubscriber.create({
        email,
        name,
        user_id,
        source,
        onboarding_enrolled_at,
        onboarding_step,
        onboarding_next_send_at,
      });

      return NextResponse.json({
        subscribed: true,
        welcomeSent: sendResult.ok,
      });
    }

    await NewsletterSubscriber.create({
      email,
      name,
      user_id,
      source,
    });

    return NextResponse.json({ subscribed: true });
  } catch (e) {
    console.error("[Newsletter] subscribe error:", e);
    return NextResponse.json(
      { error: e.message || "Subscription failed" },
      { status: 500 }
    );
  }
}
