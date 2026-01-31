/**
 * Admin Newsletter → Resend sync
 *
 * POST /api/admin/newsletter/sync-resend
 *
 * Pushes NewsletterSubscriber list to Resend so you can use Resend Dashboard Broadcasts
 * with the same list. Gets or creates an audience "Wryda Newsletter", then creates/updates
 * contacts for each subscriber. ADMIN ONLY.
 *
 * Optional env: RESEND_AUDIENCE_ID – if set, use this audience; otherwise get or create
 * one named "Wryda Newsletter".
 */

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Resend } from "resend";
import connectMongo from "@/libs/mongoose";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";

const RESEND_AUDIENCE_NAME = "Wryda Newsletter";
const BATCH_SIZE = 30;
const DELAY_MS = 150;

async function isAdmin(userId) {
  const user = await currentUser();
  if (
    user?.publicMetadata?.isAdmin === true ||
    user?.publicMetadata?.isAdmin === "true" ||
    user?.publicMetadata?.role === "admin"
  ) {
    return true;
  }
  const adminEmails = ["jeff@gardensc.com"];
  if (user?.emailAddresses?.[0]?.emailAddress) {
    if (adminEmails.includes(user.emailAddresses[0].emailAddress)) return true;
  }
  return false;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseName(name) {
  if (!name || typeof name !== "string") return { firstName: undefined, lastName: undefined };
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return { firstName: parts[0] || undefined, lastName: undefined };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(await isAdmin(userId))) {
      return NextResponse.json({ error: "Forbidden – Admin required" }, { status: 403 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY not set" },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);
    let audienceId = process.env.RESEND_AUDIENCE_ID;

    if (!audienceId) {
      const { data: listData } = await resend.audiences.list();
      const audiences = listData?.data ?? [];
      const existing = audiences.find((a) => a.name === RESEND_AUDIENCE_NAME);
      if (existing) {
        audienceId = existing.id;
      } else {
        const { data: createData, error: createErr } = await resend.audiences.create({
          name: RESEND_AUDIENCE_NAME,
        });
        if (createErr || !createData?.id) {
          console.error("[Sync Resend] Create audience failed:", createErr || createData);
          return NextResponse.json(
            { error: "Failed to create Resend audience", details: createErr?.message },
            { status: 500 }
          );
        }
        audienceId = createData.id;
      }
    }

    await connectMongo();
    const subscribers = await NewsletterSubscriber.find({})
      .select("email name unsubscribed_at")
      .lean();

    let synced = 0;
    const errors = [];

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);
      for (const sub of batch) {
        const { firstName, lastName } = parseName(sub.name);
        const { error } = await resend.contacts.create({
          audienceId,
          email: sub.email,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          unsubscribed: !!sub.unsubscribed_at,
        });
        if (error) {
          errors.push({ email: sub.email, message: error.message });
          continue;
        }
        synced++;
      }
      if (i + BATCH_SIZE < subscribers.length) {
        await sleep(DELAY_MS);
      }
    }

    return NextResponse.json({
      success: true,
      synced,
      total: subscribers.length,
      audienceId,
      errors: errors.length ? errors.slice(0, 20) : undefined,
      errorCount: errors.length,
    });
  } catch (e) {
    console.error("[Sync Resend]", e);
    return NextResponse.json(
      { error: "Sync failed", details: e.message },
      { status: 500 }
    );
  }
}
