import Link from "next/link";
import config from "@/config";

export default function Page() {
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
              <Link href="/compare" className="text-sm text-gray-300 hover:text-white transition-colors">
                Compare
              </Link>
              <Link href="#pricing" className="text-sm text-gray-300 hover:text-white transition-colors">
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
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
            <div className="text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#141414] border border-[#3F3F46] text-sm mb-8">
                <span className="font-semibold text-gray-300">Early Access</span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-300">Building With Creators</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
                Turn Your Screenplay Into a Movie
              </h1>

              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
                AI-powered production tools that bring your script to life. Create pilots, trailers, short films, or full features—all from your browser.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors text-lg"
                >
                  Start Free - 50 Credits
                </Link>
                <Link
                  href="#demo"
                  className="inline-flex items-center justify-center px-8 py-4 bg-[#141414] border border-[#3F3F46] text-white font-semibold rounded-lg hover:bg-[#1F1F1F] transition-colors text-lg"
                >
                  Watch Demo
                </Link>
              </div>

              {/* Demo Video Placeholder */}
              <div id="demo" className="mt-12 max-w-4xl mx-auto">
                <div className="bg-[#141414] border border-[#3F3F46] rounded-lg overflow-hidden aspect-video flex items-center justify-center relative group cursor-pointer hover:border-[#DC143C]/50 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] to-[#1F1F1F] opacity-50"></div>
                  <div className="relative z-10 text-center p-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#DC143C] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Demo Video Coming Soon</h3>
                    <p className="text-gray-400 text-sm">See how Wryda.ai turns your screenplay into a movie</p>
                  </div>
                </div>
              </div>

              {/* Value Props */}
              <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>50 free credits to start</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Everything unlocked</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Three Consistency Pillars */}
        <section className="py-20 bg-[#141414]">
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
              {/* Character Consistency */}
              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-8 hover:border-[#DC143C]/50 transition-colors">
                <div className="text-4xl mb-4">👤</div>
                <h3 className="text-xl font-bold mb-3">Character Consistency</h3>
                <p className="text-gray-300 mb-4">
                  Same character, same voice, same outfit across every scene. Virtual try-ons for wardrobe changes. One headshot → unlimited scenes.
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">•</span>
                    <span>Face consistency across all scenes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">•</span>
                    <span>Voice consistency with premade or cloned voices</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">•</span>
                    <span>Outfit consistency with virtual try-ons</span>
                  </li>
                </ul>
              </div>

              {/* Location Consistency */}
              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-8 hover:border-[#DC143C]/50 transition-colors">
                <div className="text-4xl mb-4">📍</div>
                <h3 className="text-xl font-bold mb-3">Location Consistency</h3>
                <p className="text-gray-300 mb-4">
                  Same location, multiple angles. Background consistency across shots. Upload once, use everywhere.
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">•</span>
                    <span>Multiple camera angles per location</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">•</span>
                    <span>Background consistency across scenes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">•</span>
                    <span>Reuse locations across unlimited scenes</span>
                  </li>
                </ul>
              </div>

              {/* Prop Consistency */}
              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-8 hover:border-[#DC143C]/50 transition-colors">
                <div className="text-4xl mb-4">🎬</div>
                <h3 className="text-xl font-bold mb-3">Prop Consistency</h3>
                <p className="text-gray-300 mb-4">
                  Same prop, multiple angles. Background consistency across shots. Upload once, use everywhere.
                </p>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">•</span>
                    <span>Multiple angles per prop</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">•</span>
                    <span>Consistent appearance across scenes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">•</span>
                    <span>Reuse props across unlimited scenes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">•</span>
                    <span>Digital asset library</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                How It Works
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                From screenplay to finished video in three simple steps.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#DC143C] text-white text-2xl font-bold mb-6">
                  1
                </div>
                <h3 className="text-xl font-bold mb-3">Write</h3>
                <p className="text-gray-300">
                  Write your screenplay or let AI help. Our specialized agents understand screenwriting and can teach you along the way.
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#DC143C] text-white text-2xl font-bold mb-6">
                  2
                </div>
                <h3 className="text-xl font-bold mb-3">Build</h3>
                <p className="text-gray-300">
                  Build your cast, locations, and props. Upload character images, define locations, and add props to your production hub.
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#DC143C] text-white text-2xl font-bold mb-6">
                  3
                </div>
                <h3 className="text-xl font-bold mb-3">Generate</h3>
                <p className="text-gray-300">
                  Generate complete scenes from your script. Our motion picture technology handles consistency automatically.
                </p>
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
              <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-2">
                5 Specialized Agents Powered by OpenAI, Anthropic, and Google
              </p>
              <p className="text-sm text-gray-400">
                All agents understand your screenplay context and work together to help you write better scripts.
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
              {/* Feature Cards - Screenplay Editor First */}
              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6 hover:border-[#DC143C]/50 transition-colors">
                <div className="text-3xl mb-3">✍️</div>
                <h3 className="text-lg font-bold mb-2">Screenplay Editor</h3>
                <p className="text-sm text-gray-300">
                  Professional Fountain format editor. Industry-standard format used by Final Draft, Celtx, and Fade In. Import/export compatible.
                </p>
              </div>

              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6 hover:border-[#DC143C]/50 transition-colors">
                <div className="text-3xl mb-3">👤</div>
                <h3 className="text-lg font-bold mb-2">Character Images</h3>
                <p className="text-sm text-gray-300">
                  One headshot → unlimited scenes. Consistent characters across your entire production.
                </p>
              </div>

              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6 hover:border-[#DC143C]/50 transition-colors">
                <div className="text-3xl mb-3">📍</div>
                <h3 className="text-lg font-bold mb-2">Location Images</h3>
                <p className="text-sm text-gray-300">
                  Multiple angles per location. Consistent backgrounds across all scenes.
                </p>
              </div>

              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6 hover:border-[#DC143C]/50 transition-colors">
                <div className="text-3xl mb-3">🎬</div>
                <h3 className="text-lg font-bold mb-2">Prop Images</h3>
                <p className="text-sm text-gray-300">
                  Multiple angles per prop. Consistent appearance across scenes.
                </p>
              </div>

              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6 hover:border-[#DC143C]/50 transition-colors">
                <div className="text-3xl mb-3">🎥</div>
                <h3 className="text-lg font-bold mb-2">Motion Picture Technology</h3>
                <p className="text-sm text-gray-300">
                  Generate complete scenes from your script. Professional video generation.
                </p>
              </div>

              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6 hover:border-[#DC143C]/50 transition-colors">
                <div className="text-3xl mb-3">📖</div>
                <h3 className="text-lg font-bold mb-2">Screenplay Readings</h3>
                <p className="text-sm text-gray-300">
                  AI voice actors read your script. Hear your dialogue come to life.
                </p>
              </div>

              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6 hover:border-[#DC143C]/50 transition-colors">
                <div className="text-3xl mb-3">🎤</div>
                <h3 className="text-lg font-bold mb-2">Voice Control</h3>
                <p className="text-sm text-gray-300">
                  Choose from premade voices or bring your own cloned voice.
                </p>
              </div>

              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6 hover:border-[#DC143C]/50 transition-colors">
                <div className="text-3xl mb-3">☁️</div>
                <h3 className="text-lg font-bold mb-2">Cloud Backup</h3>
                <p className="text-sm text-gray-300">
                  Automatic backup to Google Drive and Dropbox. Your screenplays and assets are always safe.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-[#141414]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Everything is Free. You Only Pay for Credits.
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                All features unlocked. The only difference is credits per month.
              </p>
            </div>

            <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-8 mb-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">Free Tier</h3>
                <p className="text-gray-300">50 credits to start + 10 credits/month</p>
                <p className="text-sm text-gray-400 mt-2">Everything unlocked</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center px-6 py-3 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors"
                >
                  Start Free
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center px-6 py-3 bg-[#141414] border border-[#3F3F46] text-white font-semibold rounded-lg hover:bg-[#1F1F1F] transition-colors"
                >
                  See Full Pricing
                </Link>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#141414] border border-[#3F3F46] text-white font-semibold rounded-lg hover:bg-[#1F1F1F] transition-colors text-lg"
              >
                See Full Pricing Details
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Turn Your Screenplay Into a Movie?
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-8">
              Join creators who are using AI to bring their scripts to life. Start free with 50 credits.
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
