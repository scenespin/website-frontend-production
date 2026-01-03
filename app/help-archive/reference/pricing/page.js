import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Pricing Reference | ${config.appName}`,
  description: "Complete pricing breakdown and credit costs for all Wryda.ai features and services.",
  canonicalUrlRelative: "/help/reference/pricing",
});

export default function PricingReferencePage() {
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

      <main className="max-w-5xl mx-auto px-8 py-16">
        <div className="text-sm breadcrumbs mb-6">
          <ul>
            <li><Link href="/help">Help Center</Link></li>
            <li>Reference</li>
            <li className="font-semibold">Pricing</li>
          </ul>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Pricing Reference 💰</h1>
          <div className="alert alert-info my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <h3 className="font-bold text-lg">1 credit = $0.01 USD</h3>
              <div className="text-sm">All prices are credit-based. Simple & transparent.</div>
            </div>
          </div>

          <h2>Subscription Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 not-prose my-8">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">FREE</h3>
                <div className="text-3xl font-bold">$0</div>
                <p className="text-xs opacity-70">50 signup + 10/mo</p>
                <ul className="text-xs mt-2 space-y-1">
                  <li>✅ All features</li>
                  <li>✅ All quality tiers</li>
                  <li>❌ No commercial use</li>
                </ul>
              </div>
            </div>
            <div className="card bg-primary text-primary-content">
              <div className="card-body">
                <h3 className="card-title text-base">PRO</h3>
                <div className="text-3xl font-bold">$29</div>
                <p className="text-xs">/month</p>
                <div className="text-sm font-bold mt-2">3,000 credits</div>
                <ul className="text-xs mt-2 space-y-1">
                  <li>✅ Commercial rights</li>
                  <li>✅ Credits roll over</li>
                  <li>✅ All features</li>
                </ul>
              </div>
            </div>
            <div className="card bg-secondary text-secondary-content">
              <div className="card-body">
                <h3 className="card-title text-base">ULTRA</h3>
                <div className="text-3xl font-bold">$149</div>
                <p className="text-xs">/month</p>
                <div className="text-sm font-bold mt-2">20,000 credits</div>
                <ul className="text-xs mt-2 space-y-1">
                  <li>✅ Everything in Pro</li>
                  <li>✅ Team sharing</li>
                  <li>✅ Priority support</li>
                </ul>
              </div>
            </div>
            <div className="card bg-accent text-accent-content">
              <div className="card-body">
                <h3 className="card-title text-base">STUDIO</h3>
                <div className="text-3xl font-bold">$399</div>
                <p className="text-xs">/month</p>
                <div className="text-sm font-bold mt-2">75,000 credits</div>
                <ul className="text-xs mt-2 space-y-1">
                  <li>✅ Everything in Ultra</li>
                  <li>✅ API access</li>
                  <li>✅ Dedicated support</li>
                </ul>
              </div>
            </div>
          </div>

          <h2>Video Generation</h2>
          <div className="overflow-x-auto my-8">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Quality Tier</th>
                  <th>Resolution</th>
                  <th>5 sec</th>
                  <th>10 sec</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Professional</strong></td>
                  <td>1080p</td>
                  <td>50cr ($0.50)</td>
                  <td>100cr ($1.00)</td>
                </tr>
                <tr>
                  <td><strong>Premium</strong></td>
                  <td>4K</td>
                  <td>75cr ($0.75)</td>
                  <td>150cr ($1.50)</td>
                </tr>
                <tr>
                  <td><strong>Ultra</strong></td>
                  <td>4K Native</td>
                  <td>150cr ($1.50)</td>
                  <td>300cr ($3.00)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>Aspect Ratio Pricing</h3>
          <ul>
            <li>16:9 (landscape): Standard price</li>
            <li>9:16 (vertical): Standard price</li>
            <li>1:1 (square): Standard price</li>
            <li>4:3 (classic): Standard price</li>
            <li>21:9 (cinema): +15 credits</li>
          </ul>

          <h3>Multi-Format Bundles</h3>
          <div className="overflow-x-auto my-8">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Bundle</th>
                  <th>Formats</th>
                  <th>Credits</th>
                  <th>Savings</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Social Bundle</strong></td>
                  <td>16:9, 9:16, 1:1</td>
                  <td>120cr</td>
                  <td>30cr</td>
                </tr>
                <tr>
                  <td><strong>Filmmaker Bundle</strong></td>
                  <td>16:9, 21:9</td>
                  <td>100cr</td>
                  <td>15cr</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>Dialogue Generation</h2>
          <div className="overflow-x-auto my-8">
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
                  <td><strong>Standard</strong></td>
                  <td>≤8 sec</td>
                  <td>400</td>
                  <td>$4.00</td>
                </tr>
                <tr>
                  <td><strong>Extended</strong></td>
                  <td>9-12 sec</td>
                  <td>700</td>
                  <td>$7.00</td>
                </tr>
                <tr>
                  <td><strong>Cinema (+21:9)</strong></td>
                  <td>Any</td>
                  <td>+50</td>
                  <td>+$0.50</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>Image Generation</h2>
          <div className="overflow-x-auto my-8">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Model Type</th>
                  <th>Credits</th>
                  <th>USD</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Fast Models</strong></td>
                  <td>1-5</td>
                  <td>$0.01-$0.05</td>
                </tr>
                <tr>
                  <td><strong>Standard Models</strong></td>
                  <td>5-15</td>
                  <td>$0.05-$0.15</td>
                </tr>
                <tr>
                  <td><strong>Premium Models</strong></td>
                  <td>20-50</td>
                  <td>$0.20-$0.50</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>Credit Packs (Pay-as-you-go)</h2>
          <div className="overflow-x-auto my-8">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Pack</th>
                  <th>Credits</th>
                  <th>Price</th>
                  <th>Per Credit</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Starter</strong></td>
                  <td>1,000</td>
                  <td>$10</td>
                  <td>$0.01</td>
                </tr>
                <tr>
                  <td><strong>Creator</strong></td>
                  <td>5,000</td>
                  <td>$50</td>
                  <td>$0.01</td>
                </tr>
                <tr>
                  <td><strong>Pro</strong></td>
                  <td>10,000</td>
                  <td>$100</td>
                  <td>$0.01</td>
                </tr>
                <tr>
                  <td><strong>Studio</strong></td>
                  <td>50,000</td>
                  <td>$500</td>
                  <td>$0.01</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>Always Free</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <div className="card bg-success text-success-content">
              <div className="card-body">
                <h3 className="card-title text-base">No Credits Needed:</h3>
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>Screenplay editor (unlimited)</li>
                  <li>Timeline editor (unlimited)</li>
                  <li>Project storage (unlimited)</li>
                  <li>Exports (any format)</li>
                  <li>Collaboration features</li>
                  <li>Version control (GitHub)</li>
                </ul>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Credits Required For:</h3>
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>AI video generation</li>
                  <li>AI image generation</li>
                  <li>AI dialogue generation</li>
                  <li>AI audio/music generation</li>
                </ul>
              </div>
            </div>
          </div>

          <h2>What&apos;s Next?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <Link href="/help/credits" className="card bg-primary text-primary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Learn About Credits</h3>
                <p className="text-sm">How to get and manage credits</p>
              </div>
            </Link>
            <Link href="/dashboard" className="card bg-secondary text-secondary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Start Creating</h3>
                <p className="text-sm">Go to Dashboard</p>
              </div>
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}

