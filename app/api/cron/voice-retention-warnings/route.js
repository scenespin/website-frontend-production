/**
 * Voice Consent Expiration Warnings Cron
 * 
 * POST /api/cron/voice-retention-warnings
 * 
 * Sends email warnings to users when their voice consent is nearing expiration.
 * - 30 days before: First warning
 * - 7 days before: Final warning
 * 
 * Security: Requires CRON_SECRET environment variable
 * 
 * Schedule: Daily at 9:00 AM UTC (set in vercel.json)
 */

import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import VoiceConsent from "@/models/VoiceConsent";
import VoiceConsentAuditLog from "@/models/VoiceConsentAuditLog";
import { sendExpirationWarning } from "@/libs/emailService";

/**
 * POST - Send expiration warnings
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

    // Find consents expiring in 30 days
    const expiring30d = await VoiceConsent.findExpiringConsents(30);
    
    // Find consents expiring in 7 days
    const expiring7d = await VoiceConsent.findExpiringConsents(7);

    console.log(`Found ${expiring30d.length} consents expiring in 30 days`);
    console.log(`Found ${expiring7d.length} consents expiring in 7 days`);

    let warnings30dSent = 0;
    let warnings7dSent = 0;
    const errors = [];

    // Send 30-day warnings
    for (const consent of expiring30d) {
      try {
        // Check if we already sent a 30-day warning
        const alreadyWarned = await VoiceConsentAuditLog.findOne({
          consentId: consent._id,
          action: "expired_warning_30d",
        });

        if (alreadyWarned) {
          console.log(`Already sent 30-day warning for consent: ${consent._id}`);
          continue;
        }

        // Send email
        const emailSent = await sendExpirationWarning(consent, 30);

        if (emailSent) {
          // Log warning
          await VoiceConsentAuditLog.logAction({
            consentId: consent._id,
            action: "expired_warning_30d",
            performedBy: null,
            performedAt: new Date(),
            details: {
              recipientEmail: consent.voiceOwnerEmail,
              recipientName: consent.voiceOwnerName,
              retentionDeadline: consent.retentionDeadline,
              daysRemaining: 30,
            },
          });

          warnings30dSent++;
        }

      } catch (error) {
        console.error(`Error sending 30-day warning for consent ${consent._id}:`, error);
        errors.push({
          consentId: consent._id,
          type: "30d_warning",
          error: error.message,
        });
      }
    }

    // Send 7-day warnings
    for (const consent of expiring7d) {
      try {
        // Check if we already sent a 7-day warning
        const alreadyWarned = await VoiceConsentAuditLog.findOne({
          consentId: consent._id,
          action: "expired_warning_7d",
        });

        if (alreadyWarned) {
          console.log(`Already sent 7-day warning for consent: ${consent._id}`);
          continue;
        }

        // Send email
        const emailSent = await sendExpirationWarning(consent, 7);

        if (emailSent) {
          // Log warning
          await VoiceConsentAuditLog.logAction({
            consentId: consent._id,
            action: "expired_warning_7d",
            performedBy: null,
            performedAt: new Date(),
            details: {
              recipientEmail: consent.voiceOwnerEmail,
              recipientName: consent.voiceOwnerName,
              retentionDeadline: consent.retentionDeadline,
              daysRemaining: 7,
            },
          });

          warnings7dSent++;
        }

      } catch (error) {
        console.error(`Error sending 7-day warning for consent ${consent._id}:`, error);
        errors.push({
          consentId: consent._id,
          type: "7d_warning",
          error: error.message,
        });
      }
    }

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        expiring30d: expiring30d.length,
        expiring7d: expiring7d.length,
        warnings30dSent,
        warnings7dSent,
        totalWarningsSent: warnings30dSent + warnings7dSent,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log("Expiration warnings complete:", response);

    return NextResponse.json(response);

  } catch (error) {
    console.error("Voice retention warnings cron error:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Warning system failed", 
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// sendExpirationWarning is now imported from emailService
// No need to redefine it here

/**
 * GET - Manual trigger for testing (development only)
 */
export async function GET(req) {
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

