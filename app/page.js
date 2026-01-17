'use client';

import Link from "next/link";
import Image from "next/image";
import config from "@/config";
import Footer from "@/components/Footer";
import logo from "@/app/icon.png";
import { ShowcaseGallery } from "@/components/showcase/ShowcaseGallery";
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
              <Link href="/how-it-works" className="text-sm text-gray-300 hover:text-white transition-colors">
                How It Works
              </Link>
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
            <div className="text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#141414] border border-[#3F3F46] text-sm mb-8">
                <span className="font-semibold text-gray-300">Early Access</span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-300">Building With Creators</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4 md:mb-6 px-2">
                Turn Your Screenplay Into Visual Assets
              </h1>

              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 max-w-3xl mx-auto mb-4 md:mb-6 px-4">
                The First Integrated Screenwriting Environment (ISE)
              </p>

              <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-6 md:mb-8 px-4">
                Generate production-ready assets from your screenplay: characters, locations, props, and wardrobe. Then bring them to life with video scenes that become your live storyboard. <span className="italic">(Video scenes coming soon)</span>
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors text-base md:text-lg min-h-[44px] w-full sm:w-auto"
                >
                  Start Free - 50 Credits
                </Link>
                <Link
                  href="#demo"
                  className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 bg-[#141414] border border-[#3F3F46] text-white font-semibold rounded-lg hover:bg-[#1F1F1F] transition-colors text-base md:text-lg min-h-[44px] w-full sm:w-auto"
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
                    <p className="text-gray-400 text-sm">See how Wryda.ai turns your screenplay into video</p>
                  </div>
                </div>
              </div>

              {/* Showcase Gallery - AI Generated Examples */}
              <div className="mt-16 max-w-6xl mx-auto">
                <ShowcaseGallery 
                  contentType="all" 
                  limit={4}
                  columns={4}
                  title="See What Wryda Creates"
                  showSeeMore={false}
                />
                <div className="text-center mt-8">
                  <Link
                    href="/examples"
                    className="text-[#DC143C] hover:text-white text-sm font-medium transition-colors"
                  >
                    See all examples →
                  </Link>
                </div>
              </div>

              {/* Value Props */}
              <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-xs sm:text-sm text-gray-400 px-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>50 free credits to start</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Everything unlocked</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Import PDF, Fountain, or paste</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Wryda.ai Features Section */}
        <section className="py-20 bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4 text-[#DC143C]">Traditional Tools</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-gray-500">•</span>
                      <span>Writing lives in one app</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-500">•</span>
                      <span>Production assets live somewhere else</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-500">•</span>
                      <span>Context gets lost between tools</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-400 italic">Result: Workflow broken, tools don't talk to each other</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-[#141414] border border-[#DC143C]/30 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4 text-[#DC143C]">Wryda.ai</h3>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-start gap-2">
                      <span className="text-[#DC143C]">✍️</span>
                      <span><strong>Write</strong> : Professional screenplay editor with 5 AI writing agents</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#DC143C]">🎬</span>
                      <span><strong>Produce</strong> : Generate consistent character, location, and prop assets</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#DC143C]">🎞️</span>
                      <span className="flex items-center gap-2 flex-wrap">
                        <strong>Direct</strong>
                        <ComingSoonBadge size="sm" />
                        <span className="text-gray-300">: Scene Builder turns your script into video</span>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#DC143C]">🔗</span>
                      <span><strong>Integrated</strong> : Everything understands your screenplay context</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#DC143C]">📤</span>
                      <span><strong>Export</strong> : Ready for professional editing tools</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-[#141414] border border-[#DC143C]/30 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3 text-[#DC143C]">The Difference</h3>
                <p className="text-gray-300 mb-4">
                  An Integrated Screenwriting Environment isn't just a tool, it's a complete environment where every feature understands your screenplay context. Your characters stay consistent. Your locations are reused intelligently. Your AI agents know your full story. Create complete video productions from script to screen, making it an amazing tool for pitching by generating extensive visualizations upfront. Export for final editing and polish.
                </p>
                <div className="mt-4 pt-4 border-t border-[#3F3F46]">
                  <p className="text-sm font-semibold text-gray-300 mb-2">Perfect For:</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-[#0A0A0A] border border-[#3F3F46] rounded-full text-xs text-gray-300">Trailers & Teasers</span>
                    <span className="px-3 py-1 bg-[#0A0A0A] border border-[#3F3F46] rounded-full text-xs text-gray-300">Pilot Episodes</span>
                    <span className="px-3 py-1 bg-[#0A0A0A] border border-[#3F3F46] rounded-full text-xs text-gray-300">Short Films</span>
                    <span className="px-3 py-1 bg-[#0A0A0A] border border-[#3F3F46] rounded-full text-xs text-gray-300">Feature Development</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 italic">Built from production assets and video scenes (video coming soon)</p>
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
                Professional Production Consistency
              </h2>
              <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
                One reference, unlimited scenes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 px-4">
              {/* Characters */}
              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-6 md:p-8 hover:border-[#DC143C]/50 transition-colors">
                <div className="text-4xl mb-4">👤</div>
                <h3 className="text-lg md:text-xl font-bold mb-3">Characters</h3>
                <p className="text-gray-300">
                  Same face, voice, and wardrobe across every scene. Virtual try-ons for outfit changes.
                </p>
              </div>

              {/* Locations */}
              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-6 md:p-8 hover:border-[#DC143C]/50 transition-colors">
                <div className="text-4xl mb-4">📍</div>
                <h3 className="text-lg md:text-xl font-bold mb-3">Locations</h3>
                <p className="text-gray-300">
                  Multiple camera angles per location. Consistent backgrounds across shots.
                </p>
              </div>

              {/* Props */}
              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-6 md:p-8 hover:border-[#DC143C]/50 transition-colors">
                <div className="text-4xl mb-4">🎬</div>
                <h3 className="text-lg md:text-xl font-bold mb-3">Props</h3>
                <p className="text-gray-300">
                  Same prop, multiple angles. Consistent appearance everywhere.
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
                From screenplay to visual development in three steps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 px-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#DC143C] text-white text-2xl font-bold mb-6">
                  1
                </div>
                <h3 className="text-xl font-bold mb-3">Write</h3>
                <p className="text-gray-300">
                  Import your existing screenplay (PDF, Fountain, or paste) or start fresh. Characters and locations auto-detect instantly. Write with AI assistance or on your own.
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#DC143C] text-white text-2xl font-bold mb-6">
                  2
                </div>
                <h3 className="text-xl font-bold mb-3">Produce</h3>
                <p className="text-gray-300">
                  Generate consistent images from your references: character angles, location packages, wardrobe variations, and props.
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
                  Generate video scenes from your script. Your scenes become a live storyboard. Our motion picture technology handles consistency automatically.
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
                5 Specialized Agents Powered by OpenAI, Anthropic, and Google
              </p>
              <p className="text-xs sm:text-sm text-gray-400">
                Five specialized agents work inside your screenplay, not on isolated prompts.
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
                Complete Production Platform
              </h2>
              <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
                Everything you need for visual story development.
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
                <h3 className="text-lg font-bold mb-2">Motion Picture Technology</h3>
                <p className="text-sm text-gray-300">
                  Generate complete scenes from your script. Professional video generation.
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
                  Automatic backup to Google Drive and Dropbox. Your screenplays and assets are always safe.
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
                All features unlocked. The only difference is credits per month.
              </p>
            </div>

            <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-6 md:p-8 mb-6 md:mb-8 mx-4 md:mx-0">
              <div className="text-center mb-6">
                <h3 className="text-xl md:text-2xl font-bold mb-2">Free Tier</h3>
                <p className="text-base md:text-lg text-gray-300">50 credits to start + 10 credits/month</p>
                <p className="text-xs md:text-sm text-gray-400 mt-2">Everything unlocked</p>
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
              Ready to Visualize Your Screenplay?
            </h2>
            <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto mb-6 md:mb-8">
              Join creators using the first Integrated Screenwriting Environment. Develop trailers, pilots, and pitch-ready assets. Start free with 50 credits.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors text-base md:text-lg min-h-[44px] w-full sm:w-auto max-w-xs"
            >
              Start Free - 50 Credits
            </Link>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
}
