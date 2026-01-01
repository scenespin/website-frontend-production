import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Wryda.ai vs Final Draft, Celtx, StudioBinder & More | ${config.appName}`,
  description: "Compare Wryda.ai to Final Draft, Celtx, StudioBinder, WriterDuet, Fade In, and other screenwriting software. See why Wryda.ai is the only platform that helps you write AND produce.",
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
              <span className="text-2xl font-extrabold text-white">
                {config.appName}<span className="text-[#DC143C]">.ai</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/features" className="text-sm text-gray-300 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="/pricing" className="text-sm text-gray-300 hover:text-white transition-colors">
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
              Wryda.ai vs. The Competition
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              They help you write. We help you write <strong className="text-white">AND</strong> produce.
              <br />
              The only platform that turns your screenplay into a movie.
            </p>
          </div>
        </section>

        {/* Main Comparison Table */}
        <section className="py-20 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse rounded-lg overflow-hidden border border-[#3F3F46]">
                <thead>
                  <tr className="border-b-2 border-[#3F3F46]">
                    <th className="text-left p-4 bg-[#141414] font-bold">Feature</th>
                    <th className="text-center p-4 bg-[#DC143C]/20 font-bold border-l-2 border-[#DC143C]">
                      <div className="text-[#DC143C]">Wryda.ai</div>
                      <div className="text-xs text-gray-400 font-normal mt-1">$0/month</div>
                    </th>
                    <th className="text-center p-4 bg-[#141414] font-bold border-l border-[#3F3F46]">
                      <div>Final Draft</div>
                      <div className="text-xs text-gray-400 font-normal mt-1">$249/year</div>
                    </th>
                    <th className="text-center p-4 bg-[#141414] font-bold border-l border-[#3F3F46]">
                      <div>Celtx</div>
                      <div className="text-xs text-gray-400 font-normal mt-1">$20-50/month</div>
                    </th>
                    <th className="text-center p-4 bg-[#141414] font-bold border-l border-[#3F3F46]">
                      <div>StudioBinder</div>
                      <div className="text-xs text-gray-400 font-normal mt-1">$29-99/month</div>
                    </th>
                    <th className="text-center p-4 bg-[#141414] font-bold border-l border-[#3F3F46]">
                      <div>WriterDuet</div>
                      <div className="text-xs text-gray-400 font-normal mt-1">$9-19/month</div>
                    </th>
                    <th className="text-center p-4 bg-[#141414] font-bold border-l border-[#3F3F46]">
                      <div>Fade In</div>
                      <div className="text-xs text-gray-400 font-normal mt-1">$80 one-time</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Screenplay Writing */}
                  <tr className="border-b border-[#3F3F46]">
                    <td className="p-4 font-semibold bg-[#141414]">Screenplay Writing</td>
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

                  {/* Fountain Format */}
                  <tr className="border-b border-[#3F3F46]">
                    <td className="p-4 bg-[#141414]">Fountain Format Support</td>
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

                  {/* AI Writing Agents */}
                  <tr className="border-b border-[#3F3F46]">
                    <td className="p-4 font-semibold bg-[#141414]">AI Writing Agents</td>
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
                    <td className="p-4 bg-[#141414]">Story Advisor (Reads Entire Screenplay)</td>
                    <td className="p-4 text-center border-l-2 border-[#DC143C]">
                      <span className="text-[#DC143C] font-bold">✓ Unique</span>
                      <div className="text-xs text-gray-400 mt-1">Only Wryda.ai</div>
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
                    <td className="p-4 font-semibold bg-[#141414]">Scene Builder (AI Video Generation)</td>
                    <td className="p-4 text-center border-l-2 border-[#DC143C]">
                      <span className="text-[#DC143C] font-bold">✓ Groundbreaking</span>
                      <div className="text-xs text-gray-400 mt-1">Only Wryda.ai - Generate complete scenes from screenplay</div>
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
                    <td className="p-4 bg-[#141414]">Character Consistency System</td>
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
                    <td className="p-4 bg-[#141414]">Location & Prop Consistency</td>
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
                    <td className="p-4 bg-[#141414]">Scene-to-Video Generation</td>
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
                    <td className="p-4 font-semibold bg-[#141414]">Production Management</td>
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

                  {/* Cloud Storage */}
                  <tr className="border-b border-[#3F3F46]">
                    <td className="p-4 bg-[#141414]">Cloud Storage Integration</td>
                    <td className="p-4 text-center border-l-2 border-[#DC143C]">
                      <span className="text-[#DC143C] font-bold">✓</span>
                      <div className="text-xs text-gray-400 mt-1">Drive, Dropbox</div>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-400">✓</span>
                      <div className="text-xs text-gray-500 mt-1">iCloud, Dropbox</div>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-400">✓</span>
                      <div className="text-xs text-gray-500 mt-1">Built-in</div>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-400">✓</span>
                      <div className="text-xs text-gray-500 mt-1">Built-in</div>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-400">✓</span>
                      <div className="text-xs text-gray-500 mt-1">Built-in</div>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-500">No</span>
                    </td>
                  </tr>

                  {/* Collaboration */}
                  <tr className="border-b border-[#3F3F46]">
                    <td className="p-4 bg-[#141414]">Real-Time Collaboration</td>
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
                    <td className="p-4 font-semibold bg-[#141414]">Pricing Model</td>
                    <td className="p-4 text-center border-l-2 border-[#DC143C]">
                      <span className="text-[#DC143C] font-bold">FREE</span>
                      <div className="text-xs text-gray-400 mt-1">Pay for credits only</div>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-400">$249/year</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-400">$20-50/month</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-400">$29-99/month</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-400">$9-19/month</span>
                    </td>
                    <td className="p-4 text-center border-l border-[#3F3F46]">
                      <span className="text-gray-400">$80 one-time</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Key Differentiators */}
            <div className="mt-16 grid md:grid-cols-3 gap-8">
              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
                <div className="text-3xl mb-3">🎬</div>
                <h3 className="text-xl font-bold mb-3">Scene Builder</h3>
                <p className="text-gray-300 text-sm">
                  The only platform that generates complete video scenes directly from your screenplay. Our motion picture technology brings your script to life with professional, consistent scene packages—something no other tool can do.
                </p>
              </div>

              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
                <div className="text-3xl mb-3">🌟</div>
                <h3 className="text-xl font-bold mb-3">Story Advisor</h3>
                <p className="text-gray-300 text-sm">
                  The only AI that reads your entire screenplay. Analyzes structure, tracks character arcs, identifies plot holes—nothing like this exists.
                </p>
              </div>

              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
                <div className="text-3xl mb-3">💰</div>
                <h3 className="text-xl font-bold mb-3">Free Software</h3>
                <p className="text-gray-300 text-sm">
                  While competitors charge $249-$1,200/year just for software, Wryda.ai is completely free. You only pay for AI generation when you use it.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SEO Positioning Section */}
        <section className="py-20 bg-[#141414]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Choose Wryda.ai?
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                We're not just another screenwriting tool. We're the only platform that takes you from script to screen.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-8">
                <h3 className="text-2xl font-bold mb-4">vs. Final Draft / Celtx / Fade In</h3>
                <p className="text-gray-300 mb-4">
                  <strong className="text-white">They help you write. We help you write AND produce.</strong>
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
                    <span>Plus character/location/prop consistency (unique to us)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Plus Story Advisor (reads entire screenplay - only Wryda)</span>
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
                  <strong className="text-white">They manage production. We help you create it.</strong>
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
                    <span>Plus character consistency system (unique to us)</span>
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
                  <strong className="text-white">They focus on collaboration. We focus on creation AND collaboration.</strong>
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
                    <span>Plus Story Advisor (unique to Wryda)</span>
                  </li>
                </ul>
              </div>

              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-8">
                <h3 className="text-2xl font-bold mb-4">vs. AI Writing Tools (ChatGPT, Claude, etc.)</h3>
                <p className="text-gray-300 mb-4">
                  <strong className="text-white">We use the same powerful models, but in a screenplay-specific environment that understands your entire project.</strong>
                </p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Switch between OpenAI, Anthropic, and Google models—all within our specialized agents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>5 screenplay-trained agents that understand Fountain format, character arcs, and story structure</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Story Advisor reads your entire screenplay—context that general AI tools can't access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Integrated with your characters, locations, and scenes—everything works together</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Scene Builder generates complete video scenes directly from your screenplay</span>
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
                    <span>Export to PDF (WGA standard)</span>
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

            <div className="bg-[#141414] border-2 border-[#DC143C] rounded-lg p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">The Only AI Platform Built for Fountain</h3>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                While other AI tools treat screenplays as plain text, Wryda.ai understands the structure, format, and industry standards that make screenplays work.
              </p>
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors text-lg"
              >
                Start Free - 50 Credits
              </Link>
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
              Join creators who've moved from Final Draft, Celtx, and StudioBinder to the only platform that helps you write AND produce.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors text-lg"
              >
                Start Free - 50 Credits
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#141414] border border-[#3F3F46] text-white font-semibold rounded-lg hover:bg-[#1F1F1F] transition-colors text-lg"
              >
                See All Features
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

