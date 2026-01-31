/**
 * Admin Newsletter Subscribers API
 *
 * GET /api/admin/newsletter/subscribers – List subscribers with filters and pagination
 *
 * ADMIN ONLY – same auth as voice-consents (Clerk metadata + admin emails).
 */

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import connectMongo from "@/libs/mongoose";
import NewsletterSubscriber from "@/models/NewsletterSubscriber";

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

/**
 * GET – List subscribers
 * Query: search, status (all|subscribed|unsubscribed|bounced|complained), page, limit, sortBy, sortOrder
 */
export async function GET(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!(await isAdmin(userId))) {
      return NextResponse.json({ error: "Forbidden – Admin required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const status = searchParams.get("status") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    await connectMongo();

    const query = {};

    if (status === "subscribed") {
      query.unsubscribed_at = null;
      query.bounced_at = null;
      query.complaint_at = null;
    } else if (status === "unsubscribed") {
      query.unsubscribed_at = { $ne: null };
    } else if (status === "bounced") {
      query.bounced_at = { $ne: null };
    } else if (status === "complained") {
      query.complaint_at = { $ne: null };
    }

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ];
    }

    const total = await NewsletterSubscriber.countDocuments(query);
    const sortField = sortBy === "email" ? "email" : sortBy === "name" ? "name" : sortBy;
    const sortOpt = sortOrder === "asc" ? 1 : -1;

    const subscribers = await NewsletterSubscriber.find(query)
      .sort({ [sortField]: sortOpt })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const stats = await getStats();

    return NextResponse.json({
      success: true,
      data: subscribers.map((s) => ({
        id: s._id.toString(),
        email: s.email,
        name: s.name ?? null,
        user_id: s.user_id ?? null,
        source: s.source,
        onboarding_enrolled_at: s.onboarding_enrolled_at,
        onboarding_step: s.onboarding_step,
        onboarding_next_send_at: s.onboarding_next_send_at,
        unsubscribed_at: s.unsubscribed_at,
        bounced_at: s.bounced_at,
        complaint_at: s.complaint_at,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
      stats,
      filters: { search, status, sortBy, sortOrder },
    });
  } catch (e) {
    console.error("[Admin newsletter subscribers]", e);
    return NextResponse.json(
      { error: "Failed to fetch subscribers", details: e.message },
      { status: 500 }
    );
  }
}

async function getStats() {
  const [total, subscribed, unsubscribed, inOnboarding, completedOnboarding] = await Promise.all([
    NewsletterSubscriber.countDocuments({}),
    NewsletterSubscriber.countDocuments({
      unsubscribed_at: null,
      bounced_at: null,
      complaint_at: null,
    }),
    NewsletterSubscriber.countDocuments({ unsubscribed_at: { $ne: null } }),
    NewsletterSubscriber.countDocuments({
      onboarding_enrolled_at: { $ne: null },
      onboarding_step: { $gte: 1, $lt: 6 },
      unsubscribed_at: null,
      bounced_at: null,
      complaint_at: null,
    }),
    NewsletterSubscriber.countDocuments({
      onboarding_step: 6,
      unsubscribed_at: null,
    }),
  ]);

  return {
    total,
    subscribed,
    unsubscribed,
    inOnboarding,
    completedOnboarding,
  };
}
