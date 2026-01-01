import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Credit System Explained | ${config.appName}`,
  description: "Learn how Wryda.ai credits work - 1 credit = $0.01 USD. Simple, transparent pricing with no hidden fees.",
  canonicalUrlRelative: "/help/credits",
});

export default function CreditsPage() {
  return (
    <>
      {/* Header */}
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
        {/* Breadcrumb */}
        <div className="text-sm breadcrumbs mb-6">
          <ul>
            <li><Link href="/help">Help Center</Link></li>
            <li>Getting Started</li>
            <li className="font-semibold">Credits</li>
          </ul>
        </div>

        {/* Article */}
        <article className="prose prose-lg max-w-none">
          <h1>Credit System Explained 💳</h1>

          <h2>The Basics</h2>
          <div className="alert alert-info my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <h3 className="font-bold text-2xl">1 credit = $0.01 USD</h3>
              <div className="text-sm">Simple, transparent, fair.</div>
            </div>
          </div>

          <h2>How You Get Credits</h2>

          <h3>1. Free Tier</h3>
          <ul>
            <li><strong>50 credits on signup</strong> (one-time)</li>
            <li><strong>10 credits/month</strong> ongoing</li>
            <li>No credit card required</li>
            <li>Credits never expire</li>
          </ul>

          <h3>2. Subscriptions (Best Value)</h3>
          <div className="overflow-x-auto my-6">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Price</th>
                  <th>Credits/Month</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Pro</strong></td>
                  <td>$29/mo</td>
                  <td>3,000</td>
                  <td>3% better</td>
                </tr>
                <tr>
                  <td><strong>Ultra</strong></td>
                  <td>$149/mo</td>
                  <td>20,000</td>
                  <td>17% better</td>
                </tr>
                <tr>
                  <td><strong>Studio</strong></td>
                  <td>$399/mo</td>
                  <td>75,000</td>
                  <td>20% better</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p><strong>Benefits:</strong></p>
          <ul>
            <li>Better credit value</li>
            <li>Exclusive features (4K export, teams, API)</li>
            <li>Credits roll over (up to plan limit)</li>
            <li>Cancel anytime</li>
          </ul>

          <h3>3. Credit Packs (Pay-as-you-go)</h3>
          <div className="overflow-x-auto my-6">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Pack</th>
                  <th>Credits</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Starter Pack</strong></td>
                  <td>500</td>
                  <td>$10</td>
                </tr>
                <tr>
                  <td><strong>Booster Pack</strong></td>
                  <td>1,500</td>
                  <td>$25</td>
                </tr>
                <tr>
                  <td><strong>Mega Pack</strong></td>
                  <td>4,000</td>
                  <td>$60</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p><strong>Benefits:</strong></p>
          <ul>
            <li>No monthly commitment</li>
            <li>Buy only what you need</li>
            <li>Credits never expire</li>
            <li>Instant delivery</li>
          </ul>

          <h2>What Credits Buy</h2>

          <h3>Video Generation</h3>
          <div className="overflow-x-auto my-6">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Credits</th>
                  <th>USD</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Professional</td>
                  <td>5 sec</td>
                  <td>50</td>
                  <td>$0.50</td>
                </tr>
                <tr>
                  <td>Professional</td>
                  <td>10 sec</td>
                  <td>100</td>
                  <td>$1.00</td>
                </tr>
                <tr>
                  <td>Premium 4K</td>
                  <td>5 sec</td>
                  <td>75</td>
                  <td>$0.75</td>
                </tr>
                <tr>
                  <td>Premium 4K</td>
                  <td>10 sec</td>
                  <td>150</td>
                  <td>$1.50</td>
                </tr>
                <tr>
                  <td>Ultra 4K</td>
                  <td>5 sec</td>
                  <td>150</td>
                  <td>$1.50</td>
                </tr>
                <tr>
                  <td>Ultra 4K</td>
                  <td>10 sec</td>
                  <td>300</td>
                  <td>$3.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>Scene Builder</h3>
          <div className="overflow-x-auto my-6">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Complexity</th>
                  <th>Credits</th>
                  <th>USD</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Simple Scene</td>
                  <td>1-2 shots, no dialogue</td>
                  <td>50-100</td>
                  <td>$0.50-$1.00</td>
                </tr>
                <tr>
                  <td>Dialogue Scene</td>
                  <td>With characters & dialogue</td>
                  <td>150-400</td>
                  <td>$1.50-$4.00</td>
                </tr>
                <tr>
                  <td>Complex Scene</td>
                  <td>Multiple shots, characters, locations</td>
                  <td>200-400+</td>
                  <td>$2.00-$4.00+</td>
                </tr>
              </tbody>
            </table>
            <p className="text-sm opacity-70 mt-2">
              <strong>Note:</strong> Scene Builder automatically calculates credits based on your scene's complexity, number of shots, characters, and dialogue.
            </p>
          </div>

          <h3>Angle Packages</h3>
          <div className="overflow-x-auto my-6">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Package</th>
                  <th>Angles</th>
                  <th>Credits</th>
                  <th>USD</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Basic</td>
                  <td>3 angles</td>
                  <td>60</td>
                  <td>$0.60</td>
                </tr>
                <tr>
                  <td>Standard</td>
                  <td>6 angles</td>
                  <td>120</td>
                  <td>$1.20</td>
                </tr>
                <tr>
                  <td>Premium</td>
                  <td>10 angles</td>
                  <td>200</td>
                  <td>$2.00</td>
                </tr>
              </tbody>
            </table>
            <p className="text-sm opacity-70 mt-2">
              Available for: Characters, Locations, and Props
            </p>
          </div>

          <h3>Image Generation</h3>
          <div className="overflow-x-auto my-6">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Credits</th>
                  <th>USD</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>All Models</td>
                  <td>15-50</td>
                  <td>$0.15-$0.50</td>
                </tr>
              </tbody>
            </table>
            <p className="text-sm opacity-70 mt-2">
              <strong>Note:</strong> Credit cost varies by model and image complexity.
            </p>
          </div>

          <h2>Credit Management Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">1. Start with Free</h3>
                <ul className="text-sm space-y-1">
                  <li>50 signup credits to test Scene Builder</li>
                  <li>Try character/location angle packages</li>
                  <li>Learn the platform</li>
                  <li>Upgrade when ready</li>
                </ul>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">2. Build Your Asset Library</h3>
                <ul className="text-sm space-y-1">
                  <li>Create character angle packages (60-200cr)</li>
                  <li>Create location angle packages (60-200cr)</li>
                  <li>Reuse across unlimited scenes</li>
                  <li>One-time investment, lifetime use</li>
                </ul>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">3. Start Simple, Scale Up</h3>
                <ul className="text-sm space-y-1">
                  <li>Simple scenes: 50-100 credits</li>
                  <li>Add complexity as you learn</li>
                  <li>Dialogue scenes: 150-400 credits</li>
                  <li>Complex scenes: 200-400+ credits</li>
                </ul>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">4. Subscribe if Regular User</h3>
                <ul className="text-sm space-y-1">
                  <li>Pro: 3,000cr/month</li>
                  <li>Better value than packs</li>
                  <li>Credits roll over (up to plan limit)</li>
                  <li>Cancel anytime</li>
                </ul>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">5. Track Usage</h3>
                <ul className="text-sm space-y-1">
                  <li>Dashboard shows credit balance</li>
                  <li>History shows what you spent on</li>
                  <li>Set alerts for low credits</li>
                </ul>
              </div>
            </div>
          </div>

          <h2>Credit Rollover</h2>
          <div className="alert alert-warning my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <div>
              <div className="font-bold">Subscriptions Only</div>
              <div className="text-sm">Unused credits roll over up to your plan limit</div>
            </div>
          </div>

          <ul>
            <li>Pro: Roll over up to 3,000cr</li>
            <li>Ultra: Roll over up to 20,000cr</li>
            <li>Studio: Roll over up to 75,000cr</li>
          </ul>

          <h3>Example:</h3>
          <ul>
            <li>Pro plan (3,000cr/month)</li>
            <li>Month 1: Use 2,000cr → Bank 1,000cr</li>
            <li>Month 2: Get 3,000cr → Total 4,000cr available</li>
            <li>Month 3: Get 3,000cr → Capped at 3,000cr total (plan limit)</li>
          </ul>

          <h2>What&apos;s NOT Limited by Credits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <div className="card bg-success text-success-content">
              <div className="card-body">
                <h3 className="card-title text-base">Always Free:</h3>
                <ul className="text-sm space-y-1">
                  <li>✅ Screenplay editor (unlimited writing)</li>
                  <li>✅ All AI writing agents (5 agents)</li>
                  <li>✅ Project storage (unlimited projects)</li>
                  <li>✅ Cloud Storage (Google Drive, Dropbox)</li>
                  <li>✅ All quality tiers & aspect ratios</li>
                  <li>✅ Project management & organization</li>
                </ul>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Credits Only For:</h3>
                <ul className="text-sm space-y-1">
                  <li>❌ Scene Builder (scene generation)</li>
                  <li>❌ Video generation</li>
                  <li>❌ Image generation</li>
                  <li>❌ Angle packages (character/location/prop)</li>
                  <li>❌ Dialogue generation (lip sync & audio)</li>
                </ul>
              </div>
            </div>
          </div>

          <h2>Refunds & Failed Generations</h2>
          <div className="alert alert-success my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <div className="font-bold">If generation fails:</div>
              <ul className="text-sm list-disc list-inside">
                <li>Credits automatically refunded</li>
                <li>No questions asked</li>
                <li>Shows in transaction history</li>
              </ul>
            </div>
          </div>

          <p><strong>If you&apos;re unhappy:</strong></p>
          <ul>
            <li>First 3 generations covered (contact support)</li>
            <li>We&apos;ll refund or regenerate</li>
            <li>After that, credits are non-refundable</li>
          </ul>

          <h2>Commercial Rights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Free Tier:</h3>
                <ul className="text-sm space-y-1">
                  <li>❌ No commercial use</li>
                  <li>✅ Personal projects only</li>
                </ul>
              </div>
            </div>
            <div className="card bg-success text-success-content">
              <div className="card-body">
                <h3 className="card-title text-base">Pro+ Tiers:</h3>
                <ul className="text-sm space-y-1">
                  <li>✅ Full commercial rights</li>
                  <li>✅ Client work allowed</li>
                  <li>✅ Monetize on YouTube, social</li>
                  <li>✅ No attribution required</li>
                  <li>✅ You own the output</li>
                </ul>
              </div>
            </div>
          </div>

          <h2>Frequently Asked Questions</h2>
          <div className="space-y-4 not-prose my-8">
            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                Do credits expire?
              </div>
              <div className="collapse-content"> 
                <p>Packs: Never expire</p>
                <p>Subscriptions: Roll over up to plan limit</p>
              </div>
            </div>
            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                Can I get a refund?
              </div>
              <div className="collapse-content"> 
                <p>Subscriptions: Cancel anytime, no refund on partial month</p>
                <p>Packs: Non-refundable (credits never expire anyway)</p>
                <p>Failed generations: Auto-refunded</p>
              </div>
            </div>
            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                What if I run out of credits?
              </div>
              <div className="collapse-content"> 
                <p>Buy more packs (instant)</p>
                <p>Upgrade subscription (more credits + features)</p>
                <p>Wait for monthly refill (free/subscription users)</p>
              </div>
            </div>
            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                Can I share credits with my team?
              </div>
              <div className="collapse-content"> 
                <p>Ultra/Studio: Yes, with team members</p>
                <p>Free/Pro: No, single user only</p>
              </div>
            </div>
          </div>

          <h2>What&apos;s Next?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <Link href="/help/video-generation" className="card bg-primary text-primary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Start Creating Videos</h3>
                <p className="text-sm">Learn how to generate AI videos</p>
              </div>
            </Link>
            <Link href="/dashboard" className="card bg-secondary text-secondary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Go to Dashboard</h3>
                <p className="text-sm">Start using your credits</p>
              </div>
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}

