import Link from "next/link";
import Image from "next/image";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";
import Footer from "@/components/Footer";
import logo from "@/app/icon.png";

export const metadata = getSEOTags({
  title: `What Makes Wryda.ai Different | ${config.appName}`,
  description: "Compare Wryda.ai's screenplay-first Create/Produce/Direct workflow, writing agents, and production planning tools with common alternatives.",
  canonicalUrlRelative: "/compare",
});

export default function ComparePage() {
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
              <Link href="/compare" className="text-sm text-white font-medium">
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
        <section className="py-20 bg-[#141414]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black border border-[#DC143C]/30 text-sm mb-6">
              <span className="font-semibold text-gray-300">Screenplay-First Integrated Environment</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              What Makes Wryda Unique
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-2">
              A screenplay-first integrated workflow that keeps writing, references, and production planning connected.
              <br />
              <strong className="text-white">Built for writers who want one continuous context from draft to prep.</strong>
            </p>
            <p className="text-base text-gray-400 max-w-2xl mx-auto mb-8">
              One place for writing, references, and prep—see how others compare.
            </p>
            <p className="text-sm text-gray-500 max-w-3xl mx-auto">
              Includes the Wryda Provenance Ledger with optional timestamped, noneditable provenance bundles (PDF + JSON + SHA-256 hash) for WGA and studio policy workflows.
            </p>
            <p className="text-xs text-gray-400 max-w-3xl mx-auto mt-2">
              <Link href="/provenance-ledger" className="underline hover:text-white">
                Learn more about Wryda Provenance Ledger
              </Link>
            </p>
          </div>
        </section>

        {/* Main Comparison Table */}
        <section className="py-20 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse rounded-lg overflow-hidden border border-[#3F3F46] text-xs sm:text-sm md:text-[15px]">
                <thead>
                  <tr className="border-b-2 border-[#3F3F46]">
                    <th className="sticky left-0 z-20 text-left p-3 md:p-4 bg-[#141414] font-bold min-w-[220px]">Feature</th>
                    <th className="text-center p-4 bg-[#DC143C]/20 font-bold border-l-2 border-[#DC143C]">
                      <div className="text-[#DC143C]">Wryda.ai</div>
                      <div className="text-xs text-gray-400 font-normal mt-1">$0/month</div>
                    </th>
                    <th className="text-center p-4 bg-[#141414] font-bold border-l border-[#3F3F46]">
                      <div>Final Draft</div>
                      <div className="text-xs text-gray-400 font-normal mt-1 whitespace-nowrap">$249/yr</div>
                    </th>
                    <th className="text-center p-4 bg-[#141414] font-bold border-l border-[#3F3F46]">
                      <div>Celtx</div>
                      <div className="text-xs text-gray-400 font-normal mt-1 whitespace-nowrap">$20-50/mo</div>
                    </th>
                    <th className="text-center p-4 bg-[#141414] font-bold border-l border-[#3F3F46]">
                      <div>StudioBinder</div>
                      <div className="text-xs text-gray-400 font-normal mt-1 whitespace-nowrap">$29-99/mo</div>
                    </th>
                    <th className="text-center p-4 bg-[#141414] font-bold border-l border-[#3F3F46]">
                      <div>WriterDuet</div>
                      <div className="text-xs text-gray-400 font-normal mt-1 whitespace-nowrap">$9-19/mo</div>
                    </th>
                    <th className="text-center p-4 bg-[#141414] font-bold border-l border-[#3F3F46]">
                      <div>Fade In</div>
                      <div className="text-xs text-gray-400 font-normal mt-1 whitespace-nowrap">$80 once</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Integrated Screenwriting Environment (ISE) */}
                  <tr className="border-b-2 border-[#3F3F46]">
                    <td className="sticky left-0 z-10 p-3 md:p-4 font-bold bg-[#141414] text-[#DC143C] min-w-[220px] whitespace-nowrap">Integrated Screenwriting Env (ISE)</td>
                    <td className="p-4 text-center border-l-2 border-[#DC143C] bg-[#DC143C]/10">
                      <span className="text-[#DC143C] font-bold">✓ YES</span>
                      <div className="text-xs text-gray-300 mt-1">Create → Produce → Direct</div>
                      <div className="text-xs text-gray-400 mt-1">All in one platform</div>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                      <div className="text-xs text-gray-500 mt-1">Write only</div>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                      <div className="text-xs text-gray-500 mt-1">Write only</div>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                      <div className="text-xs text-gray-500 mt-1">Production only</div>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                      <div className="text-xs text-gray-500 mt-1">Write only</div>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                      <div className="text-xs text-gray-500 mt-1">Write only</div>
                    </td>
                  </tr>

                  {/* Screenplay Writing */}
                  <tr className="border-b border-[#3F3F46]">
                    <td className="sticky left-0 z-10 p-3 md:p-4 font-semibold bg-[#141414] min-w-[220px]">Screenplay Writing</td>
                    <td className="p-4 text-center border-l-2 border-[#DC143C]">
                      <span className="text-[#DC143C] font-bold">✓</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-400">✓</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-400">✓</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-400">✓</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-400">✓</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-400">✓</span>
                    </td>
                  </tr>

                  <tr className="border-b border-[#3F3F46]">
                    <td className="sticky left-0 z-10 p-3 md:p-4 bg-[#141414] min-w-[220px] whitespace-nowrap">Contextual Pitch Decks</td>
                    <td className="p-4 text-center border-l-2 border-[#DC143C]">
                      <span className="text-[#DC143C] font-bold">✓ Included</span>
                      <div className="text-xs text-gray-400 mt-1">Script-aware pitch drafting and editing</div>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                  </tr>

                  {/* Fountain Format */}
                  <tr className="border-b border-[#3F3F46]">
                    <td className="sticky left-0 z-10 p-3 md:p-4 bg-[#141414] min-w-[220px]">Fountain Format Support</td>
                    <td className="p-4 text-center border-l-2 border-[#DC143C]">
                      <span className="text-[#DC143C] font-bold">✓ Native</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">Import only</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">Limited</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-400">✓</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-400">✓</span>
                    </td>
                  </tr>

                  <tr className="border-b border-[#3F3F46]">
                    <td className="sticky left-0 z-10 p-3 md:p-4 bg-[#141414] min-w-[220px] whitespace-nowrap">AI disclosure export</td>
                    <td className="p-4 text-center border-l-2 border-[#DC143C]">
                      <span className="text-[#DC143C] font-bold">✓ Included</span>
                      <div className="text-xs text-gray-400 mt-1">Timestamped PDF + JSON + SHA-256 hash export</div>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                  </tr>

                  {/* AI Writing Agents */}
                  <tr className="border-b border-[#3F3F46]">
                    <td className="sticky left-0 z-10 p-3 md:p-4 font-semibold bg-[#141414] min-w-[220px]">AI Writing Agents</td>
                    <td className="p-4 text-center border-l-2 border-[#DC143C]">
                      <span className="text-[#DC143C] font-bold">✓ 5 Agents</span>
                      <div className="text-xs text-gray-400 mt-1">Story Advisor, Director, etc.</div>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                  </tr>

                  {/* Story Advisor */}
                  <tr className="border-b border-[#3F3F46]">
                    <td className="sticky left-0 z-10 p-3 md:p-4 bg-[#141414] min-w-[220px] whitespace-nowrap">Story Advisor (full screenplay)</td>
                    <td className="p-4 text-center border-l-2 border-[#DC143C]">
                      <span className="text-[#DC143C] font-bold">✓ Advanced</span>
                      <div className="text-xs text-gray-400 mt-1">Script-level analysis workflow</div>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                  </tr>

                  {/* Video Generation */}
                  <tr className="border-b border-[#3F3F46]">
                    <td className="sticky left-0 z-10 p-3 md:p-4 font-semibold bg-[#141414] min-w-[220px]">Scene Builder</td>
                    <td className="p-4 text-center border-l-2 border-[#DC143C]">
                      <span className="text-[#DC143C] font-bold">✓ In Platform</span>
                      <div className="text-xs text-gray-400 mt-1">Screenplay-linked scene generation workflow</div>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                  </tr>

                  {/* Character Consistency */}
                  <tr className="border-b border-[#3F3F46]">
                    <td className="sticky left-0 z-10 p-3 md:p-4 bg-[#141414] min-w-[220px] whitespace-nowrap">Character Consistency</td>
                    <td className="p-4 text-center border-l-2 border-[#DC143C]">
                      <span className="text-[#DC143C] font-bold">✓</span>
                      <div className="text-xs text-gray-400 mt-1">Face, voice, outfit</div>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                  </tr>

                  {/* Location/Prop Consistency */}
                  <tr className="border-b border-[#3F3F46]">
                    <td className="sticky left-0 z-10 p-3 md:p-4 bg-[#141414] min-w-[220px] whitespace-nowrap">Location & Prop Consistency</td>
                    <td className="p-4 text-center border-l-2 border-[#DC143C]">
                      <span className="text-[#DC143C] font-bold">✓</span>
                      <div className="text-xs text-gray-400 mt-1">Angle packages</div>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                  </tr>

                  {/* Scene-to-Video */}
                  <tr className="border-b border-[#3F3F46]">
                    <td className="sticky left-0 z-10 p-3 md:p-4 bg-[#141414] min-w-[220px] whitespace-nowrap">Visual Asset Generation</td>
                    <td className="p-4 text-center border-l-2 border-[#DC143C]">
                      <span className="text-[#DC143C] font-bold">✓</span>
                      <div className="text-xs text-gray-400 mt-1">From screenplay</div>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                  </tr>

                  {/* Production Management */}
                  <tr className="border-b border-[#3F3F46]">
                    <td className="sticky left-0 z-10 p-3 md:p-4 font-semibold bg-[#141414] min-w-[220px]">Production Management</td>
                    <td className="p-4 text-center border-l-2 border-[#DC143C]">
                      <span className="text-[#DC143C] font-bold">✓</span>
                      <div className="text-xs text-gray-400 mt-1">Character/Location/Prop banks</div>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-400">✓</span>
                      <div className="text-xs text-gray-500 mt-1">Limited</div>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-400">✓</span>
                      <div className="text-xs text-gray-500 mt-1">Separate tool</div>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                  </tr>

                  {/* Media Library Organization */}
                  <tr className="border-b border-[#3F3F46]">
                    <td className="sticky left-0 z-10 p-3 md:p-4 bg-[#141414] min-w-[220px] whitespace-nowrap">Media Library Organization</td>
                    <td className="p-4 text-center border-l-2 border-[#DC143C]">
                      <span className="text-[#DC143C] font-bold">✓</span>
                      <div className="text-xs text-gray-400 mt-1">Scene and shot-linked media tracking</div>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                  </tr>

                  <tr className="border-b border-[#3F3F46]">
                    <td className="sticky left-0 z-10 p-3 md:p-4 bg-[#141414] min-w-[220px] whitespace-nowrap">AI-ADR Dialogue Workflow</td>
                    <td className="p-4 text-center border-l-2 border-[#DC143C]">
                      <span className="text-[#DC143C] font-bold">✓ Included</span>
                      <div className="text-xs text-gray-400 mt-1">Single-person dialogue shots</div>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                  </tr>

                  {/* Collaboration */}
                  <tr className="border-b border-[#3F3F46]">
                    <td className="sticky left-0 z-10 p-3 md:p-4 bg-[#141414] min-w-[220px]">Real-Time Collaboration</td>
                    <td className="p-4 text-center border-l-2 border-[#DC143C]">
                      <span className="text-[#DC143C] font-bold">✓</span>
                      <div className="text-xs text-gray-400 mt-1">5 role types</div>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-400">✓</span>
                      <div className="text-xs text-gray-500 mt-1">Limited</div>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-400">✓</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-400">✓</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-[#DC143C] font-bold">✓</span>
                      <div className="text-xs text-gray-400 mt-1">Best feature</div>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                  </tr>

                  {/* Pricing Model */}
                  <tr className="border-b-2 border-[#3F3F46]">
                    <td className="sticky left-0 z-10 p-3 md:p-4 font-semibold bg-[#141414] min-w-[220px]">Pricing Model</td>
                    <td className="p-4 text-center border-l-2 border-[#DC143C]">
                      <span className="text-[#DC143C] font-bold">FREE</span>
                      <div className="text-xs text-gray-400 mt-1">Pay for credits only</div>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-400 whitespace-nowrap">$249/yr</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-400 whitespace-nowrap">$20-50/mo</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-400 whitespace-nowrap">$29-99/mo</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-400 whitespace-nowrap">$9-19/mo</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-400 whitespace-nowrap">$80 once</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              * Availability for specific generation options depends on selected model/provider and workflow settings.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              * Competitor capabilities are based on publicly available information at the time this comparison was created and may change.
            </p>

            {/* Key Differentiators */}
            <div className="mt-16 bg-[#141414] border border-[#3F3F46] rounded-lg p-6 md:p-8">
              <h3 className="text-2xl font-bold mb-4">At a Glance</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-300">
                <li>Scene Builder carries screenplay context into shot planning and scene generation.</li>
                <li>Story Advisor provides full-script analysis for structure, arcs, and revision direction.</li>
                <li>Create, Produce, and Direct stay connected in one continuous workflow.</li>
                <li>Software access is free; credits apply when you generate AI outputs.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Unique Capabilities Section */}
        <section className="py-20 bg-[#141414]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Workflow Differentiators
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-12">
                These are the practical differences in how work moves from writing to planning.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-16">
              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">Writing and Analysis</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>Screenplay-aware AI built for Fountain workflows</li>
                  <li>Story Advisor support across the full screenplay</li>
                  <li>AI writing support that stays connected to project context</li>
                </ul>
              </div>
              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-6">
                <h3 className="text-xl font-bold mb-3">Planning and Execution</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>Screenplay-linked visual planning and references</li>
                  <li>Character, location, and prop continuity workflows</li>
                  <li>Create → Produce → Direct in one connected environment</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How We're Different Section */}
        <section className="py-20 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                How We're Different
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Other tools often focus on one stage. Wryda keeps writing and planning connected in one workflow.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-8">
                <h3 className="text-2xl font-bold mb-4">vs. Final Draft / Celtx / Fade In</h3>
                <p className="text-gray-300 mb-4">
                  <strong className="text-white">They focus on writing. Wryda connects writing with downstream planning.</strong>
                </p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>All the screenplay writing features they have</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Plus 5 AI writing agents (they have none)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Plus scene-to-video generation (they can't do this)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Plus character/location/prop continuity workflows</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Plus Story Advisor for script-level analysis across the full draft</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Software is FREE (they charge $80-$249/year)</span>
                  </li>
                </ul>
              </div>

              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-8">
                <h3 className="text-2xl font-bold mb-4">vs. StudioBinder</h3>
                <p className="text-gray-300 mb-4">
                  <strong className="text-white">StudioBinder focuses on production management. Wryda emphasizes screenplay creation plus connected planning.</strong>
                </p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Production management features (like StudioBinder)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Plus professional screenplay editor (they don't have)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Plus AI video generation (they can't generate content)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Plus character consistency tooling across scenes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>All-in-one platform (no separate tools needed)</span>
                  </li>
                </ul>
              </div>

              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-8">
                <h3 className="text-2xl font-bold mb-4">vs. WriterDuet</h3>
                <p className="text-gray-300 mb-4">
                  <strong className="text-white">WriterDuet emphasizes collaboration. Wryda pairs collaboration with integrated writing and planning workflows.</strong>
                </p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Real-time collaboration (like WriterDuet)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Plus 5 AI writing agents (they have none)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Plus scene-to-video generation (they can't do this)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Plus Story Advisor for full-draft analysis and revision direction</span>
                  </li>
                </ul>
              </div>

              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-8">
                <h3 className="text-2xl font-bold mb-2">vs. General AI Tools</h3>
                <p className="text-xs text-gray-500 mb-4">(ChatGPT, Claude, etc.)</p>
                <p className="text-gray-300 mb-4">
                  <strong className="text-white">Wryda applies major AI models inside a screenplay-specific workspace.</strong>
                </p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>
                      <Link href="/models" className="underline hover:text-white">
                        OpenAI, Anthropic, and Google models
                      </Link>{" "}
                      inside specialized agents
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Five screenplay-trained agents built for Fountain story structure</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Story Advisor reviews full-screenplay context</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Characters, locations, and scenes stay connected</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Scene Builder generates scenes from screenplay context</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Fountain Format Deep Dive */}
        <section className="py-20 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Fountain Format Matters
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Wryda.ai is built on Fountain—the open, industry-standard format that screenwriters trust.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-8">
                <h3 className="text-xl font-bold mb-4">Industry Standard</h3>
                <p className="text-gray-300 mb-4">
                  Fountain is the open format used by Final Draft, Celtx, Fade In, and WriterDuet. It's the universal language of screenwriting.
                </p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Import from Final Draft, Celtx, Fade In instantly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Export to professional PDF for submission workflows</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>No vendor lock-in</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Future-proof format</span>
                  </li>
                </ul>
              </div>

              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-8">
                <h3 className="text-xl font-bold mb-4">Better AI Results</h3>
                <p className="text-gray-300 mb-4">
                  Our AI agents are specifically trained on Fountain format. They understand screenplay structure, character arcs, and story beats.
                </p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>AI understands screenplay structure</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Auto-detects characters, locations, scenes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Story Advisor analyzes entire screenplay</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Scene Builder generates from screenplay structure</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">AI Platform Built for Fountain Workflows</h3>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                While many AI tools treat screenplays as plain text, Wryda.ai is designed around Fountain structure and screenplay-native workflows.
              </p>
              <p className="text-sm text-gray-400">
                See examples below, then start free when you are ready.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-[#141414]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Switch?
            </h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Join creators who've moved from disconnected writing and planning tools to a screenplay-first Create/Produce/Direct workflow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors text-lg"
              >
                Start Free
              </Link>
              <Link
                href="/examples"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#141414] border border-[#3F3F46] text-white font-semibold rounded-lg hover:bg-[#1F1F1F] transition-colors text-lg"
              >
                View Examples
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
}

