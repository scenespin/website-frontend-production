import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

// CHATGPT PROMPT TO GENERATE YOUR TERMS & SERVICES — replace with your own data 👇

// 1. Go to https://chat.openai.com/
// 2. Copy paste bellow
// 3. Replace the data with your own (if needed)
// 4. Paste the answer from ChatGPT directly in the <pre> tag below

// You are an excellent lawyer.

// I need your help to write a simple Terms & Services for my website. Here is some context:
// - Website: https://example.com
// - Name: App
// - Contact information: support@example.com
// - Description: A software platform to help users build applications
// - Ownership: when buying a package, users can download code to create apps. They own the code but they do not have the right to resell it. They can ask for a full refund within 7 day after the purchase.
// - User data collected: name, email and payment information
// - Non-personal data collection: web cookies
// - Link to privacy-policy: https://example.com/privacy-policy
// - Governing Law: France
// - Updates to the Terms: users will be updated by email

// Please write a simple Terms & Services for my site. Add the current date. Do not add or explain your reasoning. Answer:

export const metadata = getSEOTags({
  title: `Terms and Conditions | ${config.appName}`,
  canonicalUrlRelative: "/tos",
});

const TOS = () => {
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
          </svg>
          Back
        </Link>
        <h1 className="text-3xl font-extrabold pb-6">
          Terms and Conditions for {config.appName}
        </h1>

        <pre
          className="leading-relaxed whitespace-pre-wrap overflow-x-auto"
          style={{ fontFamily: "sans-serif" }}
        >
          {`Last Updated: October 29, 2025

TERMS OF SERVICE

Welcome to Wryda.ai, a product of Garden State Concentrate LLC ("we," "us," "our," "Garden State Concentrate," or the "Platform"). These Terms of Service ("Terms") constitute a legally binding agreement between you ("you," "your," or "User") and Garden State Concentrate LLC, operating as Wryda.ai, governing your access to and use of our AI-powered screenplay writing and video generation services.

BY ACCESSING OR USING OUR SERVICES, YOU AGREE TO BE BOUND BY THESE TERMS. IF YOU DO NOT AGREE TO THESE TERMS, YOU MAY NOT ACCESS OR USE THE SERVICES.

═════════════════════════════════════════════════════════

1. ACCEPTANCE AND MODIFICATIONS

1.1 Acceptance of Terms
By creating an account, accessing the Platform, or using any of our Services, you acknowledge that you have read, understood, and agree to be bound by these Terms, our Privacy Policy, and any additional policies referenced herein.

1.2 Eligibility
You must be at least 18 years old to use our Services. By using the Platform, you represent and warrant that you are of legal age to form a binding contract and meet all eligibility requirements. If you are using the Services on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.

1.3 Modifications to Terms
We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting to the Platform. Your continued use of the Services after modifications constitutes your acceptance of the updated Terms. We will make reasonable efforts to notify you of material changes via email or through the Platform. It is your responsibility to review these Terms periodically.

═════════════════════════════════════════════════════════

2. SERVICES DESCRIPTION

2.1 Platform Overview
Wryda.ai provides an AI-powered platform that enables users to:
- Create, edit, and format screenplays and scripts
- Generate video content using AI technology
- Generate audio content including voice synthesis and music
- Clone voices using authorized voice data
- Access 3D modeling and animation capabilities
- Process and edit multimedia content
- Collaborate on creative projects

2.2 Third-Party Technology
Our Services integrate multiple third-party artificial intelligence technologies to deliver video generation, audio synthesis, voice cloning, music creation, and other AI-powered features. These include:

- Video Generation Services: AI video generation providers for text-to-video and video editing
- Audio & Music Generation Services: AI audio synthesis providers for music and sound creation
- Voice Cloning Services: AI voice synthesis providers for voice cloning and text-to-speech (subject to additional provider terms)
- 3D Modeling Services: AI 3D generation providers for object and scene creation
- Payment Processing: Third-party payment processors for billing and subscriptions

While we facilitate access to these technologies, we do not directly control or own the underlying AI models. Your use of these features may be subject to additional restrictions and requirements set forth in these Terms and the third-party providers' terms of service.

2.3 Service Availability
We strive to provide continuous service availability but do not guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue any aspect of the Services at any time, with or without notice, for maintenance, updates, or other operational reasons.

═════════════════════════════════════════════════════════

3. USER ACCOUNTS AND SECURITY

3.1 Account Creation
To access certain features, you must create an account. You agree to provide accurate, current, and complete information during registration and to update this information to maintain its accuracy.

3.2 Account Security
You are solely responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized access or security breach. We are not liable for any loss or damage arising from your failure to protect your account information.

3.3 Account Termination
We reserve the right to suspend or terminate your account at any time, with or without notice, for any reason, including but not limited to:
- Violation of these Terms or applicable laws
- Fraudulent, abusive, or illegal activity
- Prolonged inactivity
- Requests from law enforcement or regulatory authorities

Upon termination, your right to access and use the Services will immediately cease. We may, but are not obligated to, delete your account data following termination.

═════════════════════════════════════════════════════════

4. ACCEPTABLE USE AND PROHIBITED CONDUCT

4.1 General Use Requirements
You agree to use the Services only for lawful purposes and in compliance with these Terms. You are solely responsible for your conduct and any content you create, upload, or transmit through the Services.

4.2 Prohibited Uses
You agree NOT to use the Services to:

a) Legal Violations
- Violate any local, state, national, or international law or regulation
- Infringe upon the intellectual property rights, privacy rights, or other rights of any third party
- Engage in any fraudulent, deceptive, or manipulative practices

b) Harmful Content
- Create, upload, or distribute content that is defamatory, obscene, pornographic, abusive, harassing, or hateful
- Generate content depicting child exploitation or abuse in any form
- Produce content that promotes violence, terrorism, or illegal activities
- Create deepfakes or impersonations intended to deceive or defraud

c) Voice Cloning Restrictions
- Clone or synthesize any person's voice without their explicit written consent
- Use voice cloning technology to impersonate individuals for fraudulent purposes
- Create audio content that could reasonably deceive listeners about the identity of the speaker
- Generate voice content of public figures, celebrities, or deceased individuals without proper authorization
- Use cloned voices for political endorsements, spam, or unsolicited marketing

d) Misinformation and Manipulation
- Create or distribute content intended to spread misinformation or disinformation
- Generate fake news, propaganda, or content designed to manipulate public opinion
- Produce content that could interfere with elections, voting processes, or democratic institutions

e) Harassment and Hate
- Create content targeting individuals or groups based on race, ethnicity, national origin, religion, gender, sexual orientation, disability, or other protected characteristics
- Generate content intended to harass, threaten, intimidate, or harm others

f) System Abuse
- Attempt to reverse engineer, decompile, disassemble, or derive source code from the Services
- Use automated systems, bots, or scraping tools to access the Services
- Circumvent or attempt to circumvent any security measures, rate limits, or access controls
- Interfere with or disrupt the integrity or performance of the Services
- Introduce viruses, malware, or other malicious code

g) Commercial Restrictions
- Resell, redistribute, or sublicense access to the Services without our express written permission
- Use the Services to compete with or develop competing products or services
- Frame or mirror any portion of the Services without authorization

h) Unauthorized Content
- Upload content you do not own or have rights to use
- Use copyrighted material, trademarks, or other intellectual property without authorization
- Generate content that violates any third-party license agreements

4.3 Content Monitoring
While we are not obligated to monitor User Content, we reserve the right to review, screen, edit, or remove any content at our sole discretion. We may employ automated systems and human review to detect violations of these Terms.

4.4 Consequences of Violation
Violation of these Acceptable Use policies may result in:
- Immediate suspension or termination of your account
- Removal of violating content
- Legal action and cooperation with law enforcement
- Liability for damages and legal fees

═════════════════════════════════════════════════════════

5. CONTENT OWNERSHIP AND LICENSING

5.1 Your Content
You retain all ownership rights to the content you create, upload, or input into the Platform ("User Content"). However, by submitting User Content, you grant us a worldwide, non-exclusive, royalty-free, sublicensable, transferable license to use, reproduce, distribute, prepare derivative works of, display, and perform your User Content solely to provide, maintain, and improve the Services.

5.2 Generated Content
Content generated by the Platform using AI technology ("Generated Content") is owned by you, subject to the following conditions:
- You had the legal right to use all input content and prompts
- The Generated Content does not violate these Terms or applicable laws
- You comply with any attribution requirements specified by us

5.3 Platform Ownership
All intellectual property rights in the Platform, including but not limited to software, algorithms, interfaces, text, graphics, logos, and trademarks, are owned by Wryda.ai or our licensors. These Terms do not grant you any ownership rights in the Platform.

5.4 Limited License to Use Services
We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Services for your personal or internal business purposes, subject to these Terms.

5.5 User Representations and Warranties
By submitting User Content, you represent and warrant that:
- You own or have obtained all necessary rights, licenses, consents, and permissions for the User Content
- Your User Content does not infringe or violate any third-party rights
- You have obtained all necessary consents for any voice data used for voice cloning
- Your User Content complies with all applicable laws and these Terms

5.6 Third-Party Content
The Services may allow you to access or integrate third-party content. You acknowledge that we do not control third-party content and are not responsible for its accuracy, legality, or appropriateness.

═════════════════════════════════════════════════════════

6. VOICE CLONING AND BIOMETRIC DATA

6.1 Voice Cloning Features
Our Platform offers voice cloning capabilities powered by third-party technology. By using these features, you acknowledge and agree to the following specific requirements:

6.2 Consent Requirements
Before cloning any voice, you must:
- Obtain explicit, informed, written consent from the individual whose voice is being cloned
- Maintain documentation of such consent for your records
- Ensure the consent is freely given and specific to the intended use
- Obtain renewed consent if the use case changes significantly

6.3 Prohibited Voice Uses
You may not:
- Clone voices of individuals without their explicit consent
- Use cloned voices to create misleading or deceptive content
- Clone voices of minors without parental or guardian consent
- Use cloned voices for purposes not disclosed in the original consent

6.4 Biometric Data
Voice data may constitute biometric information under certain laws. By providing voice data, you consent to our processing of such information as described in our Privacy Policy and in compliance with applicable biometric privacy laws.

6.5 Third-Party Voice Technology
Voice cloning features are provided through third-party services. Your use of these features is also governed by the applicable third-party terms of service. We disclaim all liability for the performance, accuracy, or availability of third-party voice cloning services.

6.6 Voice Data Security
We implement reasonable security measures to protect voice data, but we cannot guarantee absolute security. You acknowledge the inherent risks of transmitting biometric data over the internet.

═════════════════════════════════════════════════════════

7. PAYMENTS, SUBSCRIPTIONS, AND REFUNDS

7.1 Pricing and Fees
Access to certain features requires payment of fees. All fees are stated in U.S. dollars unless otherwise specified. We reserve the right to modify pricing at any time, with advance notice for existing subscriptions.

7.2 Payment Processing
Payments are processed through third-party payment processors. By providing payment information, you authorize us to charge the applicable fees to your payment method. You represent that you have the legal right to use the payment method you provide.

7.3 Subscriptions and Renewals
Subscription plans automatically renew at the end of each billing period unless you cancel before the renewal date. You will be charged the then-current subscription fee upon renewal.

7.4 Cancellation
You may cancel your subscription at any time through your account settings. Cancellation will be effective at the end of the current billing period. You will continue to have access to paid features until the end of the billing period.

7.5 Refund Policy
All sales are final. We do not offer refunds for subscription fees or credit purchases except:
- Where required by applicable law
- In cases of technical issues that prevent service usage for extended periods
- At our sole discretion on a case-by-case basis

7.6 Credit System
Certain Services operate on a credit-based system. Credits are non-transferable, non-refundable, and expire according to the terms specified at the time of purchase. Unused credits may expire if your account is inactive or closed.

7.7 Taxes
Fees do not include applicable taxes, which are your responsibility. We will collect sales tax, VAT, or other taxes as required by law.

═════════════════════════════════════════════════════════

8. INTELLECTUAL PROPERTY PROTECTION

8.1 Copyright Policy
We respect the intellectual property rights of others and expect users to do the same. We will respond to valid notices of copyright infringement in accordance with the Digital Millennium Copyright Act (DMCA) and other applicable laws.

8.2 DMCA Notices
If you believe content on our Platform infringes your copyright, please provide our designated Copyright Agent with the following information:
- Identification of the copyrighted work claimed to be infringed
- Identification of the allegedly infringing material and its location
- Your contact information (address, telephone number, email)
- A statement that you have a good faith belief the use is unauthorized
- A statement under penalty of perjury that the information is accurate and you are authorized to act on behalf of the copyright owner
- Your physical or electronic signature

8.3 Counter-Notices
If you believe content you posted was wrongly removed, you may submit a counter-notice with specific information as required by law.

8.4 Repeat Infringer Policy
We will terminate the accounts of users who are repeat infringers of intellectual property rights.

8.5 Trademark Policy
You may not use our trademarks, logos, or brand elements without our express written permission. Use of third-party trademarks must comply with applicable law and the trademark owner's guidelines.

═════════════════════════════════════════════════════════

9. DISCLAIMERS AND WARRANTIES

9.1 "AS IS" Services
THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.

9.2 No Guarantee of Accuracy
We do not warrant that:
- The Services will meet your requirements or expectations
- The Services will be uninterrupted, timely, secure, or error-free
- Generated Content will be accurate, reliable, or suitable for your purposes
- Any errors or defects will be corrected
- The Services are free of viruses or other harmful components

9.3 AI-Generated Content Disclaimer
AI-generated content may contain errors, inaccuracies, or offensive material. You are solely responsible for reviewing, editing, and verifying all Generated Content before use. We do not guarantee the quality, accuracy, or appropriateness of Generated Content.

9.4 Third-Party Services
We disclaim all liability for third-party services, content, or technologies integrated into the Platform. Your use of third-party services is at your own risk and subject to third-party terms.

9.5 No Professional Advice
The Services do not provide legal, financial, medical, or other professional advice. Generated Content should not be relied upon for professional decision-making without independent verification.

9.6 Internet Risks
We are not responsible for issues related to internet connectivity, bandwidth limitations, or other factors outside our control that may affect your use of the Services.

═════════════════════════════════════════════════════════

10. LIMITATION OF LIABILITY

10.1 Exclusion of Damages
TO THE MAXIMUM EXTENT PERMITTED BY LAW, GARDEN STATE CONCENTRATE LLC (DBA WRYDA.AI), ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
- Loss of profits, revenue, or business opportunities
- Loss of data or content
- Loss of goodwill or reputation
- Cost of substitute services
- Business interruption
ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICES, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), OR ANY OTHER LEGAL THEORY, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

10.2 Liability Cap
TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICES SHALL NOT EXCEED THE GREATER OF (A) ONE HUNDRED DOLLARS ($100) OR (B) THE TOTAL AMOUNT PAID BY YOU TO GARDEN STATE CONCENTRATE LLC IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO LIABILITY.

10.3 Basis of the Bargain
You acknowledge that the limitations of liability in this section are fundamental elements of the basis of the bargain between you and Garden State Concentrate LLC, and that we would not provide the Services without these limitations.

10.4 Applicable Law
Some jurisdictions do not allow the exclusion or limitation of certain damages. In such jurisdictions, our liability is limited to the maximum extent permitted by law.

═════════════════════════════════════════════════════════

11. INDEMNIFICATION

11.1 Your Indemnification Obligations
You agree to indemnify, defend, and hold harmless Garden State Concentrate LLC (DBA Wryda.ai), its affiliates, officers, directors, employees, agents, licensors, and service providers from and against any and all claims, liabilities, damages, losses, costs, expenses, and fees (including reasonable attorneys' fees) arising out of or related to:

a) Your use or misuse of the Services
b) Your User Content or Generated Content
c) Your violation of these Terms
d) Your violation of any rights of any third party, including intellectual property, privacy, or publicity rights
e) Your violation of any applicable laws or regulations
f) Your use of voice cloning features, including any claims related to unauthorized voice cloning or biometric data processing
g) Any content you create, upload, distribute, or transmit through the Services
h) Your representations and warranties being inaccurate or untrue

11.2 Defense and Settlement
We reserve the right to assume the exclusive defense and control of any matter subject to indemnification by you, in which case you agree to cooperate with our defense of such claim. You may not settle any claim without our prior written consent.

═════════════════════════════════════════════════════════

12. DISPUTE RESOLUTION AND ARBITRATION

12.1 Informal Resolution
Before filing a formal dispute, you agree to contact us and attempt to resolve the dispute informally by sending a written notice describing the nature and basis of the claim and the relief sought.

12.2 Binding Arbitration
If we cannot resolve the dispute informally, any dispute, claim, or controversy arising out of or relating to these Terms or the Services shall be resolved by binding arbitration administered by the American Arbitration Association (AAA) under its Commercial Arbitration Rules.

12.3 Arbitration Procedures
The arbitration shall be conducted by a single arbitrator and will take place in the United States. The arbitrator's decision shall be final and binding and may be entered as a judgment in any court of competent jurisdiction.

12.4 Class Action Waiver
TO THE MAXIMUM EXTENT PERMITTED BY LAW, YOU AND GARDEN STATE CONCENTRATE LLC (DBA WRYDA.AI) AGREE THAT EACH PARTY MAY BRING CLAIMS AGAINST THE OTHER ONLY IN AN INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, CONSOLIDATED, OR REPRESENTATIVE PROCEEDING.

12.5 Exceptions
Notwithstanding the above, either party may seek equitable relief in court to protect intellectual property rights or confidential information.

12.6 Opt-Out
You may opt out of arbitration by sending written notice within thirty (30) days of first accepting these Terms to the contact address provided below.

═════════════════════════════════════════════════════════

13. GOVERNING LAW AND JURISDICTION

13.1 Governing Law
These Terms shall be governed by and construed in accordance with the laws of the State of New Jersey, United States, without regard to its conflict of law principles.

13.2 Jurisdiction
Subject to the arbitration provisions above, you agree to submit to the personal and exclusive jurisdiction of the courts located in New Jersey for any legal proceedings.

13.3 International Use
The Services are controlled and operated from the United States. If you access the Services from outside the United States, you do so at your own risk and are responsible for compliance with local laws.

═════════════════════════════════════════════════════════

14. DATA PRIVACY AND SECURITY

14.1 Privacy Policy
Your use of the Services is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review our Privacy Policy to understand our data collection and processing practices.

14.2 Data Security
We implement reasonable technical and organizational measures to protect your data. However, no system is completely secure, and we cannot guarantee the absolute security of your information.

14.3 Data Retention
We retain your data as long as necessary to provide the Services and as required by law. Upon account termination, we may delete your data after a reasonable period, subject to legal obligations.

14.4 International Data Transfers
Your information may be transferred to and processed in countries other than your country of residence. By using the Services, you consent to such transfers.

═════════════════════════════════════════════════════════

15. TERMINATION

15.1 Termination by You
You may terminate your account at any time by following the account closure procedures in your account settings or by contacting us.

15.2 Termination by Us
We may suspend or terminate your access to the Services at any time, with or without cause, with or without notice, for any reason, including but not limited to:
- Violation of these Terms
- Fraudulent or illegal activity
- Abuse of the Services
- Non-payment of fees
- Risk of harm to us, other users, or third parties

15.3 Effect of Termination
Upon termination:
- Your right to access and use the Services will immediately cease
- You will no longer be able to access your account or User Content
- We may delete your data after a reasonable period
- Provisions that by their nature should survive termination will remain in effect, including ownership provisions, warranty disclaimers, indemnification, and limitations of liability

15.4 No Refunds on Termination
Except as required by law, we will not provide refunds or credits for any fees paid if your account is terminated for violation of these Terms.

═════════════════════════════════════════════════════════

16. GENERAL PROVISIONS

16.1 Entire Agreement
These Terms, together with our Privacy Policy and any other policies referenced herein, constitute the entire agreement between you and Garden State Concentrate LLC regarding the Services and supersede all prior agreements and understandings.

16.2 Severability
If any provision of these Terms is held to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect, and the invalid provision shall be modified to reflect the parties' intent to the maximum extent permitted by law.

16.3 Waiver
Our failure to enforce any provision of these Terms shall not be construed as a waiver of that provision or our right to enforce it in the future.

16.4 Assignment
You may not assign or transfer these Terms or any rights or obligations hereunder without our prior written consent. We may assign these Terms without restriction. Any attempted assignment in violation of this section is void.

16.5 No Third-Party Beneficiaries
These Terms do not create any third-party beneficiary rights except as expressly stated herein.

16.6 Force Majeure
We shall not be liable for any failure or delay in performance due to circumstances beyond our reasonable control, including acts of God, natural disasters, war, terrorism, labor disputes, or governmental actions.

16.7 Notices
We may provide notices to you via email, through the Platform, or by posting on our website. You agree that electronic notices satisfy any legal requirement that such communications be in writing.

16.8 Export Controls
The Services may be subject to export control laws. You agree to comply with all applicable export and import laws and regulations.

16.9 Government Users
If you are a U.S. government entity, the Services are "Commercial Items" as defined in applicable regulations, and your rights are limited accordingly.

16.10 Interpretation
Headings are for convenience only and do not affect interpretation. The words "including" and "include" mean "including without limitation."

═════════════════════════════════════════════════════════

17. CONTACT INFORMATION

For questions, concerns, or notices regarding these Terms of Service, please contact us at:

Garden State Concentrate LLC
DBA: Wryda.ai
479 State Rt 17 UNIT 2008
Mahwah, NJ 07430-2116
Email: legal@wryda.ai
Support: support@wryda.ai

For DMCA copyright notices:
Email: dmca@wryda.ai (or legal@wryda.ai)
Subject Line: "DMCA Notice"

Note: A designated DMCA agent must be registered with the US Copyright Office. Please register at https://www.copyright.gov/dmca-directory/ and update this section with your agent's information once registered.

═════════════════════════════════════════════════════════

18. ACKNOWLEDGMENT

BY USING THE SERVICES, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE, UNDERSTAND THEM, AND AGREE TO BE BOUND BY THEM. IF YOU DO NOT AGREE TO THESE TERMS, YOU MUST NOT ACCESS OR USE THE SERVICES.

═════════════════════════════════════════════════════════

Thank you for using Wryda.ai responsibly and legally.`}
        </pre>
      </div>
    </main>
  );
};

export default TOS;
