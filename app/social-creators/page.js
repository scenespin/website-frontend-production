import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";
import Pricing from "@/components/Pricing";

export const metadata = getSEOTags({
  title: `Create Viral Content - Free AI Video Tools | ${config.appName}`,
  description: "Create TikTok, Reels, YouTube videos with AI. Vertical video (9:16), multi-platform export, character consistency. $0/month vs CapCut's $240/year.",
  canonicalUrlRelative: "/social-creators",
  keywords: ["tiktok video creator", "reels maker", "AI video generator", "vertical video", "social media content creator"],
});

export default function SocialCreatorsPage() {
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-sm font-semibold">
            <span>📱</span>
            <span>For Content Creators</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Create Viral Content.
            <br />
            <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">TikTok. Reels. YouTube.</span>
          </h1>

          <p className="text-xl md:text-2xl opacity-90 max-w-3xl">
            AI video generation + Vertical video (9:16) + Multi-platform export + Character consistency.
            <br />
            <strong>$0/month software</strong> vs CapCut Pro&apos;s $240/year.
          </p>

          {/* Quick Benefits */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
            <div className="bg-gradient-to-br from-pink-500/10 to-pink-500/5 p-4 rounded-lg border border-pink-500/20">
              <div className="text-3xl font-bold text-pink-500">9:16</div>
              <div className="text-sm opacity-70">Vertical Video</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 p-4 rounded-lg border border-purple-500/20">
              <div className="text-3xl font-bold text-purple-500">51</div>
              <div className="text-sm opacity-70">AI Workflows</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-4 rounded-lg border border-blue-500/20">
              <div className="text-3xl font-bold text-blue-500">3x</div>
              <div className="text-sm opacity-70">Platforms</div>
            </div>
            <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 p-4 rounded-lg border border-green-500/20">
              <div className="text-3xl font-bold text-green-500">$0</div>
              <div className="text-sm opacity-70">Per Month</div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link className="btn btn-primary btn-lg" href="/sign-up">
              Create Your First Video Free →
            </Link>
            <Link className="btn btn-outline btn-lg" href="#workflows">
              Browse 58 Workflows
            </Link>
          </div>

          <p className="text-sm opacity-60">
            No credit card. 100 free credits. Create TikTok, Reels, YouTube - all formats.
          </p>
        </section>

        {/* The Problem Section */}
        <section className="bg-gradient-to-br from-pink-500/10 to-purple-500/10 py-16">
          <div className="max-w-6xl mx-auto px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Stop Paying Monthly. Start Paying Per Video.
              </h2>
              <p className="text-lg opacity-80">
                The content creator pricing model is broken
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Traditional */}
              <div className="card bg-base-100 border-2 border-error/30">
                <div className="card-body">
                  <div className="badge badge-error mb-2">Traditional Model 😫</div>
                  <h3 className="card-title text-2xl mb-4">What You&apos;re Paying Now</h3>
                  
                  <ul className="space-y-3">
                    <li className="flex justify-between items-center">
                      <span>CapCut Pro</span>
                      <span className="font-semibold text-error">$240/yr</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Adobe Premiere</span>
                      <span className="font-semibold text-error">$660/yr</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Descript</span>
                      <span className="font-semibold text-error">$288/yr</span>
                    </li>
                    <li className="border-t border-error/30 pt-3 flex justify-between items-center">
                      <span className="font-bold">Total Annual Cost</span>
                      <span className="font-bold text-2xl text-error">$1,188</span>
                    </li>
                  </ul>

                  <div className="alert alert-error mt-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-sm">You pay <strong>whether you create 0 videos or 100 videos</strong></span>
                  </div>
                </div>
              </div>

              {/* Wryda Model */}
              <div className="card bg-gradient-to-br from-success/20 to-primary/20 border-2 border-success">
                <div className="card-body">
                  <div className="badge badge-success mb-2">New Model ✨</div>
                  <h3 className="card-title text-2xl mb-4">{config.appName}: Pay Per Video</h3>
                  
                  <ul className="space-y-3">
                    <li className="flex justify-between items-center">
                      <span className="font-semibold">✅ All Tools & Features</span>
                      <span className="font-bold text-success">FREE</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="font-semibold">✅ Vertical Video (9:16)</span>
                      <span className="font-bold text-success">FREE</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="font-semibold">✅ 58 AI Workflows</span>
                      <span className="font-bold text-success">FREE</span>
                    </li>
                    <li className="border-t border-success/30 pt-3 flex justify-between items-center">
                      <span className="font-bold">Monthly Software Cost</span>
                      <span className="font-bold text-3xl text-success">$0</span>
                    </li>
                  </ul>

                  <div className="alert alert-success mt-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-sm">You only pay <strong>credits when you generate videos</strong></span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <div className="stats stats-vertical md:stats-horizontal shadow bg-base-100">
                <div className="stat">
                  <div className="stat-title">Create 0 Videos</div>
                  <div className="stat-value text-success">Pay $0</div>
                  <div className="stat-desc">vs CapCut: Pay $20</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Create 10 Videos</div>
                  <div className="stat-value text-success">~$15</div>
                  <div className="stat-desc">vs CapCut: Pay $20</div>
                </div>
                <div className="stat">
                  <div className="stat-title">Create 100 Videos</div>
                  <div className="stat-value text-success">~$100</div>
                  <div className="stat-desc">vs Adobe: Pay $55/mo</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Multi-Platform Hero */}
        <section className="py-16 px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-5xl mb-4">📱</div>
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
              Create Once. Post Everywhere.
            </h2>
            <p className="text-xl opacity-80">
              Multi-Platform Hero workflow: Generate 1 video → Get 3 formats automatically
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card bg-gradient-to-br from-pink-500/20 to-pink-500/10 border-2 border-pink-500/30">
              <div className="card-body text-center">
                <div className="text-4xl mb-2">📱</div>
                <h3 className="font-bold text-xl mb-2">TikTok / Reels</h3>
                <div className="text-3xl font-bold text-pink-500 mb-1">9:16</div>
                <p className="text-sm opacity-70">Vertical format</p>
                <p className="text-sm opacity-70">Optimized for mobile</p>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-blue-500/20 to-blue-500/10 border-2 border-blue-500/30">
              <div className="card-body text-center">
                <div className="text-4xl mb-2">🖥️</div>
                <h3 className="font-bold text-xl mb-2">YouTube</h3>
                <div className="text-3xl font-bold text-blue-500 mb-1">16:9</div>
                <p className="text-sm opacity-70">Landscape format</p>
                <p className="text-sm opacity-70">Desktop optimized</p>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-purple-500/20 to-purple-500/10 border-2 border-purple-500/30">
              <div className="card-body text-center">
                <div className="text-4xl mb-2">📷</div>
                <h3 className="font-bold text-xl mb-2">Instagram Feed</h3>
                <div className="text-3xl font-bold text-purple-500 mb-1">1:1</div>
                <p className="text-sm opacity-70">Square format</p>
                <p className="text-sm opacity-70">Feed optimized</p>
              </div>
            </div>
          </div>

          <div className="card bg-base-200 max-w-3xl mx-auto">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Multi-Platform Hero Workflow</h3>
                <div className="badge badge-success">50-150 credits</div>
              </div>
              <p className="text-sm opacity-80 mb-4">
                Create <strong>one prompt</strong> → Get <strong>three platform-optimized videos</strong>. Saves 60% on credits vs generating 3 separate videos.
              </p>
              <Link href="/workflows" className="btn btn-primary">
                Explore This Workflow
              </Link>
            </div>
          </div>
        </section>

        {/* 51 AI Workflows */}
        <section id="workflows" className="bg-base-200 py-16">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                58 AI Workflows Built for Creators
              </h2>
              <p className="text-lg opacity-80">
                Pre-built workflows for every content type
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <WorkflowCard
                icon="📱"
                title="Multi-Platform Hero"
                description="Generate once → Get YouTube, TikTok, Instagram formats automatically"
                credits="50-150"
                highlight={true}
              />
              <WorkflowCard
                icon="🎬"
                title="Budget Photorealistic"
                description="Professional 1080p videos. Perfect for daily posting. Low credit cost."
                credits="50-80"
              />
              <WorkflowCard
                icon="👤"
                title="Character Consistency"
                description="Create a character → Use them in every video. Perfect for series."
                credits="100-150"
              />
              <WorkflowCard
                icon="🎭"
                title="Character Dialogue"
                description="Make characters speak with perfect lip-sync. AI-powered speech."
                credits="400+"
              />
              <WorkflowCard
                icon="📸"
                title="Product Showcase"
                description="Turn product photos into engaging videos. E-commerce ready."
                credits="80-120"
              />
              <WorkflowCard
                icon="🎨"
                title="Anime/Cartoon Style"
                description="Animated content in various art styles. Unique visual identity."
                credits="50-100"
              />
              <WorkflowCard
                icon="⏱️"
                title="Extend Video"
                description="Make your videos longer. Add 5-10 seconds seamlessly."
                credits="50-80"
              />
              <WorkflowCard
                icon="🎥"
                title="Video to Video Transform"
                description="Change style, mood, or setting of existing footage."
                credits="100-150"
              />
              <WorkflowCard
                icon="🔄"
                title="Loop Video"
                description="Create perfect loops for backgrounds and motion graphics."
                credits="50-80"
              />
            </div>

            <div className="text-center mt-8">
              <Link href="/workflows" className="btn btn-outline btn-lg">
                Browse All 58 Workflows
              </Link>
            </div>
          </div>
        </section>

        {/* Features for Creators */}
        <section className="py-16 px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Go Viral
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon="📱"
              title="Vertical Video (9:16)"
              description="TikTok, Reels, Stories - native vertical format"
            />
            <FeatureCard
              icon="🎨"
              title="Character Consistency"
              description="Create a character, use them in every video"
            />
            <FeatureCard
              icon="⚡"
              title="Fast Generation"
              description="Professional 1080p in 60-90 seconds"
            />
            <FeatureCard
              icon="🎭"
              title="Talking Characters"
              description="Perfect lip-sync dialogue generation"
            />
            <FeatureCard
              icon="📐"
              title="65 Compositions"
              description="Split-screen, PIP, multi-angle shots"
            />
            <FeatureCard
              icon="🎞️"
              title="30 Transitions"
              description="Professional cuts, fades, wipes"
            />
            <FeatureCard
              icon="🎨"
              title="Color Grading"
              description="70 Hollywood-grade LUTs included"
            />
            <FeatureCard
              icon="☁️"
              title="Cloud Export"
              description="Download or export to Drive/Dropbox"
            />
          </div>
        </section>

        {/* Screenplay Format for Creators */}
        <section className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 py-16">
          <div className="max-w-5xl mx-auto px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Pro Tip: Use Screenplay Format
              </h2>
              <p className="text-lg opacity-80">
                Better structure = Better AI results
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="card bg-base-100">
                <div className="card-body">
                  <h3 className="font-bold mb-2">Basic Prompt</h3>
                  <div className="mockup-code text-xs">
                    <pre data-prefix=">"><code>A girl in a coffee shop with her phone</code></pre>
                  </div>
                  <p className="text-sm opacity-70 mt-2">AI guesses everything. Random results.</p>
                </div>
              </div>

              <div className="card bg-gradient-to-br from-success/20 to-primary/20 border-2 border-success">
                <div className="card-body">
                  <h3 className="font-bold mb-2">Screenplay Format</h3>
                  <div className="mockup-code text-xs">
                    <pre><code>INT. COFFEE SHOP - DAY</code></pre>
                    <pre><code></code></pre>
                    <pre><code>Emma sits alone, scrolling.</code></pre>
                  </div>
                  <p className="text-sm opacity-70 mt-2">AI knows location, time, character. Better results!</p>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <Link href="/help/fountain-format" className="btn btn-outline">
                Learn Simple Screenplay Format (3 min)
              </Link>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <Pricing />

        {/* Final CTA */}
        <section className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 py-16">
          <div className="max-w-4xl mx-auto px-8 text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6">
              Start Creating Viral Content Today
            </h2>
            <p className="text-xl opacity-90 mb-8">
              TikTok + Reels + YouTube. All formats. <strong>$0/month software.</strong>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link href="/sign-up" className="btn btn-primary btn-lg">
                Get 100 Free Credits
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z" clipRule="evenodd" />
                </svg>
              </Link>
              <Link href="/workflows" className="btn btn-outline btn-lg">
                Browse 58 Workflows
              </Link>
            </div>
            <p className="text-sm opacity-60">
              No credit card. Create TikTok, Reels, YouTube videos instantly.
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
      <div className="card-body p-4 text-center">
        <div className="text-3xl mb-2">{icon}</div>
        <h3 className="font-bold text-sm">{title}</h3>
        <p className="text-xs opacity-70">{description}</p>
      </div>
    </div>
  );
}

function WorkflowCard({ icon, title, description, credits, highlight = false }) {
  return (
    <div className={`card ${highlight ? 'bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary' : 'bg-base-100'} hover:shadow-xl transition-shadow`}>
      <div className="card-body">
        <div className="text-3xl mb-2">{icon}</div>
        <h3 className="card-title text-lg">{title}</h3>
        <p className="text-sm opacity-80">{description}</p>
        <div className="badge badge-primary mt-2">{credits} credits</div>
      </div>
    </div>
  );
}

