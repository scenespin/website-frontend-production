'use client';

import Link from "next/link";
import Image from "next/image";
import config from "@/config";
import Footer from "@/components/Footer";
import logo from "@/app/icon.png";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ButtonSignin from "@/components/ButtonSignin";
import ComingSoonBadge from "@/components/ComingSoonBadge";

export default function Page() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Redirect logged-in users to dashboard
  useEffect(() => {
    if (isLoaded && user) {
      router.push('/dashboard');
    }
  }, [isLoaded, user, router]);

  // Show loading while checking auth
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Don't render homepage if user is logged in (will redirect)
  if (user) {
    return null;
  }

  return (
    <>
      {/* Header */}
      <header className="bg-[#0A0A0A] border-b border-[#3F3F46] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src={logo}
                alt={`${config.appName} logo`}
                width={40}
                height={40}
                className="w-10 h-10"
                priority={true}
              />
              <span className="text-2xl font-extrabold text-white">
                {config.appName}<span className="text-[#DC143C]">.ai</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/features" className="text-sm text-gray-300 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="/examples" className="text-sm text-gray-300 hover:text-white transition-colors">
                Examples
              </Link>
              <Link href="/compare" className="text-sm text-gray-300 hover:text-white transition-colors">
                Compare
              </Link>
              <Link href="#pricing" className="text-sm text-gray-300 hover:text-white transition-colors">
                Pricing
              </Link>
              <div className="flex items-center">
                <ButtonSignin text="Login" extraStyle="!bg-transparent !border-none !text-gray-300 hover:!text-white !px-0 !min-h-0 !h-auto !text-sm !shadow-none !normal-case" />
              </div>
            </nav>
            <div className="md:hidden">
              <ButtonSignin text="Login" extraStyle="!bg-transparent !border-none !text-gray-300 hover:!text-white !px-0 !min-h-0 !h-auto !text-sm !shadow-none !normal-case" />
            </div>
          </div>
        </div>
      </header>

      <main className="bg-[#0A0A0A] text-white">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
            <div className="text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#141414] border border-[#3F3F46] text-sm mb-6">
                <span className="font-semibold text-gray-300">Early Access</span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-300">Built with Working Writers</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight mb-4 md:mb-6 px-2">
                Write the script only you can write.
              </h1>

              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 max-w-4xl mx-auto mb-4 md:mb-5 px-4">
                Wryda is a professional, screenplay-native workspace for faster drafts, sharper rewrites, and stronger pages, while keeping you in full creative control and carrying your story seamlessly into visual planning and video.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors text-base md:text-lg min-h-[44px] w-full sm:w-auto"
                >
                  Join Early Access
                </Link>
                <Link
                  href="/examples"
                  className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 bg-[#141414] border border-[#3F3F46] text-white font-semibold rounded-lg hover:bg-[#1F1F1F] transition-colors text-base md:text-lg min-h-[44px] w-full sm:w-auto"
                >
                  View Examples
                </Link>
              </div>

              {/* Demo Video Placeholder */}
              <div id="demo" className="mt-6 max-w-4xl mx-auto">
                <div className="bg-[#141414] border border-[#3F3F46] rounded-lg overflow-hidden aspect-video flex items-center justify-center relative group cursor-pointer hover:border-[#DC143C]/50 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] to-[#1F1F1F] opacity-50"></div>
                  <div className="relative z-10 text-center p-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#DC143C] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Product Walkthrough Coming Soon</h3>
                    <p className="text-gray-400 text-sm">We are documenting the workflow as we build. Join early access for first-look demos.</p>
                  </div>
                </div>
              </div>

              {/* Trust Strip */}
              <div className="mt-5 flex flex-wrap justify-center gap-3 md:gap-4 text-xs sm:text-sm text-gray-400 px-4">
                <span>Built for pro writers</span>
                <span className="text-gray-600">•</span>
                <span>AI assistance is optional and writer-directed</span>
                <span className="text-gray-600">•</span>
                <span>Wryda Provenance Ledger: lock and export timestamped, noneditable provenance bundles (PDF + JSON + SHA-256 hash) for WGA and studio policy submission workflows</span>
                <span className="text-gray-600">•</span>
                <span>Your screenplay data is not used to train AI models by Wryda or our AI API providers.</span>
              </div>
              <p className="text-xs text-gray-500 mt-4 px-4 max-w-4xl mx-auto">
                Supports WGA and studio disclosure workflows; not a legal determination, legal advice, or certification of compliance.
              </p>
            </div>
          </div>
        </section>

        {/* Wryda.ai Features Section */}
        <section className="py-20 bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4 text-[#DC143C]">What creators deal with today</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-gray-500">•</span>
                      <span>Ideas in docs, prompts in chats, images in folders</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-500">•</span>
                      <span>Visual outputs lose the "why" behind them</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-500">•</span>
                      <span>Team handoffs miss creative intent</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-400 italic">Result: rework, confusion, and slower creative decisions</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-[#141414] border border-[#DC143C]/30 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4 text-[#DC143C]">How Wryda helps</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-[#DC143C]">✍️</span>
                      <span><strong>Write</strong> : Build story direction in a screenplay-native workspace</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#DC143C]">🎬</span>
                      <span><strong>Align</strong> : Link concept notes to generated visuals</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#DC143C]">🧭</span>
                      <span><strong>Organize</strong> : Keep character, location, and prop context together</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#DC143C]">🔗</span>
                      <span><strong>Maintain continuity</strong> : Stay consistent as projects evolve</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#DC143C]">📤</span>
                      <span><strong>Export</strong> : Move into downstream tools when you are ready</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-[#141414] border border-[#DC143C]/30 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3 text-[#DC143C]">Why this workflow is different</h3>
                <p className="text-gray-300 mb-4">
                  Wryda keeps screenplay decisions as the source of truth. Visual outputs are generated from that story foundation, so iteration stays aligned instead of drifting into disconnected assets.
                </p>
                <div className="mt-4 pt-4 border-t border-[#3F3F46]">
                  <p className="text-sm font-semibold text-gray-300 mb-2">Best For:</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-[#0A0A0A] border border-[#3F3F46] rounded-full text-xs text-gray-300">Screenplay Development</span>
                    <span className="px-3 py-1 bg-[#0A0A0A] border border-[#3F3F46] rounded-full text-xs text-gray-300">Pitch Prep</span>
                    <span className="px-3 py-1 bg-[#0A0A0A] border border-[#3F3F46] rounded-full text-xs text-gray-300">Pre-Production Planning</span>
                    <span className="px-3 py-1 bg-[#0A0A0A] border border-[#3F3F46] rounded-full text-xs text-gray-300">Visual Concept Iteration</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 italic">Built for screenplay-first workflows that connect writing, visual ideation, and planning.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Three Consistency Pillars */}
        <section className="py-20 bg-[#141414]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-16 px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
                Keep creative context across assets
              </h2>
              <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
                Carry one story intent across characters, locations, and props.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 px-4">
              {/* Characters */}
              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-6 md:p-8 hover:border-[#DC143C]/50 transition-colors">
                <div className="text-4xl mb-4">👤</div>
                <h3 className="text-lg md:text-xl font-bold mb-3">Characters</h3>
                <p className="text-gray-300">
                  Track character intent, look direction, and visual iterations together.
                </p>
              </div>

              {/* Locations */}
              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-6 md:p-8 hover:border-[#DC143C]/50 transition-colors">
                <div className="text-4xl mb-4">📍</div>
                <h3 className="text-lg md:text-xl font-bold mb-3">Locations</h3>
                <p className="text-gray-300">
                  Organize location concepts with narrative context and scene relevance.
                </p>
              </div>

              {/* Props */}
              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-6 md:p-8 hover:border-[#DC143C]/50 transition-colors">
                <div className="text-4xl mb-4">🎬</div>
                <h3 className="text-lg md:text-xl font-bold mb-3">Props</h3>
                <p className="text-gray-300">
                  Keep prop references tied to story function, not just image files.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-16 px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
                How It Works
              </h2>
              <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
                Capture ideas, align visuals, and move forward with clarity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 px-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#DC143C] text-white text-2xl font-bold mb-6">
                  1
                </div>
                <h3 className="text-xl font-bold mb-3">Write</h3>
                <p className="text-gray-300">
                  Start with your screenplay or concept notes. Build story direction in a workspace designed for writing-first development.
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#DC143C] text-white text-2xl font-bold mb-6">
                  2
                </div>
                <h3 className="text-xl font-bold mb-3">Produce</h3>
                <p className="text-gray-300">
                  Generate and organize visual references while keeping each output connected to its creative intent.
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#DC143C] text-white text-2xl font-bold mb-6">
                  3
                </div>
                <h3 className="text-xl font-bold mb-3 flex items-center justify-center gap-2">
                  Direct
                  <ComingSoonBadge size="sm" />
                </h3>
                <p className="text-gray-300">
                  Extend selected scenes into visual planning workflows when you are ready for pitching and prep.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* AI Writing Agents */}
        <section className="py-20 bg-[#141414]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-16 px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
                AI Writing Agents
              </h2>
              <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto mb-2">
                Specialized writing support inside your screenplay workflow
              </p>
            </div>

            {/* Story Advisor - Featured */}
            <div className="bg-[#0A0A0A] border-2 border-[#DC143C] rounded-lg p-6 md:p-8 mb-8 md:mb-12 mx-4 md:mx-0">
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
                  <p className="text-sm text-gray-400 italic mb-4">Built to review full-script context so feedback stays coherent across scenes.</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-4">
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
                <div className="text-3xl mb-3">💫</div>
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
            <div className="text-center mb-12 md:mb-16 px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
                Core capabilities in one workspace
              </h2>
              <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
                Built around screenplay development first, with connected production support when you need it.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 px-4">
              {/* Feature Cards - Screenplay Editor First */}
              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6 hover:border-[#DC143C]/50 transition-colors">
                <div className="text-3xl mb-3">✍️</div>
                <h3 className="text-lg font-bold mb-2">Screenplay Editor</h3>
                <p className="text-sm text-gray-300 mb-2">
                  Professional Fountain format editor. Industry-standard format used by Final Draft, Celtx, and Fade In. Import/export compatible.
                </p>
                <p className="text-xs text-gray-400">
                  GitHub version control • Find & replace • Text formatting • Auto-save every 2s
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
                <h3 className="text-lg font-bold mb-2">Visual Planning</h3>
                <p className="text-sm text-gray-300">
                  Generate visual scene concepts from your script when you want pitching or planning support.
                </p>
              </div>

              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6 hover:border-[#DC143C]/50 transition-colors">
                <div className="text-3xl mb-3">📖</div>
                <h3 className="text-lg font-bold mb-2">Screenplay Readings</h3>
                <p className="text-sm text-gray-300">
                  AI voice actors read your script. Use premade voices or bring your own cloned voice. Hear your dialogue come to life.
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
                  Automatic backup to Google Drive and Dropbox. Your screenplays and project files are always safe.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-[#141414]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-16 px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
                Everything is Free. You Only Pay for Credits.
              </h2>
              <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
                Simple access model: core workflow is available early, and usage scales with credits.
              </p>
            </div>

            <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-6 md:p-8 mb-6 md:mb-8 mx-4 md:mx-0">
              <div className="text-center mb-6">
                <h3 className="text-xl md:text-2xl font-bold mb-2">Free Tier</h3>
                <p className="text-base md:text-lg text-gray-300">50 credits to start + 10 credits/month</p>
                <p className="text-xs md:text-sm text-gray-400 mt-2">Everything unlocked</p>
                <p className="text-xs md:text-sm text-gray-500 mt-1">Early supporters help shape roadmap priorities.</p>
              </div>
              <div className="flex justify-center">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center px-6 py-3 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors min-h-[44px] w-full sm:w-auto max-w-xs"
                >
                  Start Free
                </Link>
              </div>
            </div>

            <div className="text-center px-4">
              <Link
                href="/pricing#subscriptions"
                className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 bg-[#141414] border border-[#3F3F46] text-white font-semibold rounded-lg hover:bg-[#1F1F1F] transition-colors text-base md:text-lg min-h-[44px] w-full sm:w-auto max-w-xs"
              >
                See Full Pricing Details
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
              If this problem feels familiar, build with us.
            </h2>
            <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto mb-6 md:mb-8">
              Join early access to help shape a writer-first platform where ideas, writing, and visuals stay aligned.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors text-base md:text-lg min-h-[44px] w-full sm:w-auto max-w-xs"
            >
              Become a Founding Supporter
            </Link>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
}
