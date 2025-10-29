/**
 * Admin Voice Consent Management API
 * 
 * GET /api/admin/voice-consents - List all consents with filters
 * 
 * ADMIN ONLY - Requires admin authentication
 * Used for monitoring, compliance reporting, and user support
 */

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs";
import connectMongo from "@/libs/mongoose";
import VoiceConsent from "@/models/VoiceConsent";
import User from "@/models/User";

/**
 * Check if user is admin
 * TODO: Implement proper admin role check based on your auth system
 */
async function isAdmin(userId) {
  // Option 1: Check Clerk metadata
  const user = await currentUser();
  if (user?.publicMetadata?.role === "admin") {
    return true;
  }
  
  // Option 2: Check database (if you have admin flag in User model)
  // const dbUser = await User.findOne({ clerkId: userId });
  // if (dbUser?.isAdmin) return true;
  
  // Option 3: Hardcoded admin emails (temporary, for initial setup)
  const adminEmails = [
    "jeff@gardensc.com",
    // Add more admin emails here
  ];
  
  if (user?.emailAddresses?.[0]?.emailAddress) {
    const email = user.emailAddresses[0].emailAddress;
    if (adminEmails.includes(email)) {
      return true;
    }
  }
  
  return false;
}

/**
 * GET - List all consents with filters and pagination
 * Query params:
 *   - status: 'active' | 'revoked' | 'expired' | 'all' (default: all)
 *   - search: search by name or email
 *   - page: page number (default: 1)
 *   - limit: items per page (default: 50, max: 100)
 *   - sortBy: 'agreedAt' | 'retentionDeadline' | 'voiceOwnerName' (default: agreedAt)
 *   - sortOrder: 'asc' | 'desc' (default: desc)
 */
export async function GET(req) {
  try {
    // Authenticate user
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Check admin status
    const adminStatus = await isAdmin(userId);
    if (!adminStatus) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const sortBy = searchParams.get("sortBy") || "agreedAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    await connectMongo();

    // Build query
    const query = {};

    // Status filter
    if (status === "active") {
      query.revokedAt = null;
      query.deletedAt = null;
      query.retentionDeadline = { $gt: new Date() };
    } else if (status === "revoked") {
      query.revokedAt = { $ne: null };
    } else if (status === "expired") {
      query.deletedAt = null;
      query.retentionDeadline = { $lte: new Date() };
    }

    // Search filter
    if (search) {
      query.$or = [
        { voiceOwnerName: { $regex: search, $options: "i" } },
        { voiceOwnerEmail: { $regex: search, $options: "i" } },
      ];
    }

    // Count total
    const total = await VoiceConsent.countDocuments(query);

    // Get consents with pagination
    const consents = await VoiceConsent.find(query)
      .populate("userId", "name email image")
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Calculate stats
    const stats = await calculateStats();

    return NextResponse.json({
      success: true,
      data: consents.map((consent) => ({
        id: consent._id,
        userId: consent.userId?._id,
        userName: consent.userId?.name,
        userEmail: consent.userId?.email,
        voiceOwnerName: consent.voiceOwnerName,
        voiceOwnerEmail: consent.voiceOwnerEmail,
        consentVersion: consent.consentVersion,
        agreedAt: consent.agreedAt,
        revokedAt: consent.revokedAt,
        deletedAt: consent.deletedAt,
        retentionDeadline: consent.retentionDeadline,
        isSelf: consent.isSelf,
        ipAddress: consent.ipAddress,
        // Calculate virtual properties
        isActive: !consent.revokedAt && !consent.deletedAt && new Date(consent.retentionDeadline) > new Date(),
        daysUntilExpiration: Math.ceil((new Date(consent.retentionDeadline) - new Date()) / (1000 * 60 * 60 * 24)),
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats,
      filters: {
        status,
        search,
        sortBy,
        sortOrder,
      },
    });

  } catch (error) {
    console.error("Admin consent list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch consents", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Calculate dashboard statistics
 */
async function calculateStats() {
  const now = new Date();
  
  const [
    totalActive,
    totalRevoked,
    totalExpired,
    expiringSoon30d,
    expiringSoon7d,
  ] = await Promise.all([
    // Active consents
    VoiceConsent.countDocuments({
      revokedAt: null,
      deletedAt: null,
      retentionDeadline: { $gt: now },
    }),
    // Revoked consents
    VoiceConsent.countDocuments({
      revokedAt: { $ne: null },
    }),
    // Expired consents
    VoiceConsent.countDocuments({
      deletedAt: null,
      retentionDeadline: { $lte: now },
    }),
    // Expiring in 30 days
    VoiceConsent.countDocuments({
      revokedAt: null,
      deletedAt: null,
      retentionDeadline: {
        $gt: now,
        $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
    // Expiring in 7 days
    VoiceConsent.countDocuments({
      revokedAt: null,
      deletedAt: null,
      retentionDeadline: {
        $gt: now,
        $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  return {
    totalActive,
    totalRevoked,
    totalExpired,
    totalAll: totalActive + totalRevoked + totalExpired,
    expiringSoon: {
      within30Days: expiringSoon30d,
      within7Days: expiringSoon7d,
    },
  };
}

