/**
 * Voice Cloning Consent API
 * 
 * POST /api/voice-cloning/consent - Record user consent
 * GET /api/voice-cloning/consent - Check consent status
 * 
 * CRITICAL: This is required for BIPA compliance before allowing voice cloning.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import connectMongo from "@/libs/mongoose";
import VoiceConsent from "@/models/VoiceConsent";
import VoiceConsentAuditLog from "@/models/VoiceConsentAuditLog";
import { getConsentMetadata } from "@/libs/voiceConsentText";

/**
 * GET - Check if user has active consent
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

    await connectMongo();

    // Find active consent for user
    const consent = await VoiceConsent.findActiveConsent(userId);

    if (!consent) {
      return NextResponse.json({
        hasConsent: false,
        message: "No active consent found",
      });
    }

    // Log view action
    await VoiceConsentAuditLog.logAction({
      consentId: consent._id,
      action: "viewed",
      performedBy: userId,
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
    });

    return NextResponse.json({
      hasConsent: true,
      consentId: consent._id,
      agreedAt: consent.agreedAt,
      retentionDeadline: consent.retentionDeadline,
      daysUntilExpiration: consent.daysUntilExpiration,
      isActive: consent.isActive,
      voiceOwnerName: consent.voiceOwnerName,
    });

  } catch (error) {
    console.error("Voice consent check error:", error);
    return NextResponse.json(
      { error: "Failed to check consent status", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Record new consent
 */
export async function POST(req) {
  try {
    // Authenticate user
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const body = await req.json();
    
    // Validate required fields
    const requiredFields = [
      "fullName",
      "email",
      "hasReadAgreement",
      "isOver18",
      "providesConsent",
      "canRevoke",
      "isOwner",
    ];
    
    const missing = requiredFields.filter((field) => !body[field] && body[field] !== false);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate boolean fields are true (consent checkboxes)
    const consentFields = ["hasReadAgreement", "isOver18", "providesConsent", "canRevoke"];
    const notChecked = consentFields.filter((field) => body[field] !== true);
    
    if (notChecked.length > 0) {
      return NextResponse.json(
        { error: `You must check all required consent boxes: ${notChecked.join(", ")}` },
        { status: 400 }
      );
    }

    // If cloning someone else's voice, require third-party consent confirmation
    if (!body.isOwner && !body.hasThirdPartyConsent) {
      return NextResponse.json(
        { error: "You must confirm you have third-party consent to clone another person's voice" },
        { status: 400 }
      );
    }

    await connectMongo();

    // Check if user already has active consent
    const existingConsent = await VoiceConsent.findActiveConsent(userId);
    if (existingConsent) {
      return NextResponse.json(
        { 
          error: "You already have an active voice cloning consent",
          consentId: existingConsent._id,
          agreedAt: existingConsent.agreedAt,
        },
        { status: 409 } // Conflict
      );
    }

    // Get consent metadata
    const metadata = getConsentMetadata();

    // Get client info
    const ipAddress = req.headers.get("x-forwarded-for") || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Create consent record
    const consent = await VoiceConsent.create({
      userId,
      voiceOwnerName: body.fullName,
      voiceOwnerEmail: body.email,
      consentText: metadata.text,
      consentVersion: metadata.version,
      agreedAt: new Date(),
      ipAddress,
      userAgent,
      digitalSignature: body.digitalSignature || null,
      isSelf: body.isOwner,
      thirdPartyConsentFileUrl: body.thirdPartyConsentFileUrl || null,
      // retentionDeadline is auto-calculated by pre-save hook (agreedAt + 3 years)
    });

    // Log consent creation
    await VoiceConsentAuditLog.logAction({
      consentId: consent._id,
      action: "created",
      performedBy: userId,
      performedAt: new Date(),
      ipAddress,
      details: {
        consentVersion: metadata.version,
        isSelf: body.isOwner,
        hasThirdPartyConsent: body.hasThirdPartyConsent || false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Voice cloning consent recorded successfully",
      consentId: consent._id,
      agreedAt: consent.agreedAt,
      retentionDeadline: consent.retentionDeadline,
      daysUntilExpiration: consent.daysUntilExpiration,
    });

  } catch (error) {
    console.error("Voice consent creation error:", error);
    return NextResponse.json(
      { error: "Failed to record consent", details: error.message },
      { status: 500 }
    );
  }
}

