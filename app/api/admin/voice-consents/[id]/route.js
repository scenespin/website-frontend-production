/**
 * Admin Voice Consent Detail & Audit Trail API
 * 
 * GET /api/admin/voice-consents/[id] - Get specific consent with full audit trail
 * 
 * ADMIN ONLY - Requires admin authentication
 * Used for detailed investigation, compliance reporting, and dispute resolution
 */

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs";
import connectMongo from "@/libs/mongoose";
import VoiceConsent from "@/models/VoiceConsent";
import VoiceConsentAuditLog from "@/models/VoiceConsentAuditLog";

/**
 * Check if user is admin
 */
async function isAdmin(userId) {
  const user = await currentUser();
  if (user?.publicMetadata?.role === "admin") {
    return true;
  }
  
  const adminEmails = [
    "jeff@gardensc.com",
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
 * GET - Get detailed consent record with full audit trail
 */
export async function GET(req, { params }) {
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

    const { id } = params;

    await connectMongo();

    // Get consent record
    const consent = await VoiceConsent.findById(id)
      .populate("userId", "name email image customerId priceId hasAccess")
      .lean();

    if (!consent) {
      return NextResponse.json(
        { error: "Consent not found" },
        { status: 404 }
      );
    }

    // Get audit trail
    const auditTrail = await VoiceConsentAuditLog.find({ consentId: id })
      .populate("performedBy", "name email")
      .sort({ performedAt: -1 })
      .lean();

    // Log admin view
    await VoiceConsentAuditLog.logAction({
      consentId: id,
      action: "admin_viewed",
      performedBy: userId,
      performedAt: new Date(),
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      details: {
        viewedBy: userId,
        viewReason: "admin_inspection",
      },
    });

    // Calculate additional metrics
    const isActive = !consent.revokedAt && !consent.deletedAt && new Date(consent.retentionDeadline) > new Date();
    const daysUntilExpiration = Math.ceil((new Date(consent.retentionDeadline) - new Date()) / (1000 * 60 * 60 * 24));
    const daysSinceAgreed = Math.floor((new Date() - new Date(consent.agreedAt)) / (1000 * 60 * 60 * 24));
    
    // Count different action types in audit trail
    const actionCounts = auditTrail.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      consent: {
        id: consent._id,
        // User info
        userId: consent.userId?._id,
        userName: consent.userId?.name,
        userEmail: consent.userId?.email,
        userImage: consent.userId?.image,
        userHasAccess: consent.userId?.hasAccess,
        userPriceId: consent.userId?.priceId,
        // Consent info
        voiceOwnerName: consent.voiceOwnerName,
        voiceOwnerEmail: consent.voiceOwnerEmail,
        consentVersion: consent.consentVersion,
        consentText: consent.consentText,
        // Dates
        agreedAt: consent.agreedAt,
        revokedAt: consent.revokedAt,
        deletedAt: consent.deletedAt,
        retentionDeadline: consent.retentionDeadline,
        createdAt: consent.createdAt,
        updatedAt: consent.updatedAt,
        // Technical
        ipAddress: consent.ipAddress,
        userAgent: consent.userAgent,
        isSelf: consent.isSelf,
        thirdPartyConsentFileUrl: consent.thirdPartyConsentFileUrl,
        // Status
        isActive,
        status: isActive ? "active" : consent.revokedAt ? "revoked" : "expired",
      },
      metrics: {
        daysUntilExpiration,
        daysSinceAgreed,
        totalAuditEntries: auditTrail.length,
        actionCounts,
      },
      auditTrail: auditTrail.map((log) => ({
        id: log._id,
        action: log.action,
        actionDisplay: getActionDisplay(log.action),
        performedBy: log.performedBy ? {
          id: log.performedBy._id,
          name: log.performedBy.name,
          email: log.performedBy.email,
        } : null,
        performedByType: log.performedBy ? "user" : "system",
        performedAt: log.performedAt,
        ipAddress: log.ipAddress,
        details: log.details,
      })),
    });

  } catch (error) {
    console.error("Admin consent detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch consent details", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Get user-friendly action display name
 */
function getActionDisplay(action) {
  const displays = {
    created: "Consent Created",
    viewed: "Consent Viewed",
    downloaded: "Consent Downloaded",
    revoked: "Consent Revoked",
    expired_warning_30d: "30-Day Expiration Warning Sent",
    expired_warning_7d: "7-Day Expiration Warning Sent",
    auto_deleted_retention: "Auto-Deleted (3-Year Retention Limit)",
    admin_revoked: "Admin Revoked Consent",
    admin_viewed: "Admin Viewed Consent",
    voice_profile_created: "Voice Profile Created",
    voice_profile_deleted: "Voice Profile Deleted",
  };
  return displays[action] || action;
}

