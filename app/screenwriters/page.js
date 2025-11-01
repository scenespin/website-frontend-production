import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";
import Pricing from "@/components/Pricing";

export const metadata = getSEOTags({
  title: `Free Screenwriting Software with AI Video Production | ${config.appName}`,
  description: "Professional Fountain format screenplay editor + AI video production. Import from Final Draft, paste-and-go character extraction, export WGA-standard PDFs. $0/month vs Final Draft's $250/year.",
  canonicalUrlRelative: "/screenwriters",
  keywords: ["screenwriting software", "fountain format", "final draft alternative", "free screenplay editor", "AI video production for screenwriters"],
});

export default function ScreenwritersPage() {
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
          <Link href="/sign-in" className="btn btn-ghost">Login</Link>
          <Link href="/sign-up" className="btn btn-primary">Start Free</Link>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center text-center gap-8 px-8 py-16 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
            <span>🎬</span>
            <span>For Professional Screenwriters</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Write Your Screenplay.
            <br />
            <span className="text-[#DC143C]">Watch It Come Alive.</span>
          </h1>

          <p className="text-xl md:text-2xl opacity-90 max-w-3xl">
            Professional Fountain format editor + AI video production in one platform.
            <br />
            <strong>$0/month forever</strong> vs Final Draft&apos;s $250/year + Adobe&apos;s $660/year.
          </p>

          {/* Key Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl text-left mt-4">
            <div className="flex items-start gap-3 bg-base-200 p-4 rounded-lg">
              <svg className="w-6 h-6 text-[#DC143C] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <strong>Fountain Format Screenplay Editor</strong>
                <p className="text-sm opacity-70">Industry-standard format. Import from Final Draft, Fade In, Highland. Export WGA-standard PDFs.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-base-200 p-4 rounded-lg">
              <svg className="w-6 h-6 text-[#DC143C] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <strong>Paste-and-Go Magic</strong>
                <p className="text-sm opacity-70">Paste your screenplay → 3 seconds → Characters, locations, scenes auto-populated. Ready to generate.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-base-200 p-4 rounded-lg">
              <svg className="w-6 h-6 text-[#DC143C] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <strong>AI Reads Your Structure</strong>
                <p className="text-sm opacity-70">AI understands screenplay format - knows WHO, WHERE, WHAT in every scene. Better context = better videos.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-base-200 p-4 rounded-lg">
              <svg className="w-6 h-6 text-[#DC143C] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <strong>No Vendor Lock-In</strong>
                <p className="text-sm opacity-70">Plain text .fountain files. Works with Git/GitHub. You own your screenplay forever.</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link className="btn btn-primary btn-lg" href="/sign-up">
              Start Writing Free - 100 Credits →
            </Link>
            <Link className="btn btn-outline btn-lg" href="#how-it-works">
              See How It Works
            </Link>
          </div>

          <p className="text-sm opacity-60">
            No credit card required. Import your existing screenplay in 3 seconds.
          </p>
        </section>

        {/* The Problem Section */}
        <section className="bg-base-200 py-16">
          <div className="max-w-6xl mx-auto px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                The Screenwriter&apos;s Dilemma
              </h2>
              <p className="text-lg opacity-80">
                You&apos;re paying for disconnected, expensive tools that don&apos;t work together
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Traditional Stack */}
              <div className="card bg-gradient-to-br from-error/10 to-error/5 border-2 border-error/30">
                <div className="card-body">
                  <div className="badge badge-error mb-2">The Old Way 😫</div>
                  <h3 className="card-title text-2xl mb-4">Traditional Screenwriting Stack</h3>
                  
                  <ul className="space-y-3">
                    <li className="flex justify-between items-center">
                      <span className="opacity-80">Final Draft (Screenplay)</span>
                      <span className="font-semibold text-error">$250/yr</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="opacity-80">Adobe Premiere (Video Editing)</span>
                      <span className="font-semibold text-error">$660/yr</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="opacity-80">Adobe After Effects (VFX)</span>
                      <span className="font-semibold text-error">$316/yr</span>
                    </li>
                    <li className="border-t border-error/30 pt-3 flex justify-between items-center">
                      <span className="font-bold text-lg">Total Software Cost</span>
                      <span className="font-bold text-2xl text-error">$1,226/yr</span>
                    </li>
                  </ul>

                  <div className="mt-4 p-4 bg-base-200 rounded-lg">
                    <p className="text-sm opacity-70">
                      <strong>The Problems:</strong>
                    </p>
                    <ul className="text-sm space-y-1 opacity-70 mt-2">
                      <li>• Disconnected tools - manual data entry</li>
                      <li>• Pay whether you use them or not</li>
                      <li>• No AI integration</li>
                      <li>• Expensive before you create anything</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Wryda Solution */}
              <div className="card bg-gradient-to-br from-success/10 to-primary/10 border-2 border-success">
                <div className="card-body">
                  <div className="badge badge-success mb-2">The Future ✨</div>
                  <h3 className="card-title text-2xl mb-4">{config.appName}: All-in-One</h3>
                  
                  <ul className="space-y-3">
                    <li className="flex justify-between items-center">
                      <span className="font-semibold">✅ Fountain Screenplay Editor</span>
                      <span className="font-bold text-success">FREE</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="font-semibold">✅ AI Video Generation</span>
                      <span className="font-bold text-success">FREE</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="font-semibold">✅ 8-Track Timeline Editor</span>
                      <span className="font-bold text-success">FREE</span>
                    </li>
                    <li className="border-t border-success/30 pt-3 flex justify-between items-center">
                      <span className="font-bold text-lg">Software Cost</span>
                      <span className="font-bold text-3xl text-success">$0/yr</span>
                    </li>
                  </ul>

                  <div className="mt-4 p-4 bg-base-200 rounded-lg">
                    <p className="text-sm font-semibold text-success mb-2">
                      💰 Save $1,226/year in software fees!
                    </p>
                    <p className="text-sm opacity-70">
                      You only pay credits for AI generation & final renders.
                    </p>
                    <p className="text-xs opacity-60 mt-2">
                      Free Plan: 100 signup credits + 10/month forever
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works - The Magic */}
        <section id="how-it-works" className="py-16 px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
              The Screenplay-First Workflow
            </h2>
            <p className="text-xl opacity-80">
              Write once. Generate everything. Your screenplay becomes a smart database.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Step 1 */}
            <div className="card bg-base-200">
              <div className="card-body">
                <div className="text-4xl mb-4">📝</div>
                <div className="badge badge-primary mb-2">Step 1</div>
                <h3 className="card-title">Write Your Screenplay</h3>
                <p className="text-sm opacity-80">
                  Use our Fountain format editor or import from Final Draft, Fade In, Highland. Industry-standard formatting built-in.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="card bg-base-200">
              <div className="card-body">
                <div className="text-4xl mb-4">⚡</div>
                <div className="badge badge-warning mb-2">Step 2</div>
                <h3 className="card-title">Paste & Auto-Populate</h3>
                <p className="text-sm opacity-80">
                  Paste your screenplay. In 3 seconds: All characters, locations, and scenes automatically extracted and organized. Zero manual work.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="card bg-base-200">
              <div className="card-body">
                <div className="text-4xl mb-4">🎬</div>
                <div className="badge badge-success mb-2">Step 3</div>
                <h3 className="card-title">Generate Videos</h3>
                <p className="text-sm opacity-80">
                  AI reads your screenplay structure - knows characters, locations, relationships. Generates consistent, context-aware videos.
                </p>
              </div>
            </div>
          </div>

          {/* Demo Video Placeholder */}
          <div className="card bg-base-300 max-w-4xl mx-auto">
            <div className="card-body text-center">
              <h3 className="text-2xl font-bold mb-4">See The Magic In Action</h3>
              <div className="bg-base-100 rounded-lg p-12 mb-4">
                <p className="text-4xl mb-4">🎥</p>
                <p className="opacity-70">[Demo video: Paste screenplay → Auto-populate → Generate]</p>
              </div>
              <Link href="/sign-up" className="btn btn-primary btn-lg">
                Try It Yourself - Free
              </Link>
            </div>
          </div>
        </section>

        {/* The Fountain Format Advantage */}
        <section className="bg-gradient-to-br from-primary/10 to-secondary/10 py-16">
          <div className="max-w-6xl mx-auto px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Fountain Format Makes AI Better
              </h2>
              <p className="text-lg opacity-80">
                Your screenplay structure gives AI the context it needs for better results
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Traditional Prompt */}
              <div className="card bg-base-100">
                <div className="card-body">
                  <div className="badge badge-ghost mb-2">Traditional AI Prompt</div>
                  <h3 className="card-title text-lg mb-4">Isolated Text</h3>
                  
                  <div className="mockup-code text-xs mb-4">
                    <pre data-prefix=">"><code>A woman in a coffee shop looking at her phone</code></pre>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p className="flex items-start gap-2">
                      <span className="text-error">❌</span>
                      <span>Random woman - no character consistency</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-error">❌</span>
                      <span>Generic coffee shop - no context</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-error">❌</span>
                      <span>AI guesses everything</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-error">❌</span>
                      <span>No story continuity</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Fountain Format */}
              <div className="card bg-gradient-to-br from-success/20 to-primary/20 border-2 border-success">
                <div className="card-body">
                  <div className="badge badge-success mb-2">Fountain Format</div>
                  <h3 className="card-title text-lg mb-4">Contextual Structure</h3>
                  
                  <div className="mockup-code text-xs mb-4">
                    <pre data-prefix=""><code>INT. COFFEE SHOP - DAY</code></pre>
                    <pre data-prefix=""><code></code></pre>
                    <pre data-prefix=""><code>Sarah sits alone, scrolling through her phone.</code></pre>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p className="flex items-start gap-2">
                      <span className="text-success">✅</span>
                      <span><strong>SARAH</strong> - defined character, consistent across scenes</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-success">✅</span>
                      <span><strong>INT.</strong> - interior lighting</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-success">✅</span>
                      <span><strong>DAY</strong> - daytime setting</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-success">✅</span>
                      <span>AI reads screenplay structure for perfect context</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <Link href="/help/fountain-format" className="btn btn-outline btn-lg">
                Learn More About Fountain Format
              </Link>
            </div>
          </div>
        </section>

        {/* Features For Screenwriters */}
        <section className="py-16 px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built For Professional Screenwriters
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon="📝"
              title="Full Fountain Syntax"
              description="Scene headings, character names, dialogue, parentheticals, transitions, notes. Complete Fountain spec support."
            />
            <FeatureCard
              icon="📄"
              title="WGA-Standard PDFs"
              description="Export broadcast-ready PDFs. Courier 12pt, proper margins, scene bookmarks. Ready for agents and producers."
            />
            <FeatureCard
              icon="⚡"
              title="Paste-and-Go Import"
              description="Copy from Final Draft/Fade In → Paste → 3 seconds → All characters/locations/scenes extracted."
            />
            <FeatureCard
              icon="🔄"
              title="Git/GitHub Integration"
              description="Version control friendly. Plain text .fountain files work perfectly with Git. Collaborate with developers."
            />
            <FeatureCard
              icon="🎭"
              title="Character Board"
              description="Auto-populated from screenplay. Track arcs, relationships, development. Generate visual references for AI."
            />
            <FeatureCard
              icon="📍"
              title="Location Library"
              description="All locations auto-extracted. Organize by INT/EXT, time of day. Consistent settings across scenes."
            />
            <FeatureCard
              icon="🎬"
              title="Scene Breakdown"
              description="Every scene automatically organized. Track structure, acts, importance. Visual story beats."
            />
            <FeatureCard
              icon="🤖"
              title="AI Contextual Understanding"
              description="AI reads WHO is in scenes, WHERE they take place, WHAT happens. Better prompts from structure."
            />
            <FeatureCard
              icon="🔓"
              title="No Vendor Lock-In"
              description="Plain .fountain text files. Export anytime. Import to any Fountain editor. You own your work forever."
            />
          </div>
        </section>

        {/* Pricing */}
        <Pricing />

        {/* Final CTA */}
        <section className="bg-gradient-to-r from-primary/20 to-secondary/20 py-16">
          <div className="max-w-4xl mx-auto px-8 text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6">
              Stop Paying $1,226/Year for Disconnected Tools
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Get professional screenplay editor + AI video production for <strong className="text-[#DC143C]">$0/month</strong>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up" className="btn btn-primary btn-lg">
                Start Writing Free - 100 Credits
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z" clipRule="evenodd" />
                </svg>
              </Link>
              <Link href="/help/fountain-format" className="btn btn-outline btn-lg">
                Learn About Fountain Format
              </Link>
            </div>
            <p className="text-sm opacity-60 mt-4">
              No credit card required. Import your screenplay in 3 seconds.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="card bg-base-200 hover:shadow-xl transition-shadow">
      <div className="card-body">
        <div className="text-3xl mb-2">{icon}</div>
        <h3 className="card-title text-lg">{title}</h3>
        <p className="text-sm opacity-80">{description}</p>
      </div>
    </div>
  );
}

