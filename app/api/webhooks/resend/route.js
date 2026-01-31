/**
 * Resend Webhook – bounce and complaint handling
 *
 * POST /api/webhooks/resend
 *
 * Receives Resend webhook events (email.bounced, email.complained). Verifies signature with
 * RESEND_WEBHOOK_SECRET (Svix). Updates NewsletterSubscriber: sets bounced_at or complaint_at
 * so we exclude those addresses from all future sends. Plan: docs/NEWSLETTER_AND_ONBOARDING_EMAIL_PLAN.md §1c.
 *
 * Resend dashboard: Add endpoint URL (e.g. https://wryda.ai/api/webhooks/resend), subscribe to
 * email.bounced and email.complained, copy signing secret to RESEND_WEBHOOK_SECRET.
 */

import { NextResponse } from "next/server";
import { Webhook } from "svix";
import connectMongo from "@/libs/mongoose";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";

export async function POST(req) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Webhooks/Resend] RESEND_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  let payload;
  try {
    const rawBody = await req.text();
    const svixId = req.headers.get("svix-id");
    const svixTimestamp = req.headers.get("svix-timestamp");
    const svixSignature = req.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.warn("[Webhooks/Resend] Missing Svix headers");
      return NextResponse.json({ error: "Missing headers" }, { status: 400 });
    }

    const wh = new Webhook(webhookSecret);
    payload = wh.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (err) {
    console.warn("[Webhooks/Resend] Signature verification failed:", err?.message || err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const type = payload?.type;
  const data = payload?.data;

  if (!type || !data) {
    return NextResponse.json({ received: true });
  }

  // Recipients are in data.to (array of email strings)
  const toEmails = Array.isArray(data.to) ? data.to : data.to ? [data.to] : [];
  if (toEmails.length === 0) {
    return NextResponse.json({ received: true });
  }

  try {
    await connectMongo();

    if (type === "email.bounced") {
      const result = await NewsletterSubscriber.updateMany(
        { email: { $in: toEmails.map((e) => String(e).trim().toLowerCase()) } },
        { $set: { bounced_at: new Date() } }
      );
      if (result.modifiedCount > 0) {
        console.log(`[Webhooks/Resend] Set bounced_at for ${result.modifiedCount} subscriber(s)`);
      }
    } else if (type === "email.complained") {
      const result = await NewsletterSubscriber.updateMany(
        { email: { $in: toEmails.map((e) => String(e).trim().toLowerCase()) } },
        { $set: { complaint_at: new Date() } }
      );
      if (result.modifiedCount > 0) {
        console.log(`[Webhooks/Resend] Set complaint_at for ${result.modifiedCount} subscriber(s)`);
      }
    }
  } catch (err) {
    console.error("[Webhooks/Resend] DB update failed:", err);
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
