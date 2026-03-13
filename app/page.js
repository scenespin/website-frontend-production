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
              <Link href="/examples" className="text-sm text-gray-300 hover:text-white transition-colors">
                Examples
              </Link>
              <Link href="/compare" className="text-sm text-gray-300 hover:text-white transition-colors">
                Compare
              </Link>
              <Link href="/models" className="text-sm text-gray-300 hover:text-white transition-colors">
                Models
              </Link>
              <Link href="/pricing" className="text-sm text-gray-300 hover:text-white transition-colors">
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
            <div className="text-center">
              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight mb-4 md:mb-6 px-2">
                Write the script only you can write.
              </h1>

              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 max-w-4xl mx-auto mb-4 md:mb-5 px-4">
                Write in a true screenplay environment, revise with full-context AI, and extend to production when it serves the story.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors text-base md:text-lg min-h-[44px] w-full sm:w-auto"
                >
                  Start Writing Free
                </Link>
                <Link
                  href="/examples"
                  className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 bg-[#141414] border border-[#3F3F46] text-white font-semibold rounded-lg hover:bg-[#1F1F1F] transition-colors text-base md:text-lg min-h-[44px] w-full sm:w-auto"
                >
                  See Real Workflows
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
                    <h3 className="text-xl font-bold mb-2">Workflow Preview</h3>
                    <p className="text-gray-400 text-sm">See how writing-first development carries from screenplay pages into production-ready workflows.</p>
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

        {/* Workflow Overview */}
        <section className="py-20 bg-black border-y border-[#1E1E1E]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">Create, Produce, Direct</h2>
              <p className="text-base sm:text-lg text-gray-300 max-w-3xl mx-auto">
                One connected workflow: build the story first, expand visual coverage, then carry scene and shot context through to delivery.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#121212] border border-[#3F3F46] rounded-lg p-6 h-full">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Create</p>
                <h3 className="text-xl font-semibold mb-3">Screenplay workspace</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>Pro screenplay editor and context-aware AI agents</li>
                  <li>Character, location, and prop extraction from script</li>
                  <li>Contextual pitch deck drafting and editing</li>
                </ul>
              </div>
              <div className="bg-[#121212] border border-[#3F3F46] rounded-lg p-6 h-full">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Produce</p>
                <h3 className="text-xl font-semibold mb-3">Coverage packages</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>Generate or upload image assets</li>
                  <li>Character pose, location angle, and prop angle coverage</li>
                  <li>Reusable visual assets organized by screenplay entities</li>
                </ul>
              </div>
              <div className="bg-[#121212] border border-[#3F3F46] rounded-lg p-6 h-full">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Direct</p>
                <h3 className="text-xl font-semibold mb-3">Shot-linked execution</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>Generate or upload first frames per scene and shot</li>
                  <li>Review sequence flow in Scene Shot Board</li>
                  <li>Launch action and dialogue video workflows with metadata continuity</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Create */}
        <section className="py-20 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              <p className="text-xs uppercase tracking-wide text-[#DC143C] mb-2">Create</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Write first, with professional control</h2>
              <p className="text-base sm:text-lg text-gray-300 mb-6">
                Create keeps writing as the core. Draft, revise, and structure your screenplay in a professional environment, then move into entity setup and pitch development using the same story context.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">Screenplay Workspace</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>Fountain-native editing and professional format compatibility</li>
                  <li>AI agents for rewrite, dialogue, structure, and scene extension</li>
                  <li>GitHub-backed revision continuity and version history</li>
                </ul>
              </div>
              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">Contextual Planning</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>Extract characters, locations, and props from screenplay context</li>
                  <li>Assign props and references at scene/entity level</li>
                  <li>Build contextual Pitch Decks for investors, festivals, and film packages</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Produce */}
        <section className="py-20 bg-[#111111]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              <p className="text-xs uppercase tracking-wide text-[#DC143C] mb-2">Produce</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Build reusable visual coverage</h2>
              <p className="text-base sm:text-lg text-gray-300 mb-6">
                Produce expands visual coverage without breaking organization. Generate or upload assets, then keep everything mapped to screenplay entities for reliable downstream use.
              </p>
            </div>
            <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">Coverage Packages</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300">
                <li>Character Pose Coverage for look and performance variation</li>
                <li>Location Angle Coverage for scene geography and continuity</li>
                <li>Prop Angle Coverage for story-critical detail consistency</li>
                <li>Bring Your Own Assets when generation is not required</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Direct */}
        <section className="py-20 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              <p className="text-xs uppercase tracking-wide text-[#DC143C] mb-2">Direct</p>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Move from first frames to final outputs</h2>
              <p className="text-base sm:text-lg text-gray-300 mb-6">
                Direct turns approved visual context into execution. Generate or upload first frames, review sequence flow in Scene Shot Board, then generate videos while preserving scene and shot continuity.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">Action Video Modes</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>Text-to-Video</li>
                  <li>First-Frame-to-Video</li>
                  <li>Frame-to-Frame Video</li>
                  <li>Elements-to-Video*</li>
                </ul>
              </div>
              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">AI-ADR Dialogue Workflow</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>AI Automated Dialogue Replacement (AI-ADR) for single-person dialogue shots</li>
                  <li>Voice continuity using built-in or cloned voices</li>
                  <li>Scene and shot-linked media stays organized through final output</li>
                </ul>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              * Availability depends on selected model/provider. Some controls are shown only where supported by selected workflow/model.
            </p>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-[#141414]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-16 px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
                Start Free. Scale When You Generate.
              </h2>
              <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
                Core writing features are available from day one. Credits apply when you run generation workflows.
              </p>
            </div>

            <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-6 md:p-8 mb-6 md:mb-8 mx-4 md:mx-0">
              <div className="text-center mb-6">
                <h3 className="text-xl md:text-2xl font-bold mb-2">Free Tier</h3>
                <p className="text-base md:text-lg text-gray-300">50 credits to start + 10 credits/month</p>
                <p className="text-xs md:text-sm text-gray-400 mt-2">Everything unlocked</p>
                <p className="text-xs md:text-sm text-gray-500 mt-1">Upgrade for volume, not access.</p>
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

      </main>
      
      <Footer />
    </>
  );
}
