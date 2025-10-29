import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Welcome to ${config.appName}`,
  description: "Learn what Wryda.ai is, who it's for, and what you can create with our AI-powered video production platform.",
  canonicalUrlRelative: "/help/welcome",
});

export default function WelcomePage() {
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
            <li className="font-semibold">Welcome</li>
          </ul>
        </div>

        {/* Article */}
        <article className="prose prose-lg max-w-none">
          <h1>Welcome to Wryda.ai 👋</h1>
          <p className="lead">&quot;From screenplay to screen in minutes, not months.&quot;</p>

          <h2>What is Wryda.ai?</h2>
          <p>Wryda.ai is a complete AI-powered video production platform that combines:</p>
          <ul>
            <li>Professional screenplay writing tools</li>
            <li>AI-powered video generation (3 quality tiers)</li>
            <li>11 AI image generation models</li>
            <li>42 guided production workflows</li>
            <li>Professional timeline editor</li>
            <li>Audio and music generation</li>
            <li>Dialogue generation with lip-sync</li>
          </ul>

          <h2>Who is Wryda.ai For?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">✍️ Screenwriters</h3>
                <p className="text-sm">Write and visualize your scripts</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">🎬 Filmmakers</h3>
                <p className="text-sm">Pre-visualize scenes before shooting</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">🎨 Content Creators</h3>
                <p className="text-sm">Create high-volume social media content</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">📊 Marketing Teams</h3>
                <p className="text-sm">Generate video ads at scale</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">🏢 Agencies</h3>
                <p className="text-sm">Produce client content efficiently</p>
              </div>
            </div>
          </div>

          <h2>What Can You Create?</h2>
          <ul>
            <li><strong>Videos:</strong> 5-second to extended clips in any format (16:9, 9:16, 1:1, 4:3, 21:9)</li>
            <li><strong>Images:</strong> Character designs, storyboards, mood boards</li>
            <li><strong>Dialogue:</strong> Realistic character conversations with lip-sync</li>
            <li><strong>Audio:</strong> Music, sound effects, voice-overs</li>
            <li><strong>Complete Scenes:</strong> Multi-shot packages with consistency</li>
          </ul>

          <h2>How It Works</h2>
          <div className="steps steps-vertical lg:steps-horizontal my-8">
            <div className="step step-primary">
              <div className="text-left">
                <div className="font-bold">Write</div>
                <div className="text-sm opacity-70">Use our screenplay editor (unlimited, always free)</div>
              </div>
            </div>
            <div className="step step-primary">
              <div className="text-left">
                <div className="font-bold">Generate</div>
                <div className="text-sm opacity-70">Use credits to create AI videos, images, audio</div>
              </div>
            </div>
            <div className="step step-primary">
              <div className="text-left">
                <div className="font-bold">Edit</div>
                <div className="text-sm opacity-70">Timeline editor with Hollywood transitions</div>
              </div>
            </div>
            <div className="step step-primary">
              <div className="text-left">
                <div className="font-bold">Export</div>
                <div className="text-sm opacity-70">Download in any format, any resolution (up to 8K)</div>
              </div>
            </div>
          </div>

          <h2>Credit System (Simple & Fair)</h2>
          <div className="alert alert-info my-8">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <h3 className="font-bold">1 credit = $0.01 USD</h3>
              <div className="text-sm">Simple, transparent, fair.</div>
            </div>
          </div>

          <ul>
            <li>Free users: 50 credits on signup + 10/month</li>
            <li>Subscriptions: 3,000 - 50,000 credits/month</li>
            <li>Credits never expire</li>
            <li>No hidden fees</li>
          </ul>

          <h3>Example Costs:</h3>
          <div className="overflow-x-auto my-8">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Credits</th>
                  <th>USD</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Professional video (5sec)</td>
                  <td>50</td>
                  <td>$0.50</td>
                </tr>
                <tr>
                  <td>Image generation</td>
                  <td>5</td>
                  <td>$0.05</td>
                </tr>
                <tr>
                  <td>Dialogue (8sec)</td>
                  <td>400</td>
                  <td>$4.00</td>
                </tr>
                <tr>
                  <td>Social Bundle (3 formats)</td>
                  <td>120</td>
                  <td>$1.20</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>Next Steps</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <Link href="/help/quick-start" className="card bg-primary text-primary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title">Create Your First Video 🚀</h3>
                <p className="text-sm">5-minute tutorial to get started</p>
              </div>
            </Link>
            <Link href="/help/quality-tiers" className="card bg-secondary text-secondary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title">Understand Quality Tiers 🎬</h3>
                <p className="text-sm">Choose the right quality level</p>
              </div>
            </Link>
            <Link href="/help/workflows" className="card bg-accent text-accent-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title">Explore Workflows ⚡</h3>
                <p className="text-sm">Discover guided production tools</p>
              </div>
            </Link>
            <Link href="/dashboard" className="card bg-base-200 hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title">Go to Dashboard 📊</h3>
                <p className="text-sm">Start creating now</p>
              </div>
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}

