import Link from "next/link";
import Image from "next/image";
import config from "@/config";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <>
      {/* Header */}
      <header className="p-4 flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-extrabold">
            {config.appName}<span className="text-[#DC143C]">.ai</span>
          </span>
        </Link>
        <Link href="/sign-in" className="btn btn-ghost">
          Login
        </Link>
      </header>

      <main>
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center text-center gap-8 px-8 py-16 max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-base-200 text-sm">
            <span className="font-semibold">Founded 2025</span>
            <span className="opacity-60">•</span>
            <span className="opacity-80">Early Access</span>
            <span className="opacity-60">•</span>
            <span className="opacity-80">Building With Creators</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Professional Tools for Screenwriters,
            <br />
            Filmmakers & Creators
          </h1>

          <p className="text-xl md:text-2xl opacity-90 max-w-3xl">
            58 AI Workflows + 68 Professional Compositions + Cinema-Grade HDR
            <br />
            <strong className="text-[#DC143C]">The Complete Production Pipeline: Write → Export</strong>
          </p>

          {/* Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl text-left mt-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <strong>Software is 100% FREE</strong>
                <p className="text-sm opacity-70">58 workflows, 68 compositions, 30 transitions, 8-track timeline - $0 forever</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <strong>All Quality Tiers Unlocked</strong>
                <p className="text-sm opacity-70">Professional 1080p, Premium 4K, Ultra Native 4K - no paywalls</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <strong>Only Pay for AI Compute</strong>
                <p className="text-sm opacity-70">Pay-as-you-go credits. No subscriptions. No software fees.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <strong>No Vendor Lock-In</strong>
                <p className="text-sm opacity-70">Export to Google Drive or Dropbox, own your data</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link
              className="btn btn-primary btn-lg"
              href="/sign-up"
            >
              Get 100 Free Credits →
            </Link>
            <Link
              className="btn btn-outline btn-lg"
              href="#pricing"
            >
              See Pricing
            </Link>
          </div>

          <p className="text-sm opacity-60 mt-2">
            All features unlocked on signup. No credit card required.
          </p>
        </section>

        {/* Revolutionary Features Banner */}
        <section className="bg-base-200 py-16">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                🌟 Industry-First Technology
              </h2>
              <p className="text-lg opacity-80 max-w-3xl mx-auto">
                <strong>The ONLY platform with cinema-grade HDR upgrade.</strong> Convert videos from any AI tool, your camera, or stock footage to professional 16-bit HDR.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="text-4xl mb-2">🔄</div>
                  <h3 className="card-title text-lg">Seamless Timeline ↔ Composition</h3>
                  <p className="text-sm opacity-80">
                    Round-trip editing without data loss. Edit in composition, changes sync to timeline automatically.
                  </p>
                </div>
              </div>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="text-4xl mb-2">🤖</div>
                  <h3 className="card-title text-lg">Intelligent Quality Optimization</h3>
                  <p className="text-sm opacity-80">
                    Smart scene analysis automatically optimizes quality for each shot. Professional results, minimal effort.
                  </p>
                </div>
              </div>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="text-4xl mb-2">📝</div>
                  <h3 className="card-title text-lg">Screenplay-Driven Builder</h3>
                  <p className="text-sm opacity-80">
                    Generate complete scenes directly from script. Intelligent scene analysis, no wasted credits.
                  </p>
                </div>
              </div>

              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="text-4xl mb-2">🎨</div>
                  <h3 className="card-title text-lg">Cinema-Grade HDR Upgrade</h3>
                  <p className="text-sm opacity-80">
                    Convert ANY video to 16-bit HDR. The ONLY platform that can upgrade videos from other AI tools to cinema quality.
                  </p>
                  <div className="badge badge-error gap-1 mt-2">🔥 Exclusive</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* NEW: Data Ownership & Collaboration Section */}
        <section className="py-16 px-8 max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-base-200 to-base-300 rounded-box p-8 md:p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">🔐 You Own Everything</h2>
              <p className="text-xl opacity-90 max-w-3xl mx-auto mb-2">
                Unlike other platforms that lock your content behind proprietary formats,
                <strong className="text-[#DC143C]"> your data stays in YOUR cloud</strong>
              </p>
              <p className="text-lg opacity-70">
                We streamlined GitHub for writers - manage everything from the software, no technical expertise needed
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* GitHub for Scripts & Timelines */}
              <div className="card bg-base-100 shadow-lg hover:shadow-2xl transition-shadow">
                <div className="card-body">
                  <div className="text-5xl mb-3">📚</div>
                  <h3 className="card-title text-xl mb-2">GitHub Version Control</h3>
                  <p className="text-sm opacity-80 mb-4">
                    Screenplay + Timeline backed up to <strong>YOUR GitHub repository</strong> every 10 seconds.
                    Full version history, branch management, revert anytime.
                  </p>
                  <div className="space-y-2 text-xs opacity-70">
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Auto-save every 10 seconds</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Complete Git version history</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Open JSON format (future-proof)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Zero vendor lock-in</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Google Drive & Dropbox for Media */}
              <div className="card bg-base-100 shadow-lg hover:shadow-2xl transition-shadow">
                <div className="card-body">
                  <div className="text-5xl mb-3">☁️</div>
                  <h3 className="card-title text-xl mb-2">Your Cloud Storage</h3>
                  <p className="text-sm opacity-80 mb-4">
                    Videos, audio, images stored in <strong>YOUR Google Drive or Dropbox</strong>.
                    We store files for 7 days max, then YOU choose where they go.
                  </p>
                  <div className="space-y-2 text-xs opacity-70">
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Choose Google Drive or Dropbox</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>100% off-site (your account)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>No files locked on our servers</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Export/switch anytime</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Collaboration Roles */}
              <div className="card bg-base-100 shadow-lg hover:shadow-2xl transition-shadow">
                <div className="card-body">
                  <div className="text-5xl mb-3">👥</div>
                  <h3 className="card-title text-xl mb-2">6 Collaboration Roles</h3>
                  <p className="text-sm opacity-80 mb-4">
                    <strong>Manage everything from the software</strong> - no GitHub expertise needed.
                    Add teammates in seconds.
                  </p>
                  <div className="space-y-2 text-xs opacity-70">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">🎬</span>
                      <div>
                        <strong>Director</strong> - Full access (script + assets)
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-lg">✍️</span>
                      <div>
                        <strong>Writer</strong> - Edit screenplay + timeline
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-lg">🎨</span>
                      <div>
                        <strong>Contributor</strong> - Manage assets
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-lg">👁️</span>
                      <div>
                        <strong>Viewer</strong> - Read-only access
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-6">
              <p className="text-lg font-semibold mb-4">
                💡 <strong>We streamlined GitHub for writers</strong> - no technical knowledge required
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/features" className="btn btn-primary">
                  See All Features →
                </Link>
                <Link href="/team" className="btn btn-outline">
                  Learn About Collaboration
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Savings Calculator */}
        <section className="py-16 px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
              End Subscription Fatigue
            </h2>
            <p className="text-xl opacity-90 max-w-3xl mx-auto mb-2">
              <strong>Our software is 100% free.</strong> You only pay for the AI services you actually use.
            </p>
            <p className="text-lg opacity-70 max-w-2xl mx-auto">
              While competitors charge $1,776/year just for software licenses, we give you everything for <strong>$0</strong>. Zero subscriptions. Zero licensing fees. Just pay-as-you-go for AI.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Traditional Stack */}
            <div className="card bg-gradient-to-br from-error/20 to-error/10 shadow-xl border-2 border-error/30">
              <div className="card-body">
                <div className="badge badge-error mb-2">The Old Way 😫</div>
                <h3 className="card-title text-2xl mb-2">Traditional Stack</h3>
                <p className="text-sm opacity-70 mb-4">6 separate subscriptions. $1,776/year in software fees. <strong>BEFORE</strong> you even start creating.</p>
                
                <ul className="space-y-3">
                  <li className="flex justify-between items-center">
                    <span className="opacity-80">Final Draft (Screenwriting)</span>
                    <span className="font-semibold">$250/yr</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="opacity-80">Adobe Premiere Pro (Video Editing)</span>
                    <span className="font-semibold">$263/yr</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="opacity-80">Adobe After Effects (VFX/Motion Graphics)</span>
                    <span className="font-semibold">$263/yr</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="opacity-80">Stock footage (Artgrid/Storyblocks)</span>
                    <span className="font-semibold">$500/yr</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="opacity-80">Stock music/SFX (Epidemic Sound)</span>
                    <span className="font-semibold">$300/yr</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="opacity-80">Cloud storage (200GB+)</span>
                    <span className="font-semibold">$200/yr</span>
                  </li>
                  <li className="border-t border-error/30 pt-3 flex justify-between items-center">
                    <span className="font-bold text-lg">Software Fees Alone</span>
                    <span className="font-bold text-2xl text-error">$1,776/yr</span>
                  </li>
                  <li className="text-xs opacity-60 italic">
                    ⚠️ Plus you still need to pay for AI services on top of this
                  </li>
                </ul>
              </div>
            </div>

            {/* Wryda Revolutionary Model */}
            <div className="card bg-gradient-to-br from-success/20 to-primary/20 shadow-xl border-2 border-success">
              <div className="card-body">
                <div className="badge badge-success mb-2">The Future ✨</div>
                <h3 className="card-title text-2xl mb-2">{config.appName}: Software is FREE</h3>
                <p className="text-sm opacity-80 mb-4">
                  <strong>All features. All tools. All workflows.</strong> Unlock everything for <span className="text-success font-bold">$0/year</span> in software fees. Only pay for AI when you use it.
                </p>
                
                <ul className="space-y-3">
                  <li className="flex justify-between items-center">
                    <span className="font-semibold">✅ Professional Screenplay Editor</span>
                    <span className="font-bold text-success">FREE</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="font-semibold">✅ 8-Track Timeline Editor</span>
                    <span className="font-bold text-success">FREE</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="font-semibold">✅ 65 Compositions + 30 Transitions</span>
                    <span className="font-bold text-success">FREE</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="font-semibold">✅ Character Bank</span>
                    <span className="font-bold text-success">FREE</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="font-semibold">✅ Upload Your Own Footage</span>
                    <span className="font-bold text-success">FREE</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="font-semibold">✅ Cloud Export (Drive/Dropbox)</span>
                    <span className="font-bold text-success">FREE</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="font-semibold">✅ 47 AI Workflows</span>
                    <span className="font-bold text-success">FREE</span>
                  </li>
                  <li className="border-t border-success/30 pt-3 flex justify-between items-center">
                    <span className="font-bold text-lg">Software Cost</span>
                    <span className="font-bold text-3xl text-success">$0/yr</span>
                  </li>
                  <li className="text-sm font-semibold text-success">
                    💰 Save $1,776/year in subscription fees!
                  </li>
                </ul>

                <div className="divider text-sm opacity-70">How Payment Works</div>
                <div className="bg-base-200 rounded-lg p-4 space-y-2">
                  <p className="text-sm"><strong>Free Plan:</strong> 100 signup credits + 10 credits/month</p>
                  <p className="text-sm"><strong>Pro Plan ($29/mo):</strong> 3,000 credits/month when you need more</p>
                  <p className="text-sm"><strong>Ultra Plan ($149/mo):</strong> 20,000 credits/month for production</p>
                  <p className="text-sm"><strong>Studio Plan ($399/mo):</strong> 75,000 credits/month for teams</p>
                  <p className="text-xs opacity-60 italic mt-3">
                    You&apos;re only paying for AI compute. Everything else? Completely free forever.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="card bg-gradient-to-r from-primary/10 to-secondary/10 shadow-xl border-2 border-primary/30 max-w-4xl mx-auto">
              <div className="card-body">
                <h3 className="text-2xl font-bold mb-4">🚀 The Revolution: Pay for Value, Not Access</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                  <div>
                    <div className="text-error font-bold mb-2">❌ Old Model</div>
                    <ul className="text-sm space-y-1 opacity-80">
                      <li>• Pay for software licenses</li>
                      <li>• Monthly subscription treadmill</li>
                      <li>• Paying even when not using</li>
                      <li>• Expensive barriers to entry</li>
                    </ul>
                  </div>
                  <div>
                    <div className="text-success font-bold mb-2">✅ {config.appName} Model</div>
                    <ul className="text-sm space-y-1 opacity-80">
                      <li>• Software is 100% free</li>
                      <li>• Pay only for AI you use</li>
                      <li>• Credits never expire</li>
                      <li>• Start creating immediately</li>
                    </ul>
                  </div>
                  <div>
                    <div className="text-primary font-bold mb-2">💡 Your Savings</div>
                    <ul className="text-sm space-y-1 opacity-80">
                      <li>• $0 software costs</li>
                      <li>• No subscription fatigue</li>
                      <li>• Only pay when creating</li>
                      <li>• <strong className="text-success">Save $1,776/year</strong></li>
                    </ul>
                  </div>
                </div>
                <div className="mt-6">
                  <Link href="/sign-up" className="btn btn-primary btn-lg">
                    Start Free - No Credit Card Required
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <Pricing />

        {/* What You Get Section */}
        <section className="py-16 px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What&apos;s Included (For Everyone)
            </h2>
            <p className="text-lg opacity-80">
              Every tier gets full access. The only difference is credits per month.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-xl mb-4">🎬 Video Quality Tiers</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Professional 1080p</strong> - 50 credits per 5s</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Premium 4K</strong> - 75 credits per 5s</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Ultra Native 4K</strong> - 150 credits per 5s</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-xl mb-4">📐 Aspect Ratios</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>16:9</strong> - Landscape (YouTube, Web)</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>9:16</strong> - Vertical (TikTok, Reels)</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>1:1</strong> - Square (Instagram)</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>4:3</strong> - Classic (Facebook)</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>21:9</strong> - Cinema (+15 credits)</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-xl mb-4">✨ All Features</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Professional Screenplay Editor</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Video Timeline Editor (8 tracks)</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>65 Compositions + 30 Transitions (FREE)</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span><strong>Upload Your Own Footage</strong> (FREE)</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Character Bank (consistent characters)</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>3D Model Export (20 credits per export)</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Voice Cloning (FREE - bring your 11 Labs voice)</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Cloud Storage (Drive/Dropbox)</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-lg font-semibold text-[#DC143C]">
              Free users get ALL of this. Pro/Ultra/Studio just get more credits.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <FAQ />
      </main>

      {/* Footer */}
      <Footer />
    </>
  );
}
