import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Complete Features | ${config.appName}`,
  description: "Explore all features including AI writing agents, video generation, character consistency, and professional production tools. Everything unlocked from day one.",
  canonicalUrlRelative: "/features",
});

export default function Features() {
  return (
    <>
      {/* Header */}
      <header className="bg-[#0A0A0A] border-b border-[#3F3F46] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-white">
                {config.appName}<span className="text-[#DC143C]">.ai</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/features" className="text-sm text-gray-300 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="/#pricing" className="text-sm text-gray-300 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/help" className="text-sm text-gray-300 hover:text-white transition-colors">
                Help
              </Link>
              <Link href="/sign-in" className="text-sm text-gray-300 hover:text-white transition-colors">
                Login
              </Link>
            </nav>
            <Link href="/sign-in" className="md:hidden text-sm text-gray-300 hover:text-white transition-colors">
              Login
            </Link>
          </div>
        </div>
      </header>

      <main className="bg-[#0A0A0A] text-white">
        {/* Hero */}
        <section className="py-20 bg-[#141414]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              Complete Feature List
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              <strong className="text-white">Everything unlocked from day one.</strong>
              <br />
              Free users get everything. Pro/Ultra/Studio just get more credits.
            </p>
          </div>
        </section>

        {/* Three Consistency Pillars */}
        <section className="py-20 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Professional Production Consistency
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                The only platform that maintains character, location, and prop consistency across every scene.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-8 hover:border-[#DC143C]/50 transition-colors">
                <div className="text-4xl mb-4">👤</div>
                <h3 className="text-xl font-bold mb-3">Character Consistency</h3>
                <p className="text-gray-300 mb-4">
                  Same character, same voice, same outfit across every scene. Virtual try-ons for wardrobe changes.
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Face consistency across all scenes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Voice consistency with premade or cloned voices</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Outfit consistency with virtual try-ons</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>One headshot → unlimited scenes</span>
                  </li>
                </ul>
              </div>

              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-8 hover:border-[#DC143C]/50 transition-colors">
                <div className="text-4xl mb-4">📍</div>
                <h3 className="text-xl font-bold mb-3">Location Consistency</h3>
                <p className="text-gray-300 mb-4">
                  Same location, multiple angles. Background consistency across shots.
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Multiple camera angles per location</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Background consistency across scenes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Reuse locations across unlimited scenes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Upload once, use everywhere</span>
                  </li>
                </ul>
              </div>

              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-8 hover:border-[#DC143C]/50 transition-colors">
                <div className="text-4xl mb-4">🎬</div>
                <h3 className="text-xl font-bold mb-3">Prop Consistency</h3>
                <p className="text-gray-300 mb-4">
                  Props stay consistent throughout. Digital prop department.
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>3D prop models for consistency</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Reuse props across scenes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Digital asset library</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Export to 3D formats (GLB/OBJ/USDZ)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* AI Writing Agents */}
        <section className="py-20 bg-[#141414]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                AI Writing Agents
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                5 Specialized Agents Powered by OpenAI, Anthropic, and Google
              </p>
            </div>

            {/* Story Advisor - Featured */}
            <div className="bg-[#0A0A0A] border-2 border-[#DC143C] rounded-lg p-8 mb-12">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🌟</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-2xl font-bold">Story Advisor</h3>
                    <span className="px-2 py-1 bg-[#DC143C] text-white text-xs font-semibold rounded">Unique</span>
                  </div>
                  <p className="text-lg text-gray-300 mb-4">
                    Reads your <strong className="text-white">entire screenplay</strong>. Analyzes structure across all acts, tracks character arcs throughout, identifies plot holes and inconsistencies.
                  </p>
                  <p className="text-sm text-gray-400 italic mb-4">
                    "Nothing like this exists for screenwriting. The Story Advisor holds your entire script in context and provides comprehensive analysis."
                  </p>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-[#DC143C]">✓</span>
                      <span>Analyzes structure across all acts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#DC143C]">✓</span>
                      <span>Tracks character arcs throughout</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#DC143C]">✓</span>
                      <span>Identifies plot holes and inconsistencies</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#DC143C]">✓</span>
                      <span>Provides story-level feedback</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Other Agents Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-6 hover:border-[#DC143C]/50 transition-colors">
                <div className="text-3xl mb-3">✍️</div>
                <h3 className="text-lg font-bold mb-2">Screenwriter</h3>
                <p className="text-sm text-gray-300">
                  Continue scenes, expand dialogue, develop characters. Understands your screenplay context.
                </p>
              </div>

              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-6 hover:border-[#DC143C]/50 transition-colors">
                <div className="text-3xl mb-3">🎬</div>
                <h3 className="text-lg font-bold mb-2">Director</h3>
                <p className="text-sm text-gray-300">
                  Generate full scenes with action, dialogue, and direction. Production-ready formatting.
                </p>
              </div>

              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-6 hover:border-[#DC143C]/50 transition-colors">
                <div className="text-3xl mb-3">💬</div>
                <h3 className="text-lg font-bold mb-2">Dialogue</h3>
                <p className="text-sm text-gray-300">
                  Polish dialogue, match character voice, improve conversations. Character-aware rewriting.
                </p>
              </div>

              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-6 hover:border-[#DC143C]/50 transition-colors">
                <div className="text-3xl mb-3">✨</div>
                <h3 className="text-lg font-bold mb-2">Rewrite</h3>
                <p className="text-sm text-gray-300">
                  Polish and refine. Fix pacing, improve clarity, enhance style. Professional editing.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Complete Production Platform
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Everything you need to turn your screenplay into a movie.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCard
                icon="👤"
                title="Character Images"
                description="One headshot → unlimited scenes. Consistent characters across your entire production."
              />
              <FeatureCard
                icon="📍"
                title="Location Images"
                description="Multiple angles per location. Consistent backgrounds across all scenes."
              />
              <FeatureCard
                icon="🎬"
                title="Prop Images"
                description="Digital prop department. Reuse props across unlimited scenes."
              />
              <FeatureCard
                icon="🎥"
                title="Motion Picture Technology"
                description="Generate complete scenes from your script. Professional video generation."
              />
              <FeatureCard
                icon="📖"
                title="Screenplay Readings"
                description="AI voice actors read your script. Hear your dialogue come to life."
              />
              <FeatureCard
                icon="🎤"
                title="Voice Control"
                description="Choose from premade voices or bring your own cloned voice."
              />
              <FeatureCard
                icon="☁️"
                title="Cloud Backup"
                description="Automatic backup to Google Drive and Dropbox. Your screenplays and assets are always safe."
              />
              <FeatureCard
                icon="✍️"
                title="Screenplay Editor"
                description="Professional Fountain format editor. Industry-standard formatting with AI assistance."
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-[#141414]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Create?
            </h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Sign up for free and get 50 credits to start. All features unlocked from day one.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors text-lg"
            >
              Start Free - 50 Credits
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6 hover:border-[#DC143C]/50 transition-colors">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-gray-300">{description}</p>
    </div>
  );
}
