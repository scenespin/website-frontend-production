'use client';

import Link from "next/link";
import Image from "next/image";
import config from "@/config";
import Footer from "@/components/Footer";
import logo from "@/app/icon.png";
import { ShowcaseGallery } from "@/components/showcase/ShowcaseGallery";
import { useShowcaseStatus } from "@/hooks/useShowcase";

export default function ExamplesPage() {
  const { data: status, isLoading: statusLoading } = useShowcaseStatus();
  const writingExamples = [
    {
      title: "Action line tightening",
      agent: "Rewrite",
      before:
        "Sarah walks into the newsroom and looks around nervously as everyone stares at her and she slowly walks toward her desk.",
      after:
        "Sarah enters the newsroom. Heads turn. She keeps moving toward her desk without looking up.",
      outcome: "Sharper rhythm and cleaner visual beats without changing intent.",
    },
    {
      title: "Dialogue voice polish",
      agent: "Dialogue",
      before:
        "I do not believe we can trust him right now because he has lied to us before and he is hiding something.",
      after:
        "We can't trust him. He lied before, and he's still hiding something.",
      outcome: "More natural character voice with stronger on-page impact.",
    },
    {
      title: "Scene continuation draft",
      agent: "Screenwriter",
      before:
        "Marcus sees Sarah in the hallway.",
      after:
        "Marcus catches Sarah in the hallway and lowers his voice.\n\nMARCUS\nYou should've stopped digging when I warned you.\n\nSARAH\nThen stop giving me reasons to keep going.",
      outcome: "Expanded conflict while preserving your story direction.",
    },
  ];
  
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
              <Link href="/examples" className="text-sm text-white font-medium">
                Examples
              </Link>
              <Link href="/#pricing" className="text-sm text-gray-300 hover:text-white transition-colors">
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

      <main className="bg-[#0A0A0A] text-white min-h-screen">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-[#141414] to-[#0A0A0A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black border border-[#DC143C]/30 text-sm mb-6">
              <span className="font-semibold text-gray-300">✨ Real Writer Workflows</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              Writing + Visual Workflow Examples
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              See how screenplay-first work in Wryda extends into optional visual planning. The examples below show character, location, and prop references used to support writing, continuity, and production prep.
            </p>
            
            {/* Stats */}
            {status && (
              <div className="flex justify-center gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-[#DC143C]">{status.contentCounts?.characters || 0}</div>
                  <div className="text-sm text-gray-400">Character References</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-cyan-400">{status.contentCounts?.locations || 0}</div>
                  <div className="text-sm text-gray-400">Location References</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-amber-400">{status.contentCounts?.props || 0}</div>
                  <div className="text-sm text-gray-400">Prop References</div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Writing Before/After Examples */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Before/After Writing Examples</h2>
              <p className="text-gray-300 max-w-3xl mx-auto">
                Sample text edits showing how writers can use Wryda agents for rewrite, dialogue polish, and scene expansion.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {writingExamples.map((example) => (
                <article
                  key={example.title}
                  className="rounded-xl border border-[#3F3F46] bg-[#111111] p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">{example.title}</h3>
                    <span className="text-xs px-2 py-1 rounded bg-[#DC143C]/20 text-[#F28BA0] border border-[#DC143C]/40">
                      {example.agent}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Before</p>
                      <p className="text-sm text-gray-300 whitespace-pre-line">{example.before}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">After</p>
                      <p className="text-sm text-white whitespace-pre-line">{example.after}</p>
                    </div>
                    <div className="pt-2 border-t border-[#2A2A2A]">
                      <p className="text-xs text-gray-400">{example.outcome}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Characters Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ShowcaseGallery 
              contentType="characters"
              columns={4}
              title="Character Reference Examples"
              showTitle={true}
            />
          </div>
        </section>

        {/* Locations Section */}
        <section className="py-16 bg-[#0D0D0D]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ShowcaseGallery 
              contentType="locations"
              columns={3}
              title="Location Planning Examples"
              showTitle={true}
            />
          </div>
        </section>

        {/* Props Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ShowcaseGallery 
              contentType="props"
              columns={4}
              title="Prop Continuity Examples"
              showTitle={true}
            />
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-b from-[#0A0A0A] to-[#141414]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to build your next script in Wryda?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Start writing with screenplay-native tools, then extend into optional visual planning when you need it.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors text-lg"
            >
              Start Your Script
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
