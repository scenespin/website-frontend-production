import Link from "next/link";
import Image from "next/image";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";
import Footer from "@/components/Footer";
import logo from "@/app/icon.png";

const SCREENSHOT_SRC = "/images/provenance-ledger-audit-panel.png";

export const metadata = getSEOTags({
  title: `Wryda Provenance Ledger | ${config.appName}`,
  description: "Writer-first AI provenance and disclosure workflow exports with Wryda Provenance Ledger.",
  canonicalUrlRelative: "/provenance-ledger",
});

export default function ProvenanceLedgerPage() {
  return (
    <>
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
              <Link href="/pricing" className="text-sm text-gray-300 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/examples" className="text-sm text-gray-300 hover:text-white transition-colors">
                Examples
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="bg-[#0A0A0A] text-white min-h-screen">
        <section className="py-8 md:py-10 bg-gradient-to-b from-[#141414] to-[#0A0A0A]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[#141414] border border-[#3F3F46] rounded-xl p-5 md:p-6">
              <div className="text-center mb-5 md:mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black border border-[#DC143C]/30 text-sm mb-4">
                  <span className="font-semibold text-gray-300">Writer-First Trust</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
                  Wryda Provenance Ledger
                </h1>
                <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
                  Keep AI assistance optional and writer-directed, while preserving an auditable record of accepted AI-assisted actions for disclosure workflows.
                </p>
              </div>

              <div className="rounded-lg border border-[#3F3F46] bg-[#0E0E0E] p-3 md:p-4">
                <h2 className="text-xl font-bold mb-2">In-Product Provenance View</h2>
                <p className="text-sm text-gray-300 mb-4">
                  A live view of Wryda Provenance Ledger tracking AI-assisted actions and disclosure-ready export controls.
                </p>
                <div className="rounded-lg border border-[#3F3F46] bg-[#0E0E0E] aspect-[16/9] overflow-hidden relative">
                  <Image
                    src={SCREENSHOT_SRC}
                    alt="AI Disclosure panel showing provenance events and lock/export controls"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-8 md:pb-9">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
              <h2 className="text-xl font-bold mb-3">What it captures</h2>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Accepted in-app AI-assisted writing actions</li>
                <li>• Event-level provenance records linked to your screenplay</li>
                <li>• Exportable disclosure artifacts for submission workflows</li>
              </ul>
            </div>
            <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
              <h2 className="text-xl font-bold mb-3">What you can export</h2>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Human-readable PDF disclosure report</li>
                <li>• Machine-readable JSON snapshot</li>
                <li>• SHA-256 integrity hash file</li>
              </ul>
            </div>
            <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6 md:col-span-2">
              <h2 className="text-xl font-bold mb-3">How it fits your workflow</h2>
              <p className="text-sm text-gray-300 mb-4">
                Write first. Use AI only when you choose. Lock and export provenance bundles when your workflow requires disclosure documentation.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                <div className="rounded-lg border border-[#2F2F2F] bg-[#0E0E0E] px-3 py-2 text-gray-300">1) AI action accepted</div>
                <div className="rounded-lg border border-[#2F2F2F] bg-[#0E0E0E] px-3 py-2 text-gray-300">2) Event recorded</div>
                <div className="rounded-lg border border-[#2F2F2F] bg-[#0E0E0E] px-3 py-2 text-gray-300">3) Bundle exported</div>
                <div className="rounded-lg border border-[#2F2F2F] bg-[#0E0E0E] px-3 py-2 text-gray-300">4) Submission-ready package</div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                Supports WGA and studio disclosure workflows; not a legal determination, legal advice, or certification of compliance.
              </p>
            </div>
          </div>
        </section>

        <section className="py-10 md:py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors text-lg"
            >
              Start Writing
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
