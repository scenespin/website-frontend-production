/**
 * Voice Cloning Consent Revocation API
 * 
 * POST /api/voice-cloning/revoke - Revoke consent and delete all voice data
 * 
 * CRITICAL: This is required for BIPA compliance.
 * Users must be able to revoke consent and have data deleted.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import connectMongo from "@/libs/mongoose";
import VoiceConsent from "@/models/VoiceConsent";
import VoiceConsentAuditLog from "@/models/VoiceConsentAuditLog";
import { deleteAllUserVoiceProfiles } from "@/libs/voiceProfileDeletion";

/**
 * POST - Revoke consent and delete all voice data
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

    await connectMongo();

    // Find active consent
    const consent = await VoiceConsent.findActiveConsent(userId);

    if (!consent) {
      return NextResponse.json(
        { error: "No active consent found to revoke" },
        { status: 404 }
      );
    }

    // Revoke consent
    await consent.revoke();

    const ipAddress = req.headers.get("x-forwarded-for") || 
                     req.headers.get("x-real-ip") || 
                     "unknown";

    // Log revocation
    await VoiceConsentAuditLog.logAction({
      consentId: consent._id,
      action: "revoked",
      performedBy: userId,
      performedAt: new Date(),
      ipAddress,
      details: {
        reason: "user_requested",
        revokedAt: consent.revokedAt,
      },
    });

    // ✅ PHASE 4 COMPLETE: Delete voice profiles from DynamoDB
    let voiceProfilesDeleted = 0;
    let deletionNote = "No voice profiles found";

    try {
      // Delete all voice profiles from DynamoDB
      voiceProfilesDeleted = await deleteAllUserVoiceProfiles(userId);
      
      if (voiceProfilesDeleted > 0) {
        deletionNote = `Successfully deleted ${voiceProfilesDeleted} voice profile(s) from DynamoDB`;
        
        // Log each profile deletion
        await VoiceConsentAuditLog.logAction({
          consentId: consent._id,
          action: "voice_profiles_deleted",
          performedBy: userId,
          performedAt: new Date(),
          ipAddress,
          details: {
            profilesDeleted: voiceProfilesDeleted,
            reason: "consent_revoked",
          },
        });
      } else {
        deletionNote = "No voice profiles to delete";
      }
      
    } catch (deleteError) {
      console.error("Voice profile deletion error:", deleteError);
      deletionNote = `Consent revoked but voice profile deletion encountered errors: ${deleteError.message}`;
      
      // Log the error
      await VoiceConsentAuditLog.logAction({
        consentId: consent._id,
        action: "deletion_error",
        performedBy: userId,
        performedAt: new Date(),
        ipAddress,
        details: {
          error: deleteError.message,
          reason: "consent_revoked",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Voice cloning consent revoked successfully",
      revokedAt: consent.revokedAt,
      voiceProfilesDeleted,
      note: deletionNote,
      details: {
        consentId: consent._id,
        agreedAt: consent.agreedAt,
        revokedAt: consent.revokedAt,
      },
    });

  } catch (error) {
    console.error("Voice consent revocation error:", error);
    return NextResponse.json(
      { error: "Failed to revoke consent", details: error.message },
      { status: 500 }
    );
  }
}

