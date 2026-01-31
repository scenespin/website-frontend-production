import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";
import { verifyUnsubscribeToken } from "@/libs/newsletterToken";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://wryda.ai";

/**
 * GET /api/unsubscribe?email=...&token=...
 *
 * One-click unsubscribe: verify token, set unsubscribed_at, redirect to /unsubscribe?done=1.
 * Plan: docs/NEWSLETTER_AND_ONBOARDING_EMAIL_PLAN.md §2.3. Copy: docs/NEWSLETTER_ONBOARDING_FINAL_COPY.md §3.
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const token = searchParams.get("token");
    const redirect = searchParams.get("redirect") !== "0";

    if (!email || !token) {
      const url = `${BASE_URL}/unsubscribe?error=missing`;
      return redirect
        ? NextResponse.redirect(url)
        : NextResponse.json({ error: "Missing email or token" }, { status: 400 });
    }

    const emailNorm = email.trim().toLowerCase();
    if (!verifyUnsubscribeToken(emailNorm, token)) {
      const url = `${BASE_URL}/unsubscribe?error=invalid`;
      return redirect
        ? NextResponse.redirect(url)
        : NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });
    }

    await connectMongo();

    const result = await NewsletterSubscriber.updateOne(
      { email: emailNorm },
      { $set: { unsubscribed_at: new Date() } }
    );

    if (result.matchedCount === 0) {
      const url = `${BASE_URL}/unsubscribe?error=notfound`;
      return redirect
        ? NextResponse.redirect(url)
        : NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }

    const url = `${BASE_URL}/unsubscribe?done=1`;
    if (redirect) {
      return NextResponse.redirect(url);
    }
    return NextResponse.json({ unsubscribed: true });
  } catch (e) {
    console.error("[Unsubscribe] error:", e);
    const url = `${BASE_URL}/unsubscribe?error=server`;
    return NextResponse.redirect(url);
  }
}
