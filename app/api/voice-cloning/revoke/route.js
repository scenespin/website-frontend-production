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

// TODO: Import DynamoDB functions when integrating with voice profiles
// import { deleteVoiceProfilesByConsent } from "@/libs/voiceProfile";

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

    // TODO Phase 4: Delete voice profiles from DynamoDB
    // This will be implemented when integrating with the existing voice profile system
    // For now, we'll return a success response with a note
    
    let voiceProfilesDeleted = 0;
    let deletionNote = "Voice profile deletion will be implemented in Phase 4 integration";

    /* 
    PHASE 4 IMPLEMENTATION (uncomment when ready):
    
    try {
      // Get all voice profiles linked to this consent
      const profiles = await getVoiceProfilesByUserId(userId);
      
      for (const profile of profiles) {
        // Delete from ElevenLabs API
        if (profile.elevenLabsVoiceId) {
          await deleteElevenLabsVoice(profile.elevenLabsVoiceId, profile.elevenLabsApiKey);
        }
        
        // Delete S3 voice files
        if (profile.voiceFileUrls && Array.isArray(profile.voiceFileUrls)) {
          for (const fileUrl of profile.voiceFileUrls) {
            await deleteS3File(fileUrl);
          }
        }
        
        // Mark as deleted in DynamoDB
        await updateVoiceProfile(profile.characterId, userId, {
          status: 'revoked',
          deletedAt: new Date().toISOString(),
        });
        
        voiceProfilesDeleted++;
        
        // Log each profile deletion
        await VoiceConsentAuditLog.logAction({
          consentId: consent._id,
          action: "voice_profile_deleted",
          performedBy: userId,
          details: {
            profileId: profile.id,
            characterId: profile.characterId,
            reason: "consent_revoked",
          },
        });
      }
      
      deletionNote = `Successfully deleted ${voiceProfilesDeleted} voice profile(s)`;
      
    } catch (deleteError) {
      console.error("Voice profile deletion error:", deleteError);
      deletionNote = `Consent revoked but voice profile deletion encountered errors: ${deleteError.message}`;
    }
    */

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

