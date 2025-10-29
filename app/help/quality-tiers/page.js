import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Understanding Quality Tiers | ${config.appName}`,
  description: "Learn about our three video quality tiers - Professional 1080p, Premium 4K, and Ultra Native 4K - and choose the right one for your needs.",
  canonicalUrlRelative: "/help/quality-tiers",
});

export default function QualityTiersPage() {
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
            <li className="font-semibold">Quality Tiers</li>
          </ul>
        </div>

        {/* Article */}
        <article className="prose prose-lg max-w-none">
          <h1>Understanding Quality Tiers 🎬</h1>
          <p className="lead">All users can access all quality tiers - you just pay different credit amounts.</p>

          <h2>The Three Tiers</h2>

          {/* Professional Tier */}
          <div className="card bg-base-200 my-8 not-prose">
            <div className="card-body">
              <div className="flex justify-between items-start">
                <h3 className="card-title text-2xl">Professional (1080p)</h3>
                <div className="badge badge-lg badge-primary">50 credits</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm my-4">
                <div><strong>Resolution:</strong> 1920×1080 (Full HD)</div>
                <div><strong>Speed:</strong> Fast (60-90 seconds)</div>
                <div><strong>Best For:</strong> Social media, YouTube</div>
                <div><strong>Quality:</strong> Broadcast-ready, clean, sharp</div>
              </div>
              
              <h4 className="font-bold mt-4">When to Use:</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Testing prompts before going high-res</li>
                <li>High-volume content creation</li>
                <li>Social media posts</li>
                <li>YouTube videos</li>
                <li>Marketing content</li>
              </ul>
              
              <div className="alert alert-success mt-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span className="text-sm"><strong>Our best value!</strong> Great quality at lowest cost.</span>
              </div>
            </div>
          </div>

          {/* Premium Tier */}
          <div className="card bg-base-200 my-8 not-prose">
            <div className="card-body">
              <div className="flex justify-between items-start">
                <h3 className="card-title text-2xl">Premium (4K)</h3>
                <div className="badge badge-lg badge-secondary">75 credits</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm my-4">
                <div><strong>Resolution:</strong> 3840×2160 (4K UHD)</div>
                <div><strong>Speed:</strong> Medium (90-120 seconds)</div>
                <div><strong>Best For:</strong> Client deliverables</div>
                <div><strong>Quality:</strong> Cinema-grade, excellent detail</div>
              </div>
              
              <h4 className="font-bold mt-4">When to Use:</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Client work requiring 4K</li>
                <li>Commercial advertisements</li>
                <li>Corporate videos</li>
                <li>High-end YouTube content</li>
                <li>Video portfolios</li>
              </ul>
              
              <h4 className="font-bold mt-4">Upgrade From Professional:</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>50% more credits</li>
                <li>4× the resolution</li>
                <li>Better fine details</li>
              </ul>
            </div>
          </div>

          {/* Ultra Tier */}
          <div className="card bg-base-200 my-8 not-prose">
            <div className="card-body">
              <div className="flex justify-between items-start">
                <h3 className="card-title text-2xl">Ultra Native 4K</h3>
                <div className="badge badge-lg badge-accent">150 credits</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm my-4">
                <div><strong>Resolution:</strong> 3840×2160 (Native 4K)</div>
                <div><strong>Speed:</strong> Slower (120-180 seconds)</div>
                <div><strong>Best For:</strong> Film festivals, cinema</div>
                <div><strong>Quality:</strong> Hollywood-grade, maximum fidelity</div>
              </div>
              
              <h4 className="font-bold mt-4">When to Use:</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Film festival submissions</li>
                <li>Cinema screenings</li>
                <li>Premium client deliverables</li>
                <li>Archival quality needed</li>
                <li>Absolute best quality required</li>
              </ul>
              
              <h4 className="font-bold mt-4">Technical Difference:</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Native 4K generation (not upscaled)</li>
                <li>Superior detail and sharpness</li>
                <li>Best for large screens</li>
                <li>Professional color grading</li>
              </ul>
            </div>
          </div>

          <h2>Quality Comparison</h2>
          <div className="overflow-x-auto my-8">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Professional</th>
                  <th>Premium</th>
                  <th>Ultra</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Resolution</strong></td>
                  <td>1080p</td>
                  <td>4K</td>
                  <td>4K Native</td>
                </tr>
                <tr>
                  <td><strong>Credits</strong></td>
                  <td>50</td>
                  <td>75</td>
                  <td>150</td>
                </tr>
                <tr>
                  <td><strong>USD</strong></td>
                  <td>$0.50</td>
                  <td>$0.75</td>
                  <td>$1.50</td>
                </tr>
                <tr>
                  <td><strong>Generation Time</strong></td>
                  <td>60-90s</td>
                  <td>90-120s</td>
                  <td>120-180s</td>
                </tr>
                <tr>
                  <td><strong>Best For</strong></td>
                  <td>Social</td>
                  <td>Commercial</td>
                  <td>Cinema</td>
                </tr>
                <tr>
                  <td><strong>Pixel Count</strong></td>
                  <td>2.1M</td>
                  <td>8.3M</td>
                  <td>8.3M</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>How to Choose</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 not-prose my-8">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Choose Professional if:</h3>
                <ul className="text-sm space-y-1">
                  <li>✅ Creating for social media</li>
                  <li>✅ Testing prompts/workflows</li>
                  <li>✅ High volume needed</li>
                  <li>✅ Budget conscious</li>
                  <li>✅ Speed matters</li>
                </ul>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Choose Premium if:</h3>
                <ul className="text-sm space-y-1">
                  <li>✅ Client requires 4K</li>
                  <li>✅ Commercial use</li>
                  <li>✅ Better quality needed</li>
                  <li>✅ Medium budget</li>
                </ul>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Choose Ultra if:</h3>
                <ul className="text-sm space-y-1">
                  <li>✅ Film festival submission</li>
                  <li>✅ Cinema screening</li>
                  <li>✅ Absolute best quality</li>
                  <li>✅ Large display (&gt;50&quot;)</li>
                  <li>✅ Premium client</li>
                </ul>
              </div>
            </div>
          </div>

          <h2>Pro Workflow</h2>
          <div className="alert alert-info my-8">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <div className="font-bold">Many professionals do this:</div>
              <ol className="text-sm list-decimal list-inside mt-2">
                <li><strong>Test with Professional</strong> (50cr) - Verify prompt works</li>
                <li><strong>Refine prompt</strong> - Adjust based on results</li>
                <li><strong>Final with Ultra</strong> (150cr) - Generate final at highest quality</li>
              </ol>
              <div className="text-sm mt-2"><strong>Saves:</strong> 100+ credits per project by not wasting Ultra credits on tests.</div>
            </div>
          </div>

          <h2>Multi-Format Pricing</h2>
          <p>All formats cost the same within each tier:</p>
          <ul>
            <li>16:9 (landscape): Same price</li>
            <li>9:16 (vertical): Same price</li>
            <li>1:1 (square): Same price</li>
            <li>4:3 (classic): Same price</li>
            <li>21:9 (cinema): +15 credits premium</li>
          </ul>

          <div className="alert alert-success my-8">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <div className="font-bold">Social Bundle (120cr)</div>
              <div className="text-sm">Get 16:9 + 9:16 + 1:1 all at once! Saves 30 credits vs. separate generation.</div>
            </div>
          </div>

          <h2>What&apos;s Next?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <Link href="/help/credits" className="card bg-primary text-primary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Learn About Credits</h3>
                <p className="text-sm">How to get and use credits</p>
              </div>
            </Link>
            <Link href="/help/video-generation" className="card bg-secondary text-secondary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Video Generation Guide</h3>
                <p className="text-sm">Master video creation</p>
              </div>
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}

