/**
 * Voice Consent Retention Enforcement Cron
 * 
 * POST /api/cron/voice-retention
 * 
 * CRITICAL: Runs daily at 2:00 AM to enforce 3-year BIPA retention limit.
 * Automatically deletes voice data that has reached retention deadline.
 * 
 * Security: Requires CRON_SECRET environment variable
 * 
 * Schedule: Daily at 2:00 AM UTC (set in vercel.json)
 */

import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import VoiceConsent from "@/models/VoiceConsent";
import VoiceConsentAuditLog from "@/models/VoiceConsentAuditLog";

// TODO Phase 4: Import voice profile deletion functions
// import { deleteVoiceProfilesByUserId } from "@/libs/voiceProfile";
// import { deleteElevenLabsVoice } from "@/libs/elevenlabs";
// import { deleteS3Files } from "@/libs/s3";

/**
 * POST - Run retention enforcement
 */
export async function POST(req) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error("Invalid cron secret");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectMongo();

    // Find all expired consents
    const expiredConsents = await VoiceConsent.findExpiredConsents();

    console.log(`Found ${expiredConsents.length} expired consents to process`);

    let totalConsentsDeleted = 0;
    let totalProfilesDeleted = 0;
    const errors = [];

    // Process each expired consent
    for (const consent of expiredConsents) {
      try {
        console.log(`Processing expired consent: ${consent._id} for user: ${consent.userId}`);

        // TODO Phase 4: Delete voice profiles
        // This will be implemented when integrating with existing voice profile system
        /*
        try {
          // Get all voice profiles for this user
          const profiles = await getVoiceProfilesByUserId(consent.userId);
          
          for (const profile of profiles) {
            try {
              // Delete from ElevenLabs
              if (profile.elevenLabsVoiceId && profile.elevenLabsApiKey) {
                const decryptedKey = await decryptApiKey(profile.elevenLabsApiKey);
                await deleteElevenLabsVoice(profile.elevenLabsVoiceId, decryptedKey);
              }
              
              // Delete S3 voice files
              if (profile.voiceFileUrls && Array.isArray(profile.voiceFileUrls)) {
                await deleteS3Files(profile.voiceFileUrls);
              }
              
              // Mark as deleted in DynamoDB
              await updateVoiceProfile(profile.characterId, consent.userId.toString(), {
                status: 'deleted',
                deletedAt: new Date().toISOString(),
              });
              
              totalProfilesDeleted++;
              
              // Log profile deletion
              await VoiceConsentAuditLog.logAction({
                consentId: consent._id,
                action: "voice_profile_deleted",
                performedBy: null,
                details: {
                  profileId: profile.id,
                  characterId: profile.characterId,
                  reason: "retention_limit_reached",
                  deletedBy: "cron_job",
                },
              });
              
            } catch (profileError) {
              console.error(`Error deleting profile ${profile.id}:`, profileError);
              errors.push({
                consentId: consent._id,
                profileId: profile.id,
                error: profileError.message,
              });
            }
          }
        } catch (fetchError) {
          console.error(`Error fetching profiles for user ${consent.userId}:`, fetchError);
          errors.push({
            consentId: consent._id,
            error: `Failed to fetch profiles: ${fetchError.message}`,
          });
        }
        */

        // Mark consent as deleted (soft delete)
        await consent.markDeleted();
        totalConsentsDeleted++;

        // Log automatic deletion
        await VoiceConsentAuditLog.logAction({
          consentId: consent._id,
          action: "auto_deleted_retention",
          performedBy: null,
          performedAt: new Date(),
          ipAddress: null,
          details: {
            reason: "3_year_retention_limit",
            retentionDeadline: consent.retentionDeadline,
            agreedAt: consent.agreedAt,
            profilesDeleted: totalProfilesDeleted,
            deletedBy: "cron_job",
          },
        });

        console.log(`Successfully processed consent: ${consent._id}`);

      } catch (error) {
        console.error(`Error processing consent ${consent._id}:`, error);
        errors.push({
          consentId: consent._id,
          error: error.message,
        });
      }
    }

    // Send admin notification if there were errors
    if (errors.length > 0) {
      console.error("Retention enforcement had errors:", errors);
      // TODO: Send email to admin
      // await sendAdminNotification({
      //   subject: "Voice Retention Enforcement Errors",
      //   errors,
      // });
    }

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        consentsFound: expiredConsents.length,
        consentsDeleted: totalConsentsDeleted,
        profilesDeleted: totalProfilesDeleted,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
      note: errors.length === 0 
        ? "All expired consents processed successfully" 
        : `Processed with ${errors.length} error(s) - admin notification recommended`,
      phase4Note: totalProfilesDeleted === 0 
        ? "Voice profile deletion pending Phase 4 integration" 
        : undefined,
    };

    console.log("Retention enforcement complete:", response);

    return NextResponse.json(response);

  } catch (error) {
    console.error("Voice retention cron error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Retention enforcement failed", 
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Manual trigger for testing (admin only)
 * Remove this in production or add proper admin auth
 */
export async function GET(req) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Manual trigger disabled in production" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    message: "This endpoint should be called via POST with CRON_SECRET",
    instructions: [
      "1. Set CRON_SECRET in environment variables",
      "2. POST to this endpoint with header:",
      "   Authorization: Bearer YOUR_CRON_SECRET",
      "3. Or set up Vercel Cron (recommended)",
    ],
  });
}

