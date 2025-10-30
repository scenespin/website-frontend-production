import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

// Privacy Policy content below

// You are an excellent lawyer.

// I need your help to write a simple privacy policy for my website. Here is some context:
// - Website: https://example.com
// - Name: App
// - Description: A software platform to help users build applications
// - User data collected: name, email and payment information
// - Non-personal data collection: web cookies
// - Purpose of Data Collection: Order processing
// - Data sharing: we do not share the data with any other parties
// - Children's Privacy: we do not collect any data from children
// - Updates to the Privacy Policy: users will be updated by email
// - Contact information: support@example.com

// Please write a simple privacy policy for my site. Add the current date.  Do not add or explain your reasoning. Answer:

export const metadata = getSEOTags({
  title: `Privacy Policy | ${config.appName}`,
  canonicalUrlRelative: "/privacy-policy",
});

const PrivacyPolicy = () => {
  return (
    <main className="max-w-xl mx-auto">
      <div className="p-5">
        <Link href="/" className="btn btn-ghost">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
              clipRule="evenodd"
            />
          </svg>{" "}
          Back
        </Link>
        <h1 className="text-3xl font-extrabold pb-6">
          Privacy Policy for {config.appName}
        </h1>

        <pre
          className="leading-relaxed whitespace-pre-wrap overflow-x-auto"
          style={{ fontFamily: "sans-serif" }}
        >
          {`Last Updated: October 29, 2025

PRIVACY POLICY

Welcome to Wryda.ai, operated by Garden State Concentrate LLC ("we," "us," "our," "Garden State Concentrate," or the "Platform"). This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use our AI-powered screenplay writing and video generation services.

BY USING OUR SERVICES, YOU CONSENT TO THE DATA PRACTICES DESCRIBED IN THIS POLICY. IF YOU DO NOT AGREE WITH THIS POLICY, PLEASE DO NOT USE OUR SERVICES.

═════════════════════════════════════════════════════════

1. INFORMATION WE COLLECT

1.1 Personal Information You Provide
When you create an account or use our Services, we may collect:

Account Information:
- Full name
- Email address
- Username and password
- Profile information and preferences
- Company or organization name (if applicable)

Payment Information:
- Billing address
- Payment method details (processed securely by our third-party payment processor)
- Transaction history and purchase records

Content and Communications:
- Screenplays, scripts, and text you create or upload
- Video and audio files you upload or generate
- Voice recordings for voice cloning features
- Messages you send through our support system
- Feedback, reviews, and survey responses

1.2 Voice and Biometric Data
When you use our voice cloning features, we collect:
- Voice recordings and audio samples
- Voice biometric information derived from audio files
- Consent documentation for voice cloning
- Metadata associated with voice files

Voice data may be considered biometric information under certain laws (such as the Illinois Biometric Information Privacy Act). We collect and process this data only with your explicit consent and solely for the purpose of providing voice cloning services.

1.3 Automatically Collected Information
When you access our Services, we automatically collect:

Device and Usage Information:
- IP address and general location (city/country level)
- Browser type, version, and language settings
- Device type, operating system, and unique device identifiers
- Screen resolution and device characteristics
- Pages visited, features used, and time spent on the Platform
- Clickstream data and interaction patterns
- Referral sources and exit pages

Cookies and Similar Technologies:
- Session cookies for authentication and functionality
- Persistent cookies for preferences and settings
- Analytics cookies to understand usage patterns
- Third-party cookies from integrated services

Log Data:
- API requests and responses
- Error logs and debugging information
- Security and fraud prevention data
- Performance and diagnostic data

1.4 Information from Third Parties
We may receive information about you from:
- Authentication providers (e.g., when you sign in with social accounts)
- Payment processors regarding transaction completion
- Third-party AI service providers for content generation
- Analytics and service improvement partners
- Public databases and marketing partners (with your consent)

═════════════════════════════════════════════════════════

2. HOW WE USE YOUR INFORMATION

2.1 Service Provision and Improvement
We use your information to:
- Create and maintain your account
- Process your payments and manage subscriptions
- Generate video, audio, and voice content using AI
- Store and retrieve your projects and content
- Provide customer support and respond to inquiries
- Send service-related communications and notifications
- Improve and optimize the Platform's functionality
- Develop new features and services
- Conduct research and analytics

2.2 Voice Cloning Specific Uses
Voice data is used exclusively to:
- Create voice models for synthesis
- Generate cloned voice audio
- Improve voice cloning accuracy and quality
- Store voice profiles for authorized future use

We do NOT use voice data for:
- Marketing or advertising purposes
- Selling or sharing with third parties (except as required to provide the service)
- Any purpose beyond what you explicitly consented to

2.3 Communications
We may use your email address to send:
- Account verification and security alerts
- Service updates and maintenance notifications
- Billing statements and payment confirmations
- Feature announcements and product updates
- Marketing communications (with your consent, and you may opt out)
- Responses to your support requests

2.4 Legal and Safety Purposes
We may use your information to:
- Comply with legal obligations and court orders
- Enforce our Terms of Service and other policies
- Protect against fraud, abuse, and security threats
- Investigate and prevent illegal activities
- Protect the rights, property, and safety of Garden State Concentrate LLC, our users, and the public

═════════════════════════════════════════════════════════

3. HOW WE SHARE YOUR INFORMATION

3.1 Service Providers
We share information with trusted third-party service providers who assist us in:
- Cloud hosting and data storage
- Payment processing (e.g., payment gateway providers)
- AI content generation (video, audio, voice synthesis)
- Email delivery and communications
- Analytics and performance monitoring
- Customer support tools
- Security and fraud prevention

These providers are contractually obligated to protect your information and use it only for the specific services they provide to us.

3.2 Third-Party AI Technologies
To provide our Services, we integrate with third-party AI platforms including:

- Video Generation Services: AI video generation providers for text-to-video and video editing
- Audio & Music Generation Services: AI audio synthesis providers for music and sound creation
- Voice Cloning Services: AI voice synthesis providers for voice cloning and text-to-speech
- 3D Modeling Services: AI 3D generation providers for object and scene creation

These providers process:
- Text and screenplay content for analysis and generation
- Video generation requests and outputs
- Audio generation and music creation requests
- Voice cloning data and synthesis
- 3D modeling and animation requests

IMPORTANT: These third parties process data in accordance with their own privacy policies. While we select reputable partners with strong privacy practices, we are not responsible for their data practices. Voice cloning features use third-party services subject to additional terms.

3.3 Business Transfers
If Garden State Concentrate LLC is involved in a merger, acquisition, bankruptcy, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change in ownership or control of your information.

3.4 Legal Requirements
We may disclose your information when required by law or in response to:
- Subpoenas, court orders, or legal processes
- Law enforcement requests
- National security requirements
- Protection of our legal rights
- Prevention of fraud or illegal activity
- Emergency situations involving danger of death or serious physical injury

3.5 With Your Consent
We may share your information with other third parties when you explicitly consent to such sharing.

3.6 Aggregated and Anonymized Data
We may share aggregated, anonymized, or de-identified data that cannot reasonably be used to identify you for research, analytics, marketing, or other purposes.

═════════════════════════════════════════════════════════

4. DATA RETENTION

4.1 Account Data
We retain your account information and content for as long as your account is active and for a reasonable period thereafter to:
- Comply with legal obligations
- Resolve disputes
- Enforce our agreements
- Support business operations

4.2 Voice Biometric Data
Voice data used for cloning is retained only as long as necessary to:
- Provide the voice cloning service
- Maintain your voice profile for future authorized use
- Comply with legal requirements

You may request deletion of your voice data at any time, subject to legal retention requirements.

4.3 Generated Content
Content you generate using our Services (videos, audio, scripts) is retained in your account until you delete it or close your account. We may retain backup copies for a limited period for disaster recovery purposes.

4.4 Deletion After Account Closure
When you close your account, we will delete or anonymize your personal information within a reasonable timeframe (typically 30-90 days), except where:
- We are required to retain data by law
- Data is needed for pending transactions or disputes
- You have provided consent for longer retention

═════════════════════════════════════════════════════════

5. DATA SECURITY

5.1 Security Measures
We implement industry-standard security measures to protect your information, including:
- Encryption of data in transit (TLS/SSL)
- Encryption of sensitive data at rest
- Access controls and authentication requirements
- Regular security audits and vulnerability assessments
- Employee training on data protection
- Network security and firewall protections

5.2 Voice Data Security
Given the sensitive nature of biometric voice data, we implement additional security measures:
- Separate secure storage for voice data
- Restricted access limited to authorized personnel
- Enhanced encryption protocols
- Regular security reviews specific to biometric data

5.3 No Guarantee
While we strive to protect your information, no security system is impenetrable. We cannot guarantee the absolute security of your data. You transmit information at your own risk.

5.4 Your Responsibilities
You are responsible for:
- Maintaining the confidentiality of your password
- Restricting access to your account
- Notifying us immediately of any unauthorized access
- Using secure internet connections when accessing the Services

═════════════════════════════════════════════════════════

6. YOUR RIGHTS AND CHOICES

6.1 Access and Portability
You have the right to:
- Access the personal information we hold about you
- Request a copy of your data in a portable format
- Review your account information through your account dashboard

6.2 Correction and Updates
You may:
- Update your account information at any time
- Correct inaccurate or incomplete personal data
- Request that we update our records

6.3 Deletion Rights
You may request deletion of:
- Your entire account and associated data
- Specific voice recordings and biometric data
- Particular content or projects
- Your email from marketing lists

We will comply with deletion requests subject to legal retention obligations and legitimate business needs.

6.4 Objection and Restriction
You may object to or request restriction of:
- Processing of your personal information for certain purposes
- Automated decision-making (if applicable)
- Use of your data for marketing purposes

6.5 Withdraw Consent
Where we process your data based on consent (such as voice biometric data), you may withdraw consent at any time. This will not affect the lawfulness of processing before withdrawal.

6.6 Cookie Controls
You can control cookies through:
- Browser settings (block, delete, or limit cookies)
- Opt-out tools provided by third-party analytics services
- Your account privacy preferences

Note that blocking certain cookies may limit functionality of the Services.

6.7 Marketing Communications
You may opt out of marketing emails by:
- Clicking the unsubscribe link in any marketing email
- Adjusting preferences in your account settings
- Contacting us directly

You will continue to receive essential service-related communications.

6.8 Exercising Your Rights
To exercise any of these rights, please contact us at privacy@wryda.ai. We will respond to requests within the timeframes required by applicable law (typically 30-45 days).

We may require verification of your identity before processing certain requests.

═════════════════════════════════════════════════════════

7. INTERNATIONAL DATA TRANSFERS

7.1 Data Location
Our Services are operated from the United States. Your information may be transferred to, stored in, and processed in the United States and other countries where our service providers operate.

7.2 Cross-Border Transfers
If you access our Services from outside the United States, you acknowledge that your information will be transferred to and processed in countries that may have different data protection laws than your country of residence.

7.3 Adequacy and Safeguards
When we transfer data internationally, we implement appropriate safeguards, such as:
- Standard contractual clauses approved by relevant authorities
- Privacy Shield frameworks (where applicable)
- Adequacy decisions by regulatory authorities
- Explicit consent for specific transfers

═════════════════════════════════════════════════════════

8. CHILDREN'S PRIVACY

8.1 Age Restriction
Our Services are not intended for children under the age of 18. We do not knowingly collect personal information from individuals under 18.

8.2 Parental Notice
If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately at privacy@wryda.ai.

8.3 Deletion of Children's Data
Upon discovering that we have collected information from a child under 18, we will promptly delete such information from our systems.

═════════════════════════════════════════════════════════

9. STATE-SPECIFIC PRIVACY RIGHTS

9.1 California Residents (CCPA/CPRA)
If you are a California resident, you have additional rights under the California Consumer Privacy Act:
- Right to know what personal information is collected
- Right to know whether personal information is sold or disclosed
- Right to opt out of sale of personal information (we do not sell personal information)
- Right to deletion of personal information
- Right to non-discrimination for exercising your rights
- Right to correct inaccurate personal information
- Right to limit use of sensitive personal information

To exercise these rights, contact us at privacy@wryda.ai or call our toll-free number (if applicable).

9.2 Virginia, Colorado, Connecticut, Utah Residents
Residents of Virginia, Colorado, Connecticut, and Utah have similar rights to:
- Confirm whether we process your personal data
- Access your personal data
- Correct inaccuracies in your personal data
- Delete your personal data
- Obtain a copy of your personal data
- Opt out of targeted advertising, sale of data, or profiling

9.3 Illinois Residents (BIPA)
Under the Illinois Biometric Information Privacy Act, we:
- Inform you in writing that we collect biometric information (voice data)
- Inform you of the purpose and duration of collection
- Obtain your written consent before collecting biometric data
- Do not sell, lease, or trade biometric information
- Store biometric data with reasonable security measures
- Retain biometric data only as long as necessary or for 3 years, whichever comes first

9.4 Nevada Residents
Nevada residents may opt out of the sale of personal information. We do not sell personal information as defined under Nevada law.

═════════════════════════════════════════════════════════

10. THIRD-PARTY LINKS AND SERVICES

10.1 External Links
Our Services may contain links to third-party websites, plugins, or applications. We are not responsible for the privacy practices or content of these external sites.

10.2 Third-Party Privacy Policies
When you interact with third-party services, their privacy policies govern the collection and use of your information. We encourage you to review their policies.

10.3 Social Media Features
Our Services may include social media features (e.g., sharing buttons). These features may collect information about you and are governed by the privacy policies of the respective social media companies.

═════════════════════════════════════════════════════════

11. UPDATES TO THIS PRIVACY POLICY

11.1 Modifications
We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, legal requirements, or other operational needs.

11.2 Notice of Changes
We will notify you of material changes by:
- Posting the updated policy on our website with a new "Last Updated" date
- Sending an email notification to your registered email address
- Displaying a prominent notice on the Platform
- Requesting your consent if required by law

11.3 Continued Use
Your continued use of the Services after changes become effective constitutes your acceptance of the updated Privacy Policy.

11.4 Review
We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information.

═════════════════════════════════════════════════════════

12. DO NOT TRACK SIGNALS

12.1 DNT Response
Some browsers include a "Do Not Track" (DNT) feature. Currently, there is no industry standard for how to respond to DNT signals.

12.2 Our Approach
We do not currently respond to DNT signals. If a standard is established, we will reassess our policy and update this Privacy Policy accordingly.

═════════════════════════════════════════════════════════

13. DATA PROTECTION OFFICER

13.1 Contact
For privacy-related inquiries, concerns, or requests, you may contact our Data Protection Officer (if applicable) or our privacy team at:

Email: privacy@wryda.ai
Subject Line: "Privacy Inquiry"

═════════════════════════════════════════════════════════

14. CONTACT INFORMATION

For questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:

Garden State Concentrate LLC
DBA: Wryda.ai
479 State Rt 17 UNIT 2008
Mahwah, NJ 07430-2116
Email: privacy@wryda.ai
Support: support@wryda.ai
Website: https://wryda.ai

For California residents exercising CCPA rights:
Email: privacy@wryda.ai with subject "CCPA Request"

For Illinois residents regarding biometric data:
Email: privacy@wryda.ai with subject "BIPA Inquiry"

═════════════════════════════════════════════════════════

15. ACKNOWLEDGMENT

BY USING OUR SERVICES, YOU ACKNOWLEDGE THAT YOU HAVE READ AND UNDERSTOOD THIS PRIVACY POLICY AND CONSENT TO THE COLLECTION, USE, AND DISCLOSURE OF YOUR INFORMATION AS DESCRIBED HEREIN.

═════════════════════════════════════════════════════════

Thank you for trusting Garden State Concentrate LLC (Wryda.ai) with your information. We are committed to protecting your privacy and handling your data responsibly.`}
        </pre>
      </div>
    </main>
  );
};

export default PrivacyPolicy;
