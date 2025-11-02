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
            58 AI Workflows + 68 Professional Compositions<br className="hidden sm:block" /> + Cinema-Grade HDR
            <br />
            <strong className="text-[#DC143C]">The Complete Production Pipeline:<br className="hidden md:block" /> Write → Export</strong>
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
                <p className="text-sm opacity-70">Export to Google Drive, Dropbox, or GitHub - own your data</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link
              className="btn btn-primary btn-lg"
              href="/sign-up"
            >
              Get 50 Free Credits →
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
                    Convert ANY video to 16-bit HDR. The ONLY platform that can upgrade videos from ANY tools to cinema quality.
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
                Unlike other platforms that lock your content behind proprietary formats,<br className="hidden md:block" />
                <strong className="text-[#DC143C]">YOUR data stays in YOUR cloud</strong>
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
                  <h3 className="card-title text-xl mb-2">5 Collaboration Roles</h3>
                  <p className="text-sm opacity-80 mb-4">
                    <strong>Manage everything from the software</strong> - no GitHub expertise needed.
                    Add teammates in seconds. <strong>Permissions sync across GitHub + your cloud storage automatically.</strong>
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
                        <strong>Writer</strong> - Edit screenplay + AI agents
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-lg">🎬</span>
                      <div>
                        <strong>Asset Manager</strong> - Generate & manage assets
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-lg">🎨</span>
                      <div>
                        <strong>Contributor</strong> - Upload assets only
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
                <Link href="/help/collaboration" className="btn btn-outline">
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
                <p className="text-sm opacity-70 mb-3">6 separate subscriptions. $1,776/year in software fees. <strong>BEFORE</strong> you even start creating.</p>
                
                <ul className="space-y-2">
                  <li className="flex justify-between items-center text-sm">
                    <span className="opacity-80">Final Draft</span>
                    <span className="font-semibold">$250/yr</span>
                  </li>
                  <li className="flex justify-between items-center text-sm">
                    <span className="opacity-80">Adobe Premiere</span>
                    <span className="font-semibold">$263/yr</span>
                  </li>
                  <li className="flex justify-between items-center text-sm">
                    <span className="opacity-80">Adobe After Effects</span>
                    <span className="font-semibold">$263/yr</span>
                  </li>
                  <li className="flex justify-between items-center text-sm">
                    <span className="opacity-80">Stock footage</span>
                    <span className="font-semibold">$500/yr</span>
                  </li>
                  <li className="flex justify-between items-center text-sm">
                    <span className="opacity-80">Stock music/SFX</span>
                    <span className="font-semibold">$300/yr</span>
                  </li>
                  <li className="flex justify-between items-center text-sm">
                    <span className="opacity-80">Cloud storage</span>
                    <span className="font-semibold">$200/yr</span>
                  </li>
                  <li className="border-t border-error/30 pt-2 mt-2 flex justify-between items-center">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-xl text-error">$1,776/yr</span>
                  </li>
                  <li className="text-xs opacity-60 italic">
                    ⚠️ Plus you still need to pay for AI services
                  </li>
                </ul>
              </div>
            </div>

            {/* Wryda Revolutionary Model */}
            <div className="card bg-gradient-to-br from-success/20 to-primary/20 shadow-xl border-2 border-success">
              <div className="card-body">
                <div className="badge badge-success mb-2">The Future ✨</div>
                <h3 className="card-title text-2xl mb-2">{config.appName}: Software is FREE</h3>
                <p className="text-sm opacity-80 mb-3">
                  <strong>All features. All tools. All workflows.</strong> Everything unlocked for <span className="text-success font-bold">$0/year</span>. Only pay for AI when you use it.
                </p>
                
                <ul className="space-y-2">
                  <li className="flex justify-between items-center text-sm">
                    <span className="font-semibold">✅ Screenplay Editor</span>
                    <span className="font-bold text-success">FREE</span>
                  </li>
                  <li className="flex justify-between items-center text-sm">
                    <span className="font-semibold">✅ 8-Track Timeline</span>
                    <span className="font-bold text-success">FREE</span>
                  </li>
                  <li className="flex justify-between items-center text-sm">
                    <span className="font-semibold">✅ 68 Compositions</span>
                    <span className="font-bold text-success">FREE</span>
                  </li>
                  <li className="flex justify-between items-center text-sm">
                    <span className="font-semibold">✅ Character Bank</span>
                    <span className="font-bold text-success">FREE</span>
                  </li>
                  <li className="flex justify-between items-center text-sm">
                    <span className="font-semibold">✅ Upload Footage</span>
                    <span className="font-bold text-success">FREE</span>
                  </li>
                  <li className="flex justify-between items-center text-sm">
                    <span className="font-semibold">✅ Cloud Export</span>
                    <span className="font-bold text-success">FREE</span>
                  </li>
                  <li className="flex justify-between items-center text-sm">
                    <span className="font-semibold">✅ 58 AI Workflows</span>
                    <span className="font-bold text-success">FREE</span>
                  </li>
                  <li className="border-t border-success/30 pt-2 mt-2 flex justify-between items-center">
                    <span className="font-bold">Software Cost</span>
                    <span className="font-bold text-xl text-success">$0/yr</span>
                  </li>
                  <li className="text-sm font-semibold text-success">
                    💰 Save $1,776/year!
                  </li>
                </ul>
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

        {/* Professional Screenplay Editor Section */}
        <section className="py-20 bg-gradient-to-b from-base-100 to-base-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                ✍️ Professional Screenplay Editor
              </h2>
              <p className="text-xl opacity-80 max-w-3xl mx-auto">
                Industry-standard Fountain formatting with contextual navigation that keeps you in flow state. 
                <strong className="text-[#DC143C]"> Write, visualize, and produce—all in one seamless workspace.</strong>
              </p>
              <p className="text-lg opacity-90 max-w-3xl mx-auto mt-4 px-4 py-3 bg-primary/10 rounded-lg border border-primary/20">
                💡 <strong>Even if you never generate video:</strong> Free GitHub backup, auto-organization, 
                and 5,000 AI rewrites make this worth trying. Everything else is a bonus.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {/* Feature 1 */}
              <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="card-body">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="card-title mb-2">Contextual Navigation™</h3>
                  <p className="opacity-80">
                    Your cursor position syncs across every page. Jump from Scene 5 in the editor 
                    to see Scene 5's characters instantly. Stay in flow state.
                  </p>
                  <div className="badge badge-primary mt-2">Exclusive to Wryda</div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="card-body">
                  <div className="text-4xl mb-4">✨</div>
                  <h3 className="card-title mb-2">AI Writing Agents (Practically Free)</h3>
                  <p className="opacity-80">
                    Select text → AI rewrites it. Polish dialogue, expand scenes, improve pacing. 
                    <strong className="text-primary"> Costs almost nothing—50 free credits = thousands of rewrites.</strong>
                  </p>
                  <div className="text-xs opacity-70 mt-2">💰 Screenwriter agent: 0.01 credits per use</div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="card-body">
                  <div className="text-4xl mb-4">⚡</div>
                  <h3 className="card-title mb-2">Industry-Standard Formatting</h3>
                  <p className="opacity-80">
                    Professional Fountain syntax with smart auto-formatting. 
                    Tab for characters, Shift+Tab for scene headings. Export to PDF instantly.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="card-body">
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="card-title mb-2">Story Beat Integration</h3>
                  <p className="opacity-80">
                    Organize scenes with 3-act structure. Visual story flow overview 
                    with proven beat sheets keeps your narrative on track.
                  </p>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="card-body">
                  <div className="text-4xl mb-4">🎬</div>
                  <h3 className="card-title mb-2">Scene Navigator</h3>
                  <p className="opacity-80">
                    Collapsible sidebar shows all scenes at a glance. 
                    Auto-highlights current scene with character and location badges.
                  </p>
                </div>
              </div>

              {/* Feature 6 */}
              <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="card-body">
                  <div className="text-4xl mb-4">📋</div>
                  <h3 className="card-title mb-2">Import & Auto-Populate</h3>
                  <p className="opacity-80">
                    Paste any Fountain screenplay—it auto-extracts characters, locations, and scenes. 
                    Instantly ready for video generation and production.
                  </p>
                  <div className="badge badge-primary mt-2">Works with Final Draft, Celtx, Fade In</div>
                </div>
              </div>

              {/* Feature 7 */}
              <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="card-body">
                  <div className="text-4xl mb-4">💾</div>
                  <h3 className="card-title mb-2">Auto-Save + Free PDF Export</h3>
                  <p className="opacity-80">
                    Saves every 2 seconds automatically. Export to professional PDF 
                    with custom watermarks—100% FREE, no plan gating.
                  </p>
                </div>
              </div>
            </div>

            {/* Import Callout */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-box p-8 mb-8 border-2 border-primary/20">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="text-6xl">🚀</div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold mb-2">Already Have a Script?</h3>
                  <p className="text-lg opacity-90 mb-3">
                    <strong>Paste your Fountain screenplay from Final Draft, Celtx, or Fade In</strong> and get instant value:
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 mb-3">
                    <div className="space-y-2">
                      <div className="font-semibold text-sm opacity-70">🎬 Auto-Extract Everything:</div>
                      <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        <div className="badge badge-sm badge-primary">👥 All Characters</div>
                        <div className="badge badge-sm badge-secondary">📍 All Locations</div>
                        <div className="badge badge-sm badge-accent">🎬 All Scenes</div>
                        <div className="badge badge-sm badge-info">📊 Story Beats</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-semibold text-sm opacity-70">✨ AI Writing Agents (0.01 credits/use):</div>
                      <div className="text-sm opacity-90">
                        <strong className="text-primary">50 free credits = 5,000 AI rewrites.</strong> Polish dialogue, 
                        expand scenes, fix grammar. Costs practically nothing compared to video generation.
                      </div>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 mb-3">
                    <div className="space-y-2">
                      <div className="font-semibold text-sm opacity-70">📚 GitHub Backup (Free!):</div>
                      <div className="text-sm opacity-90">
                        Set up your GitHub repository in <strong className="text-primary">under 2 minutes</strong>. 
                        Auto-save every 10 seconds. Full version history. Never lose your work again.
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-semibold text-sm opacity-70">📋 Export Options:</div>
                      <div className="text-sm opacity-90">
                        Professional PDF export with watermarks. Export to Google Drive, Dropbox. 
                        <strong className="text-primary"> All 100% FREE—no plan gating.</strong>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm opacity-70 italic">
                    💡 Worth trying just for these three features alone. Video generation is pure bonus value.
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">&lt;2 min</div>
                  <div className="text-sm opacity-80">To Full Backup</div>
                </div>
              </div>
            </div>

            {/* Comparison */}
            <div className="bg-base-300 rounded-box p-8 mb-8">
              <h3 className="text-2xl font-bold text-center mb-6">Why Screenwriters Choose Wryda</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-[#DC143C] mb-2">$0</div>
                  <div className="text-sm opacity-80">vs. $249 (Final Draft)</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#DC143C] mb-2">✨ AI Built-in</div>
                  <div className="text-sm opacity-80">0.01 credits per rewrite</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#DC143C] mb-2">→ Video</div>
                  <div className="text-sm opacity-80">Generate scenes from script</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#DC143C] mb-2">📋 Import</div>
                  <div className="text-sm opacity-80">Paste & auto-populate</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-[#DC143C] mb-2">📚 GitHub</div>
                  <div className="text-sm opacity-80">&lt;2 min to full backup</div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <Link href="/write" className="btn btn-primary btn-lg gap-2">
                <span>Try the Editor Free</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <p className="text-sm opacity-60 mt-4">No credit card required • Start writing in seconds</p>
              <p className="text-lg font-bold text-primary mt-4 max-w-2xl mx-auto">
                Worth trying just for the free backup, organization, and AI writing tools. 
                <br className="hidden sm:block" />
                The video generation? That's just the icing on the cake. 🎂
              </p>
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
                  <span>3D Model Export (500-1000 credits)</span>
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
