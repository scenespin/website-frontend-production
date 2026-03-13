import Link from "next/link";
import Image from "next/image";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";
import Footer from "@/components/Footer";
import logo from "@/app/icon.png";

export const metadata = getSEOTags({
  title: `Complete Features | ${config.appName}`,
  description: "Explore screenplay-native writing features, agent workflows, and production planning tools in one integrated workspace.",
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
        <section className="py-16 md:py-20 bg-gradient-to-b from-[#141414] to-[#0A0A0A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-5">
                Feature depth across Create, Produce, and Direct
              </h1>
              <p className="text-lg md:text-xl text-gray-300 max-w-3xl mb-6">
                Start with screenplay craft, then extend into visual coverage and shot execution using the same story context.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center px-6 py-3 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors min-h-[44px]"
                >
                  Start Writing Free
                </Link>
                <Link
                  href="/models"
                  className="inline-flex items-center justify-center px-6 py-3 bg-[#141414] border border-[#3F3F46] text-white font-semibold rounded-lg hover:bg-[#1F1F1F] transition-colors min-h-[44px]"
                >
                  View Models
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Create */}
        <section className="py-16 bg-[#0A0A0A] border-y border-[#1E1E1E]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs uppercase tracking-wide text-[#DC143C] mb-2">Create</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Screenplay Workspace</h2>
            <p className="text-gray-300 max-w-3xl mb-6">
              Write and revise in a professional screenplay environment, then move into structured story setup and pitch development.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">Core Writing and Revision</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>Fountain-native editor compatible with Final Draft, Celtx, and Fade In workflows</li>
                  <li>AI agents for dialogue, rewrites, scene development, and story-level notes</li>
                  <li>Real-time collaboration and GitHub-backed version continuity</li>
                  <li>AI Writing Transparency tools with optional disclosure exports</li>
                </ul>
              </div>
              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">Structured Context and Pitch</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>Extract characters, locations, and scenes from screenplay context</li>
                  <li>Track and assign props and references by entity and scene</li>
                  <li>Contextual Pitch Decks for investor, festival, and film package workflows</li>
                  <li>Use Produce assets to elevate decks while preserving script context</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Produce */}
        <section className="py-16 bg-[#111111]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs uppercase tracking-wide text-[#DC143C] mb-2">Produce</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Coverage Packages and Asset Organization</h2>
            <p className="text-gray-300 max-w-3xl mb-6">
              Generate or upload reusable visual coverage that stays organized by screenplay entities.
            </p>
            <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300">
                <li>Character Pose Coverage for performance and wardrobe variation</li>
                <li>Location Angle Coverage for continuity across scene geography</li>
                <li>Prop Angle Coverage for story-critical object consistency</li>
                <li>Bring Your Own Assets upload path for existing media libraries</li>
                <li>Central organization by character, location, and prop records</li>
                <li>Reusable outputs for Direct and Contextual Pitch Deck workflows</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Direct */}
        <section className="py-16 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs uppercase tracking-wide text-[#DC143C] mb-2">Direct</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Shot-Linked First Frames and Video Workflows</h2>
            <p className="text-gray-300 max-w-3xl mb-6">
              Direct turns approved assets into first frames and videos while keeping scene and shot metadata connected across the workflow.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">Action and Planning Workflows</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>Generate or upload first frames per scene and shot</li>
                  <li>Review and sequence visuals in Scene Shot Board</li>
                  <li>Text-to-Video, First-Frame-to-Video, and Frame-to-Frame Video</li>
                  <li>Elements-to-Video*</li>
                </ul>
              </div>
              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">Dialogue and Voice Continuity</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>AI Automated Dialogue Replacement (AI-ADR) Voice-Locked Dialogue Workflow</li>
                  <li>Single-person dialogue shot workflow with consistent selected voice behavior</li>
                  <li>Use built-in voice library or cloned voices where supported</li>
                  <li>Scene/shot lineage preserved from first frame through final media</li>
                </ul>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              * Availability depends on selected model/provider. Some controls are shown only where supported by selected workflow/model.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-[#141414]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start with pages, then expand with control
            </h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Wryda keeps screenplay craft at the center and extends into production only when your project needs it.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors text-lg"
              >
                Start Writing Free
              </Link>
              <Link
                href="/examples"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#0A0A0A] border border-[#3F3F46] text-white font-semibold rounded-lg hover:bg-[#1F1F1F] transition-colors text-lg"
              >
                Explore Examples
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
}
