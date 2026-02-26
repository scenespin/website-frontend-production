import Link from 'next/link';
import Image from 'next/image';
import { getSEOTags } from '@/libs/seo';
import config from '@/config';
import Footer from '@/components/Footer';
import logo from '@/app/icon.png';

export const metadata = getSEOTags({
  title: `How It Works | ${config.appName}`,
  description: "Learn how writers keep ideas, screenplay context, and AI visuals connected in Wryda.ai.",
  canonicalUrlRelative: "/how-it-works",
});

export default function HowItWorksPage() {
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

      <main className="bg-[#0A0A0A] text-white min-h-screen">
        <section className="pt-14 pb-10 bg-gradient-to-b from-[#141414] to-[#0A0A0A] border-b border-[#1E1E1E]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-5">
              How Wryda Works
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-7">
              The same writer-first flow shown in examples, reduced to one clear framework you can scan in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/examples"
                className="inline-flex items-center justify-center px-6 py-3 bg-[#141414] border border-[#3F3F46] text-white font-semibold rounded-lg hover:bg-[#1F1F1F] transition-colors min-h-[44px]"
              >
                View Workflow Examples
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center px-6 py-3 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors min-h-[44px]"
              >
                Start Writing
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Script → Agents → Visuals → Shots</h2>
              <p className="text-gray-300 max-w-3xl mx-auto">
                Use this page for the operating model, then use examples for real captures and final output quality.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="rounded-xl border border-[#3F3F46] bg-[#111111] p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Step 1</p>
                <h3 className="font-semibold mb-2">Start with the script</h3>
                <p className="text-sm text-gray-300">Write directly in Wryda. Your screenplay remains the source of truth.</p>
              </div>
              <div className="rounded-xl border border-[#3F3F46] bg-[#111111] p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Step 2</p>
                <h3 className="font-semibold mb-2">Auto-detect story elements</h3>
                <p className="text-sm text-gray-300">Import or scan to detect characters and locations; props are added manually with the same downstream flow.</p>
              </div>
              <div className="rounded-xl border border-[#3F3F46] bg-[#111111] p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Step 3</p>
                <h3 className="font-semibold mb-2">Refine with AI agents</h3>
                <p className="text-sm text-gray-300">Use Story Advisor, Director, Dialogue, Screenwriter, and Rewrite without leaving screenplay context.</p>
              </div>
              <div className="rounded-xl border border-[#3F3F46] bg-[#111111] p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Step 4</p>
                <h3 className="font-semibold mb-2">Build visual continuity</h3>
                <p className="text-sm text-gray-300">Generate character, location, and prop outputs with continuity anchored to your script decisions.</p>
              </div>
              <div className="rounded-xl border border-[#3F3F46] bg-[#111111] p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Step 5</p>
                <h3 className="font-semibold mb-2">Plan shots</h3>
                <p className="text-sm text-gray-300">Carry approved context into Scene Builder and Shot Board to lock visual intent before production.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-2 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl border border-[#3F3F46] bg-[#111111] p-5 md:p-6">
                <h3 className="text-xl font-semibold mb-3">Why this page and examples both exist</h3>
                <p className="text-sm text-gray-300 mb-4">
                  This page explains the framework. <span className="text-white">Examples</span> proves the workflow with real captures, generated outputs, and live gallery data.
                </p>
                <Link href="/examples" className="text-sm text-[#DC143C] hover:text-[#ff4068]">
                  Go to Examples →
                </Link>
              </div>
              <div className="rounded-xl border border-[#3F3F46] bg-[#111111] p-5 md:p-6">
                <h3 className="text-xl font-semibold mb-3">Writer-first AI transparency</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Wryda includes optional provenance tracking so teams can export timestamped disclosure bundles for WGA and studio policy workflows.
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Supports disclosure workflows; not legal advice or certification of compliance.
                </p>
                <Link href="/provenance-ledger" className="text-sm text-[#DC143C] hover:text-[#ff4068]">
                  Learn about Wryda Provenance Ledger →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
