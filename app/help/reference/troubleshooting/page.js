import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Troubleshooting Guide | ${config.appName}`,
  description: "Common issues and solutions for Wryda.ai - get help with video generation, exports, credits, and more.",
  canonicalUrlRelative: "/help/reference/troubleshooting",
});

export default function TroubleshootingPage() {
  return (
    <>
      <header className="p-4 flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-extrabold">
            {config.appName}<span className="text-[#DC143C]">.ai</span>
          </span>
        </Link>
        <div className="flex gap-2">
          <Link href="/help" className="btn btn-ghost btn-sm">← Help Center</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-16">
        <div className="text-sm breadcrumbs mb-6">
          <ul>
            <li><Link href="/help">Help Center</Link></li>
            <li>Reference</li>
            <li className="font-semibold">Troubleshooting</li>
          </ul>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Troubleshooting Guide 🛠️</h1>

          <h2>Video Generation Issues</h2>
          <div className="space-y-4 not-prose my-8">
            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                Video generation failed
              </div>
              <div className="collapse-content text-sm"> 
                <p><strong>Possible causes:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Prompt violates content policy</li>
                  <li>Server temporarily overloaded</li>
                  <li>Network connection interrupted</li>
                </ul>
                <p className="mt-2"><strong>Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Credits are automatically refunded</li>
                  <li>Check prompt for policy violations</li>
                  <li>Try again (sometimes needs second attempt)</li>
                  <li>Contact support if persists</li>
                </ul>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                Video doesn&apos;t match my prompt
              </div>
              <div className="collapse-content text-sm"> 
                <p><strong>Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Be more specific in your prompt</li>
                  <li>Include lighting, camera angle, mood</li>
                  <li>Break complex prompts into simpler ones</li>
                  <li>Try different quality tier</li>
                  <li>Upload reference images for consistency</li>
                </ul>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                Character looks different in each shot
              </div>
              <div className="collapse-content text-sm"> 
                <p><strong>Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Upload 1-3 reference images of character</li>
                  <li>Use video-to-video reference</li>
                  <li>Generate all shots in one session</li>
                  <li>Be very specific about character details</li>
                  <li>Use Character Bank feature</li>
                  <li>Try a workflow with built-in consistency</li>
                </ul>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                Generation is taking too long
              </div>
              <div className="collapse-content text-sm"> 
                <p><strong>Expected times:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Professional: 60-90 seconds</li>
                  <li>Premium: 90-120 seconds</li>
                  <li>Ultra: 120-180 seconds</li>
                </ul>
                <p className="mt-2"><strong>If longer:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Server may be busy (peak hours)</li>
                  <li>Complex prompts take longer</li>
                  <li>Wait up to 5 minutes before reporting</li>
                  <li>Check your internet connection</li>
                </ul>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                Quality is lower than expected
              </div>
              <div className="collapse-content text-sm"> 
                <p><strong>Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Try higher quality tier (Premium or Ultra)</li>
                  <li>Use more descriptive prompts</li>
                  <li>Add lighting and camera details</li>
                  <li>Check reference images are high quality</li>
                  <li>Ensure proper aspect ratio selected</li>
                </ul>
              </div>
            </div>
          </div>

          <h2>Credit Issues</h2>
          <div className="space-y-4 not-prose my-8">
            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                Credits deducted but generation failed
              </div>
              <div className="collapse-content text-sm"> 
                <p><strong>Automatic refund:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Credits are automatically refunded within 5 minutes</li>
                  <li>Check transaction history for refund</li>
                  <li>If not refunded after 10 minutes, contact support</li>
                </ul>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                Not enough credits
              </div>
              <div className="collapse-content text-sm"> 
                <p><strong>Options:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Buy credit pack (instant delivery)</li>
                  <li>Upgrade subscription (more credits + features)</li>
                  <li>Wait for monthly refill (free/subscription users)</li>
                  <li>Use lower quality tier temporarily</li>
                </ul>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                Credits disappeared
              </div>
              <div className="collapse-content text-sm"> 
                <p><strong>Check:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Transaction history for usage</li>
                  <li>Account settings for subscription status</li>
                  <li>Email for expiration notices</li>
                </ul>
                <p className="mt-2"><strong>Note:</strong> Credits never expire, so this is rare. Contact support if credits are missing.</p>
              </div>
            </div>
          </div>

          <h2>Export Issues</h2>
          <div className="space-y-4 not-prose my-8">
            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                Export failed or stuck
              </div>
              <div className="collapse-content text-sm"> 
                <p><strong>Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Check your internet connection</li>
                  <li>Try exporting smaller section first</li>
                  <li>Lower export quality temporarily</li>
                  <li>Clear browser cache and try again</li>
                  <li>Try different browser</li>
                </ul>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                Exported video quality is poor
              </div>
              <div className="collapse-content text-sm"> 
                <p><strong>Check:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Export quality settings (use High Quality or ProRes)</li>
                  <li>Source clips are high quality</li>
                  <li>Correct resolution selected</li>
                  <li>Bitrate is appropriate for use case</li>
                </ul>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                Can&apos;t export ProRes format
              </div>
              <div className="collapse-content text-sm"> 
                <p><strong>Requirements:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Studio or Ultra plan required</li>
                  <li>Upgrade your plan to access ProRes</li>
                  <li>Use MP4 H.264 for general use</li>
                </ul>
              </div>
            </div>
          </div>

          <h2>Account & Billing Issues</h2>
          <div className="space-y-4 not-prose my-8">
            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                Can&apos;t log in
              </div>
              <div className="collapse-content text-sm"> 
                <p><strong>Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Check email and password are correct</li>
                  <li>Use &quot;Forgot Password&quot; to reset</li>
                  <li>Clear browser cookies</li>
                  <li>Try different browser</li>
                  <li>Check email for verification link</li>
                </ul>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                Payment declined
              </div>
              <div className="collapse-content text-sm"> 
                <p><strong>Common causes:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Insufficient funds</li>
                  <li>Card expired</li>
                  <li>Billing address mismatch</li>
                  <li>International transaction blocked</li>
                </ul>
                <p className="mt-2"><strong>Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Contact your bank</li>
                  <li>Try different payment method</li>
                  <li>Update billing information</li>
                </ul>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                Subscription not active
              </div>
              <div className="collapse-content text-sm"> 
                <p><strong>Check:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Account settings → Billing</li>
                  <li>Email for payment failure notice</li>
                  <li>Card expiration date</li>
                </ul>
                <p className="mt-2"><strong>To reactivate:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Update payment method</li>
                  <li>Retry payment</li>
                  <li>Contact support if issues persist</li>
                </ul>
              </div>
            </div>
          </div>

          <h2>Performance Issues</h2>
          <div className="space-y-4 not-prose my-8">
            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                Timeline playback is choppy
              </div>
              <div className="collapse-content text-sm"> 
                <p><strong>Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Lower preview quality (Settings → Preview Quality → Low)</li>
                  <li>Close other browser tabs</li>
                  <li>Use Chrome or Edge (best performance)</li>
                  <li>Clear browser cache</li>
                  <li>Restart browser</li>
                </ul>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                Editor is slow or unresponsive
              </div>
              <div className="collapse-content text-sm"> 
                <p><strong>Solutions:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Close unused projects</li>
                  <li>Clear browser cache</li>
                  <li>Disable browser extensions</li>
                  <li>Use incognito/private mode</li>
                  <li>Check system resources (RAM, CPU)</li>
                </ul>
              </div>
            </div>
          </div>

          <h2>Still Need Help?</h2>
          <div className="alert alert-info my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <div className="font-bold">Contact Support</div>
              <div className="text-sm mt-2">Email: support@wryda.ai</div>
              <div className="text-sm">Response time: Usually within 24 hours</div>
              <div className="text-sm mt-2"><strong>Include:</strong> Account email, description of issue, screenshots if possible</div>
            </div>
          </div>

          <h2>Helpful Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 not-prose my-8">
            <Link href="/help/video-generation" className="card bg-primary text-primary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Video Generation Guide</h3>
                <p className="text-sm">Learn best practices</p>
              </div>
            </Link>
            <Link href="/help/credits" className="card bg-secondary text-secondary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Credits Guide</h3>
                <p className="text-sm">Understand credit system</p>
              </div>
            </Link>
            <Link href="/help/reference/formats" className="card bg-accent text-accent-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Export Formats</h3>
                <p className="text-sm">Choose right format</p>
              </div>
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}

