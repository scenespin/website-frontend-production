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
            Your Camera Footage + AI-Generated Shots (VFX, B-roll, locations) + Hollywood Transitions & Compositions
            <br />
            <strong className="text-[#DC143C]">= Professional Film at 1% Cost</strong>
          </p>

          {/* Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl text-left mt-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <strong>All Tools FREE</strong>
                <p className="text-sm opacity-70">Screenplay editor, timeline, 65+ compositions, 30 transitions</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <strong>All Quality Tiers</strong>
                <p className="text-sm opacity-70">Professional 1080p, Premium 4K, Ultra Native 4K</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <strong>All Aspect Ratios</strong>
                <p className="text-sm opacity-70">16:9, 9:16, 1:1, 4:3, 21:9 - choose what fits your project</p>
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
                🌟 Industry-Leading Technology
              </h2>
              <p className="text-lg opacity-80">
                No other platform has these features. This is revolutionary.
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
                  <div className="text-4xl mb-2">⚡</div>
                  <h3 className="card-title text-lg">95% Time Savings</h3>
                  <p className="text-sm opacity-80">
                    Intelligent automation eliminates repetitive tasks entirely. Professional workflows built-in.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Savings Calculator */}
        <section className="py-16 px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Save $1,223+/Year vs Traditional Stack
            </h2>
            <p className="text-lg opacity-80">
              One platform. Everything included. No subscriptions to juggle.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Traditional Stack */}
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <h3 className="card-title text-2xl mb-4">Traditional Stack: $1,776/year</h3>
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
                  <li className="border-t border-base-content/20 pt-3 flex justify-between items-center">
                    <span className="font-bold text-xl">Total</span>
                    <span className="font-bold text-2xl text-error">$1,776/yr</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Wryda All-In-One */}
            <div className="card bg-gradient-to-br from-primary/20 to-secondary/20 shadow-xl border-2 border-primary">
              <div className="card-body">
                <div className="badge badge-primary mb-2">All-In-One Solution</div>
                <h3 className="card-title text-2xl mb-4">{config.appName}: From $0</h3>
                <ul className="space-y-3">
                  <li className="flex justify-between items-center">
                    <span className="font-semibold">Free Plan</span>
                    <span className="font-bold text-2xl text-success">$0</span>
                  </li>
                  <li className="text-sm opacity-80 pl-4">
                    100 signup + 10 credits/month • All features unlocked
                  </li>
                  
                  <li className="flex justify-between items-center pt-3">
                    <span className="font-semibold">Pro Plan</span>
                    <span className="font-bold text-xl">$29/mo</span>
                  </li>
                  <li className="text-sm opacity-80 pl-4">
                    3,000 credits/mo • Same features, more credits
                  </li>
                  <li className="text-sm text-success font-semibold pl-4">
                    💰 Save $1,428/year (80% savings!)
                  </li>

                  <li className="flex justify-between items-center pt-3">
                    <span className="font-semibold">Ultra Plan</span>
                    <span className="font-bold text-xl">$149/mo</span>
                  </li>
                  <li className="text-sm opacity-80 pl-4">
                    20,000 credits/mo • Production volume
                  </li>
                  <li className="text-sm text-success font-semibold pl-4">
                    💰 Save $660/year + 10x more credits
                  </li>

                  <li className="flex justify-between items-center pt-3">
                    <span className="font-semibold">Studio Plan</span>
                    <span className="font-bold text-xl">$399/mo</span>
                  </li>
                  <li className="text-sm opacity-80 pl-4">
                    75,000 credits/mo • Enterprise teams
                  </li>
                </ul>

                <div className="divider">What You Get</div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-success shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>All the tools above + AI generation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-success shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>65 Compositions (split screens, PIP, grids) + 30 Transitions (FREE)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-success shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong>Upload your own footage</strong> (FREE)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-success shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>No vendor lock-in, export anywhere</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-2xl font-bold text-success mb-4">
              Replace 6+ tools with one platform. Save thousands.
            </p>
            <Link href="#pricing" className="btn btn-primary btn-lg">
              See Full Pricing Details
            </Link>
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
