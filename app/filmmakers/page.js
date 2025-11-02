import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";
import Pricing from "@/components/Pricing";

export const metadata = getSEOTags({
  title: `Professional Filmmaking Tools - Free Software | ${config.appName}`,
  description: "Complete production suite for filmmakers. Upload footage + screenplay editor + AI generation + timeline + 4K rendering. $0/month vs Adobe&apos;s $1,226/year.",
  canonicalUrlRelative: "/filmmakers",
  keywords: ["filmmaking software", "video production tools", "adobe premiere alternative", "free video editor", "AI filmmaking"],
});

export default function FilmmakersPage() {
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
            <span>🎥</span>
            <span>For Independent Filmmakers</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            From Script to Screen.
            <br />
            <span className="text-[#DC143C]">One Platform. $0/Month.</span>
          </h1>

          <p className="text-xl md:text-2xl opacity-90 max-w-3xl">
            Upload your footage + Write screenplays + Generate AI shots + Edit on timeline + Render 4K.
            <br />
            <strong>Complete production suite for FREE</strong> vs Adobe&apos;s $1,226/year.
          </p>

          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
            <div className="bg-base-200 p-4 rounded-lg">
              <div className="text-3xl font-bold text-[#DC143C]">$0</div>
              <div className="text-sm opacity-70">Software Cost</div>
            </div>
            <div className="bg-base-200 p-4 rounded-lg">
              <div className="text-3xl font-bold text-[#DC143C]">8</div>
              <div className="text-sm opacity-70">Timeline Tracks</div>
            </div>
            <div className="bg-base-200 p-4 rounded-lg">
              <div className="text-3xl font-bold text-[#DC143C]">65</div>
              <div className="text-sm opacity-70">Compositions</div>
            </div>
            <div className="bg-base-200 p-4 rounded-lg">
              <div className="text-3xl font-bold text-[#DC143C]">4K</div>
              <div className="text-sm opacity-70">Max Resolution</div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link className="btn btn-primary btn-lg" href="/sign-up">
              Start Creating Free - 50 Credits →
            </Link>
            <Link className="btn btn-outline btn-lg" href="#features">
              Explore Features
            </Link>
          </div>

          <p className="text-sm opacity-60">
            No credit card required. Upload unlimited footage. All features unlocked.
          </p>
        </section>

        {/* Upload Your Footage - Hero Feature */}
        <section className="bg-gradient-to-br from-[#DC143C]/10 to-purple-600/10 py-16">
          <div className="max-w-6xl mx-auto px-8">
            <div className="text-center mb-12">
              <div className="text-6xl mb-4">🎬</div>
              <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
                Upload Your Footage - 100% FREE
              </h2>
              <p className="text-xl opacity-90 max-w-3xl mx-auto">
                Upload <strong>unlimited footage</strong> in <strong>any format, any resolution</strong> — Forever FREE
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card bg-base-100">
                <div className="card-body text-center">
                  <div className="text-4xl mb-2">📹</div>
                  <h3 className="font-bold text-lg mb-2">ANY Format</h3>
                  <p className="text-sm opacity-70">MP4, MOV, WebM, MKV, AVI</p>
                  <p className="text-sm opacity-70">Cinema camera formats supported</p>
                </div>
              </div>

              <div className="card bg-base-100">
                <div className="card-body text-center">
                  <div className="text-4xl mb-2">🎥</div>
                  <h3 className="font-bold text-lg mb-2">ANY Resolution</h3>
                  <p className="text-sm opacity-70">4K, 8K, RED, Cinema RAW</p>
                  <p className="text-sm opacity-70">Professional workflows supported</p>
                </div>
              </div>

              <div className="card bg-base-100">
                <div className="card-body text-center">
                  <div className="text-4xl mb-2">💰</div>
                  <h3 className="font-bold text-lg mb-2">$0 Forever</h3>
                  <p className="text-sm opacity-70">Never pay for your own footage</p>
                  <p className="text-sm opacity-70">Unlimited uploads</p>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 max-w-4xl mx-auto">
              <div className="card-body">
                <h3 className="text-2xl font-bold mb-4">💡 The Complete Workflow:</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="badge badge-primary">1</div>
                    <div>
                      <strong>Upload your footage</strong> - Camera A-roll, B-roll, interviews (FREE)
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="badge badge-primary">2</div>
                    <div>
                      <strong>Generate AI shots</strong> - VFX, establishing shots, locations you can&apos;t film (Credits)
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="badge badge-primary">3</div>
                    <div>
                      <strong>Edit on 8-track timeline</strong> - Mix footage + AI, add transitions, keyframes (FREE)
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="badge badge-primary">4</div>
                    <div>
                      <strong>Apply 65 compositions</strong> - Multi-angle, split-screen, PIP (FREE)
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="badge badge-primary">5</div>
                    <div>
                      <strong>Export final render</strong> - Up to 4K, professional codecs (Credits)
                    </div>
                  </div>
                </div>

                <div className="alert alert-success mt-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span><strong>Use {config.appName} as your complete video editor.</strong> Only pay for AI and final export—never for using your own footage.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Filmmaker's Stack */}
        <section className="py-16 px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Replace Your Entire Software Stack
            </h2>
            <p className="text-lg opacity-80">
              Stop paying $1,226/year for disconnected tools
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Traditional Stack */}
            <div className="card bg-gradient-to-br from-error/10 to-error/5 border-2 border-error/30">
              <div className="card-body">
                <div className="badge badge-error mb-2">Traditional Stack 😫</div>
                <h3 className="card-title text-2xl mb-4">What You&apos;re Paying Now</h3>
                
                <ul className="space-y-3">
                  <li className="flex justify-between items-center">
                    <span>Final Draft (Screenplay)</span>
                    <span className="font-semibold text-error">$250/yr</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>Adobe Premiere Pro</span>
                    <span className="font-semibold text-error">$660/yr</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>Adobe After Effects</span>
                    <span className="font-semibold text-error">$316/yr</span>
                  </li>
                  <li className="border-t border-error/30 pt-3 flex justify-between items-center">
                    <span className="font-bold text-lg">Annual Software Cost</span>
                    <span className="font-bold text-2xl text-error">$1,226</span>
                  </li>
                </ul>

                <div className="mt-4 p-4 bg-base-200 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Problems:</p>
                  <ul className="text-sm space-y-1 opacity-70">
                    <li>• Pay whether you create or not</li>
                    <li>• Disconnected workflows</li>
                    <li>• Manual data entry between tools</li>
                    <li>• Subscription fatigue</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Wryda Stack */}
            <div className="card bg-gradient-to-br from-success/10 to-primary/10 border-2 border-success">
              <div className="card-body">
                <div className="badge badge-success mb-2">Wryda All-in-One ✨</div>
                <h3 className="card-title text-2xl mb-4">Everything You Need</h3>
                
                <ul className="space-y-3">
                  <li className="flex justify-between items-center">
                    <span className="font-semibold">✅ Screenplay Editor</span>
                    <span className="font-bold text-success">FREE</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="font-semibold">✅ Upload Unlimited Footage</span>
                    <span className="font-bold text-success">FREE</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="font-semibold">✅ 8-Track Timeline</span>
                    <span className="font-bold text-success">FREE</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="font-semibold">✅ 65 Compositions + 30 Transitions</span>
                    <span className="font-bold text-success">FREE</span>
                  </li>
                  <li className="border-t border-success/30 pt-3 flex justify-between items-center">
                    <span className="font-bold text-lg">Annual Software Cost</span>
                    <span className="font-bold text-3xl text-success">$0</span>
                  </li>
                </ul>

                <div className="mt-4 p-4 bg-base-200 rounded-lg">
                  <p className="text-sm font-semibold text-success mb-2">
                    💰 Save $1,776/year!
                  </p>
                  <p className="text-sm opacity-70">
                    You only pay credits for:
                  </p>
                  <ul className="text-sm space-y-1 opacity-70 mt-2">
                    <li>• AI video generation</li>
                    <li>• Final render/export</li>
                    <li>• That&apos;s it!</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Complete Feature Set */}
        <section id="features" className="bg-base-200 py-16">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Professional Tools. All Included.
              </h2>
              <p className="text-lg opacity-80">
                Everything you need for complete film production
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon="📹"
                title="Upload Unlimited Footage"
                description="MP4, MOV, WebM, MKV. Any resolution. 4K, 8K, RED camera footage. Upload forever FREE."
                highlight={true}
              />
              <FeatureCard
                icon="📝"
                title="Fountain Screenplay Editor"
                description="Professional screenwriting. Import from Final Draft/Fade In. Export WGA-standard PDFs. Full Fountain syntax."
              />
              <FeatureCard
                icon="🎬"
                title="8-Track Timeline Editor"
                description="Multi-track editing. Keyframe animations. Professional UI. Frame-accurate precision. Real-time preview."
              />
              <FeatureCard
                icon="🤖"
                title="AI Video Generation"
                description="3 quality tiers: Professional 1080p, Premium 4K, Ultra Native 4K. 5 aspect ratios. Character consistency."
              />
              <FeatureCard
                icon="📐"
                title="65 Composition Templates"
                description="Multi-angle, split-screen, PIP, grid layouts. Action sequences, interviews, montages. All FREE."
              />
              <FeatureCard
                icon="🎞️"
                title="30 Professional Transitions"
                description="Cuts, fades, wipes, slides. Hollywood-style transitions. Cinematic effects. Fully customizable."
              />
              <FeatureCard
                icon="🎨"
                title="Professional Color Grading"
                description="70 Hollywood-grade LUTs. Cinematic looks, film emulations. Apply to any clip. Real-time preview."
              />
              <FeatureCard
                icon="🎭"
                title="Character Bank"
                description="Maintain consistency across scenes. Visual references. AI understands your characters. Track relationships."
              />
              <FeatureCard
                icon="☁️"
                title="Cloud Export"
                description="Export to Google Drive or Dropbox. No vendor lock-in. Professional codecs. Up to 4K resolution."
              />
            </div>
          </div>
        </section>

        {/* Screenplay-First Advantage */}
        <section className="py-16 px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              The Screenplay-First Advantage
            </h2>
            <p className="text-lg opacity-80">
              Your script becomes a smart database for better AI results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title">Traditional Workflow</h3>
                <div className="space-y-2 text-sm opacity-80">
                  <p>1. Write screenplay in Final Draft</p>
                  <p>2. Manually enter characters into video software</p>
                  <p>3. Generate videos with no context</p>
                  <p>4. Hope for consistency</p>
                  <p>5. Edit in Premiere Pro</p>
                </div>
                <div className="badge badge-error mt-4">Disconnected & Expensive</div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-success/20 to-primary/20 border-2 border-success">
              <div className="card-body">
                <h3 className="card-title">Wryda Workflow</h3>
                <div className="space-y-2 text-sm opacity-80">
                  <p>1. Write screenplay (or paste existing)</p>
                  <p>2. ⚡ Characters auto-populate (3 seconds)</p>
                  <p>3. Generate videos with full story context</p>
                  <p>4. Perfect character consistency</p>
                  <p>5. Mix with your footage on timeline</p>
                </div>
                <div className="badge badge-success mt-4">Integrated & FREE</div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/help/fountain-format" className="btn btn-outline">
              Learn About Screenplay-First Workflow
            </Link>
          </div>
        </section>

        {/* Pricing */}
        <Pricing />

        {/* Final CTA */}
        <section className="bg-gradient-to-r from-[#DC143C]/20 to-purple-600/20 py-16">
          <div className="max-w-4xl mx-auto px-8 text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6">
              Ready to Replace Adobe?
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Complete production suite for <strong>$0/month</strong> vs Adobe&apos;s $1,226/year
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-base-100/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-success mb-1">Upload</div>
                <div className="text-sm opacity-70">Unlimited footage FREE</div>
              </div>
              <div className="bg-base-100/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-success mb-1">Edit</div>
                <div className="text-sm opacity-70">8-track timeline FREE</div>
              </div>
              <div className="bg-base-100/50 rounded-lg p-4">
                <div className="text-2xl font-bold text-success mb-1">Generate</div>
                <div className="text-sm opacity-70">AI + Render credits only</div>
              </div>
            </div>
            <Link href="/sign-up" className="btn btn-primary btn-lg">
              Start Creating Free - 50 Credits
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z" clipRule="evenodd" />
              </svg>
            </Link>
            <p className="text-sm opacity-60 mt-4">
              No credit card required. Upload unlimited footage. All tools unlocked.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}

function FeatureCard({ icon, title, description, highlight = false }) {
  return (
    <div className={`card ${highlight ? 'bg-gradient-to-br from-success/20 to-primary/20 border-2 border-success' : 'bg-base-100'} hover:shadow-xl transition-shadow`}>
      <div className="card-body">
        <div className="text-3xl mb-2">{icon}</div>
        <h3 className="card-title text-lg">{title}</h3>
        <p className="text-sm opacity-80">{description}</p>
      </div>
    </div>
  );
}
