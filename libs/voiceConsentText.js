/**
 * Voice Cloning Consent Agreement Text
 * 
 * LEGAL: This text must be shown to users before collecting voice data.
 * Meets BIPA (Illinois Biometric Information Privacy Act) requirements.
 * 
 * DO NOT modify without legal review.
 */

export const CONSENT_VERSION = "v1.0";
export const CONSENT_EFFECTIVE_DATE = "October 29, 2025";

export const CONSENT_TEXT = `VOICE CLONING CONSENT AGREEMENT

This agreement is between Garden State Concentrate LLC ("Wryda.ai", "we", "us") and the individual providing voice data ("you").

EFFECTIVE DATE: ${CONSENT_EFFECTIVE_DATE}
VERSION: ${CONSENT_VERSION}

═══════════════════════════════════════════════════════════════

1. BIOMETRIC DATA NOTICE

We are collecting your voice data, which may constitute biometric information under Illinois law and other state laws. Voice data includes:
• Audio recordings of your voice
• Voiceprints derived from audio analysis
• Biometric identifiers unique to your voice
• Voice characteristics and patterns

═══════════════════════════════════════════════════════════════

2. PURPOSE OF COLLECTION

Your voice data will be used ONLY for the following purposes:
• Creating a voice model for text-to-speech synthesis
• Generating audio content in your voice as directed by you
• Storing your voice profile for authorized future use
• Improving voice cloning accuracy for your specific voice

Your voice data will NOT be used for:
• Marketing or advertising without separate explicit consent
• Sale or disclosure to third parties (except authorized service providers)
• Training general AI models for commercial purposes
• Any purpose you have not explicitly authorized

═══════════════════════════════════════════════════════════════

3. DURATION OF RETENTION

We will retain your voice data for:
• As long as you maintain an active account with voice cloning consent, OR
• Until you request deletion, OR
• Maximum of 3 years from the date of this consent, whichever comes first

IMPORTANT: Illinois law (BIPA) requires us to delete your voice data within 3 years or upon your request. We will automatically delete your voice data at the end of the 3-year period.

═══════════════════════════════════════════════════════════════

4. THIRD-PARTY PROCESSING

Your voice data will be processed by third-party AI voice synthesis service providers to create voice models and generate speech. These providers are contractually obligated to:
• Use your voice data only for providing our services to you
• Maintain appropriate security measures to protect your data
• Delete your data upon our request or contract termination
• Not use your voice data for their own purposes

Note: While we select reputable service providers, we cannot control their internal practices. Their terms of service may also apply to the voice cloning features.

═══════════════════════════════════════════════════════════════

5. YOUR RIGHTS

You have the right to:
• Refuse voice cloning (you can still use all other platform features)
• Revoke this consent at any time without penalty
• Request immediate deletion of your voice data
• Receive confirmation of deletion within 30 days
• Access your voice data and consent records
• Withdraw consent even after providing voice samples

Revoking consent will:
• Immediately prevent further use of your voice for generation
• Delete all your voice profiles and voice data within 30 days
• Not affect your access to other platform features

═══════════════════════════════════════════════════════════════

6. SECURITY MEASURES

We implement enhanced security measures for biometric data including:
• Encryption of voice data in transit (TLS/SSL)
• Encryption of voice data at rest
• Limited access to authorized personnel only
• Separate secure storage from other user data
• Regular security audits
• Monitoring for unauthorized access

However, no system is completely secure. You acknowledge the inherent risks of transmitting biometric data over the internet.

═══════════════════════════════════════════════════════════════

7. MINORS

If you are under 18 years old, you must have parental or guardian consent before providing voice data. By checking the box below, you confirm you are 18 or older OR have obtained proper parental consent.

═══════════════════════════════════════════════════════════════

8. CLONING ANOTHER PERSON'S VOICE

If you are providing voice data from another person (not your own voice):
1. You MUST have their explicit written consent
2. You MUST upload their signed consent form
3. You MUST verify their identity
4. You acknowledge full legal responsibility for unauthorized voice cloning

WARNING: Cloning someone's voice without their consent may violate federal and state laws, including:
• Identity theft statutes
• Right of publicity laws
• Fraud statutes
• Wiretapping laws

You will be solely liable for any legal claims arising from unauthorized voice cloning.

═══════════════════════════════════════════════════════════════

9. CONSENT STATEMENT

By checking all boxes and providing my electronic signature below, I:

☐ Have read and understood this entire agreement
☐ Am 18 years or older (OR have parental consent)
☐ Am the person whose voice is being recorded (OR have proper authorization)
☐ Voluntarily provide my voice data for the purposes stated above
☐ Consent to the collection, processing, storage, and use of my voice data as described
☐ Understand I can revoke this consent at any time
☐ Understand my voice data will be deleted within 3 years or upon my request
☐ Acknowledge the security risks of providing biometric data

For third-party voice cloning:
☐ I confirm I have obtained proper written consent if cloning another person's voice
☐ I have uploaded the required consent documentation
☐ I accept full legal responsibility for unauthorized voice cloning

═══════════════════════════════════════════════════════════════

10. HOW TO REVOKE CONSENT

To revoke this consent and delete your voice data:
1. Go to Settings > Voice Cloning Consent
2. Click "Revoke Consent & Delete Voice Data"
3. Confirm your request
4. We will delete all voice data within 30 days
5. You will receive confirmation via email

Or email us at privacy@wryda.ai with subject "BIPA Voice Data Deletion Request"

═══════════════════════════════════════════════════════════════

11. CONTACT INFORMATION

For questions about this consent or your voice data:

Garden State Concentrate LLC
DBA: Wryda.ai
479 State Rt 17 UNIT 2008
Mahwah, NJ 07430-2116

Email: privacy@wryda.ai
For BIPA inquiries: privacy@wryda.ai with subject "BIPA Inquiry"

═══════════════════════════════════════════════════════════════

12. LEGAL COMPLIANCE

This consent agreement complies with:
• Illinois Biometric Information Privacy Act (BIPA) 740 ILCS 14/
• California Consumer Privacy Act (CCPA)
• General Data Protection Regulation (GDPR) Article 9
• Other applicable biometric privacy laws

═══════════════════════════════════════════════════════════════

By providing consent below, you acknowledge your understanding and agreement under the Illinois Biometric Information Privacy Act and other applicable laws.`;

/**
 * Get consent text with current date
 */
export function getConsentText() {
  return CONSENT_TEXT;
}

/**
 * Get consent metadata
 */
export function getConsentMetadata() {
  return {
    version: CONSENT_VERSION,
    effectiveDate: CONSENT_EFFECTIVE_DATE,
    text: CONSENT_TEXT,
    retentionYears: 3,
  };
}

export default {
  CONSENT_VERSION,
  CONSENT_EFFECTIVE_DATE,
  CONSENT_TEXT,
  getConsentText,
  getConsentMetadata,
};

