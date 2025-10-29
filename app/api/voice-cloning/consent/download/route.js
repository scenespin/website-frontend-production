/**
 * Voice Cloning Consent Download API
 * 
 * GET /api/voice-cloning/consent/download - Download consent as PDF or HTML
 * 
 * Provides users with a copy of their signed consent agreement.
 * Required for BIPA compliance (users have right to access their data).
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import connectMongo from "@/libs/mongoose";
import VoiceConsent from "@/models/VoiceConsent";
import VoiceConsentAuditLog from "@/models/VoiceConsentAuditLog";

/**
 * GET - Download consent agreement
 * Query params:
 *   - format: 'html' | 'json' (default: html)
 *   - consentId: specific consent ID (optional, defaults to active consent)
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

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "html";
    const consentId = searchParams.get("consentId");

    await connectMongo();

    // Get consent record
    let consent;
    if (consentId) {
      consent = await VoiceConsent.findOne({ _id: consentId, userId });
    } else {
      consent = await VoiceConsent.findActiveConsent(userId);
    }

    if (!consent) {
      return NextResponse.json(
        { error: "No consent record found" },
        { status: 404 }
      );
    }

    const ipAddress = req.headers.get("x-forwarded-for") || 
                     req.headers.get("x-real-ip") || 
                     "unknown";

    // Log download
    await VoiceConsentAuditLog.logAction({
      consentId: consent._id,
      action: "downloaded",
      performedBy: userId,
      performedAt: new Date(),
      ipAddress,
      details: {
        format,
        downloadedAt: new Date().toISOString(),
      },
    });

    // Return as JSON
    if (format === "json") {
      return NextResponse.json({
        consent: {
          id: consent._id,
          voiceOwnerName: consent.voiceOwnerName,
          voiceOwnerEmail: consent.voiceOwnerEmail,
          consentVersion: consent.consentVersion,
          agreedAt: consent.agreedAt,
          ipAddress: consent.ipAddress,
          isSelf: consent.isSelf,
          retentionDeadline: consent.retentionDeadline,
          isActive: consent.isActive,
          revokedAt: consent.revokedAt,
          deletedAt: consent.deletedAt,
        },
        consentText: consent.consentText,
        metadata: {
          downloadedAt: new Date().toISOString(),
          downloadedBy: userId,
        },
      });
    }

    // Return as HTML
    const html = generateConsentHTML(consent);
    
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="voice-consent-${consent._id}.html"`,
      },
    });

  } catch (error) {
    console.error("Voice consent download error:", error);
    return NextResponse.json(
      { error: "Failed to download consent", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Generate HTML version of consent agreement
 */
function generateConsentHTML(consent) {
  const statusBadge = consent.isActive 
    ? '<span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 4px; font-size: 14px;">ACTIVE</span>'
    : consent.revokedAt 
    ? '<span style="background: #ef4444; color: white; padding: 4px 12px; border-radius: 4px; font-size: 14px;">REVOKED</span>'
    : '<span style="background: #6b7280; color: white; padding: 4px 12px; border-radius: 4px; font-size: 14px;">EXPIRED</span>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Voice Cloning Consent Agreement</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #1f2937;
      background: #f9fafb;
    }
    .header {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0 0 10px 0;
      color: #111827;
      font-size: 28px;
    }
    .status-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
    }
    .consent-body {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      white-space: pre-wrap;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.5;
    }
    .signature-section {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      margin-top: 20px;
    }
    .signature-section h2 {
      margin-top: 0;
      color: #111827;
    }
    .sig-field {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .sig-label {
      font-weight: 600;
      color: #6b7280;
    }
    .sig-value {
      color: #111827;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
    }
    @media print {
      body { background: white; }
      .header, .consent-body, .signature-section {
        box-shadow: none;
        border: 1px solid #e5e7eb;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Voice Cloning Consent Agreement</h1>
    <p style="color: #6b7280; margin: 0;">
      Garden State Concentrate LLC (DBA: Wryda.ai)
    </p>
    <div class="status-bar">
      <div>
        <strong>Consent ID:</strong> ${consent._id}
      </div>
      <div>
        ${statusBadge}
      </div>
    </div>
  </div>

  <div class="consent-body">${consent.consentText}</div>

  <div class="signature-section">
    <h2>Signature & Consent Record</h2>
    
    <div class="sig-field">
      <span class="sig-label">Voice Owner Name:</span>
      <span class="sig-value">${consent.voiceOwnerName}</span>
    </div>
    
    <div class="sig-field">
      <span class="sig-label">Email Address:</span>
      <span class="sig-value">${consent.voiceOwnerEmail}</span>
    </div>
    
    <div class="sig-field">
      <span class="sig-label">Consent Version:</span>
      <span class="sig-value">${consent.consentVersion}</span>
    </div>
    
    <div class="sig-field">
      <span class="sig-label">Agreement Date:</span>
      <span class="sig-value">${new Date(consent.agreedAt).toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'long',
      })}</span>
    </div>
    
    <div class="sig-field">
      <span class="sig-label">IP Address:</span>
      <span class="sig-value">${consent.ipAddress}</span>
    </div>
    
    <div class="sig-field">
      <span class="sig-label">Voice Type:</span>
      <span class="sig-value">${consent.isSelf ? 'Own Voice' : 'Third-Party Voice'}</span>
    </div>
    
    <div class="sig-field">
      <span class="sig-label">Retention Deadline:</span>
      <span class="sig-value">${new Date(consent.retentionDeadline).toLocaleDateString('en-US', {
        dateStyle: 'full',
      })} (3 years from agreement)</span>
    </div>
    
    ${consent.revokedAt ? `
    <div class="sig-field" style="border-top: 2px solid #ef4444; margin-top: 15px; padding-top: 15px;">
      <span class="sig-label" style="color: #ef4444;">Revoked Date:</span>
      <span class="sig-value" style="color: #ef4444;">${new Date(consent.revokedAt).toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'long',
      })}</span>
    </div>
    ` : ''}
    
    <div style="margin-top: 30px; padding: 20px; background: #f3f4f6; border-radius: 6px;">
      <p style="margin: 0; font-size: 14px; color: #6b7280;">
        <strong>Legal Notice:</strong> This is an electronically signed agreement in accordance with 
        the E-Sign Act (15 U.S.C. § 7001) and Illinois Biometric Information Privacy Act (740 ILCS 14/).
        This document serves as proof of consent for biometric data collection and processing.
      </p>
    </div>
  </div>

  <div class="footer">
    <p><strong>Document Generated:</strong> ${new Date().toLocaleString('en-US')}</p>
    <p>
      For questions or to revoke consent, contact:<br>
      <strong>privacy@wryda.ai</strong><br>
      Garden State Concentrate LLC<br>
      479 State Rt 17 UNIT 2008<br>
      Mahwah, NJ 07430-2116
    </p>
  </div>
</body>
</html>`;
}

