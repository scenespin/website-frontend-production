/**
 * Email Service
 * 
 * Handles sending emails for voice consent expiration warnings and other notifications.
 * Uses Resend (https://resend.com) for reliable email delivery.
 * 
 * Setup:
 * 1. Sign up at https://resend.com
 * 2. Get API key
 * 3. Add RESEND_API_KEY to environment variables
 * 4. Verify domain (optional, but recommended for production)
 */

/**
 * Send voice consent expiration warning
 * @param {Object} consent - Voice consent record
 * @param {number} daysRemaining - Days until expiration (30 or 7)
 * @returns {Promise<boolean>} - True if email sent successfully
 */
export async function sendExpirationWarning(consent, daysRemaining) {
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (!RESEND_API_KEY) {
      console.warn('[Email] RESEND_API_KEY not configured - email not sent');
      return false;
    }
    
    const subject = daysRemaining === 30 
      ? "Voice Data Expiration Notice - 30 Days"
      : "FINAL NOTICE: Voice Data Expiration - 7 Days";
    
    const retentionDate = new Date(consent.retentionDeadline).toLocaleDateString('en-US', { 
      dateStyle: 'full' 
    });
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #dc2626 0%, #2563eb 100%);
            color: white;
            padding: 30px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .warning {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
          }
          .cta-button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            margin: 10px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
          }
          ul {
            margin: 15px 0;
            padding-left: 20px;
          }
          li {
            margin: 8px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0;">⚠️ Voice Consent Expiration Notice</h1>
        </div>
        
        <div class="content">
          <p>Hello ${consent.voiceOwnerName},</p>
          
          <div class="warning">
            <strong>⏰ ${daysRemaining === 30 ? 'Important' : 'FINAL'} Reminder:</strong> 
            Your voice cloning consent will expire in <strong>${daysRemaining} days</strong>.
          </div>
          
          <p><strong>Expiration Date:</strong> ${retentionDate}</p>
          
          <p>
            Under the Illinois Biometric Information Privacy Act (BIPA), we are required to 
            delete your voice data after 3 years. When your consent expires:
          </p>
          
          <ul>
            <li>All your voice profiles will be permanently deleted</li>
            <li>Your voice data will be removed from our systems</li>
            <li>You will no longer be able to use voice cloning features</li>
          </ul>
          
          <h3>What You Can Do:</h3>
          
          <ul>
            <li><strong>Revoke Early:</strong> You can revoke consent now and have your data deleted immediately</li>
            <li><strong>Let It Expire:</strong> Do nothing and your data will be automatically deleted on the expiration date</li>
            <li><strong>Provide New Consent:</strong> After deletion, you can provide fresh consent to continue using voice cloning</li>
          </ul>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://wryda.ai'}/settings" 
               class="cta-button">
              Manage Voice Consent
            </a>
          </p>
          
          <p>
            If you have questions about this notice, please contact us at 
            <a href="mailto:privacy@wryda.ai">privacy@wryda.ai</a>
          </p>
        </div>
        
        <div class="footer">
          <p>
            This email was sent in compliance with BIPA requirements.<br>
            Garden State Concentrate LLC (DBA: Wryda.ai)<br>
            479 State Rt 17 UNIT 2008, Mahwah, NJ 07430-2116
          </p>
          <p style="margin-top: 15px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://wryda.ai'}/privacy">Privacy Policy</a> | 
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://wryda.ai'}/terms">Terms of Service</a>
          </p>
        </div>
      </body>
      </html>
    `;
    
    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Wryda.ai <noreply@wryda.ai>',
        to: [consent.voiceOwnerEmail],
        subject,
        html,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('[Email] Failed to send:', error);
      return false;
    }
    
    const result = await response.json();
    console.log(`[Email] Sent ${daysRemaining}-day warning to ${consent.voiceOwnerEmail}:`, result.id);
    
    return true;
    
  } catch (error) {
    console.error('[Email] Error sending expiration warning:', error);
    return false;
  }
}

/**
 * Send consent revocation confirmation
 * @param {string} email - User's email
 * @param {string} name - User's name
 * @param {number} profilesDeleted - Number of voice profiles deleted
 * @returns {Promise<boolean>}
 */
export async function sendRevocationConfirmation(email, name, profilesDeleted) {
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (!RESEND_API_KEY) {
      console.warn('[Email] RESEND_API_KEY not configured - email not sent');
      return false;
    }
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: #10b981;
            color: white;
            padding: 30px;
            border-radius: 8px 8px 0 0;
            text-align: center;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0;">✅ Voice Consent Revoked</h1>
        </div>
        
        <div class="content">
          <p>Hello ${name},</p>
          
          <p>
            Your voice cloning consent has been successfully revoked. All your voice data 
            has been deleted from our systems as requested.
          </p>
          
          <p><strong>Details:</strong></p>
          <ul>
            <li>Consent revoked: ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</li>
            <li>Voice profiles deleted: ${profilesDeleted}</li>
            <li>Voice data removed: All</li>
          </ul>
          
          <p>
            If you would like to use voice cloning features again in the future, 
            you can provide new consent through your account settings.
          </p>
          
          <p>
            If you did not request this revocation, please contact us immediately at 
            <a href="mailto:privacy@wryda.ai">privacy@wryda.ai</a>
          </p>
        </div>
      </body>
      </html>
    `;
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Wryda.ai <noreply@wryda.ai>',
        to: [email],
        subject: 'Voice Consent Revoked - Confirmation',
        html,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('[Email] Failed to send revocation confirmation:', error);
      return false;
    }
    
    const result = await response.json();
    console.log(`[Email] Sent revocation confirmation to ${email}:`, result.id);
    
    return true;
    
  } catch (error) {
    console.error('[Email] Error sending revocation confirmation:', error);
    return false;
  }
}

export default {
  sendExpirationWarning,
  sendRevocationConfirmation,
};

