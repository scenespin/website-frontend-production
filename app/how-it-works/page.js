import Link from 'next/link';
import Image from 'next/image';
import { getSEOTags } from '@/libs/seo';
import config from '@/config';
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
        <section className="py-16 md:py-20 bg-gradient-to-b from-[#141414] to-[#0A0A0A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight mb-4 md:mb-6">
                  How It Works
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-xl mb-6 md:mb-8">
                  Start with writing, keep your creative context intact, and connect AI visuals without losing the story behind them.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/sign-up"
                    className="inline-flex items-center justify-center px-6 py-3 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors min-h-[44px]"
                  >
                    Join Early Access
                  </Link>
                  <Link
                    href="/examples"
                    className="inline-flex items-center justify-center px-6 py-3 bg-[#141414] border border-[#3F3F46] text-white font-semibold rounded-lg hover:bg-[#1F1F1F] transition-colors min-h-[44px]"
                  >
                    View Workflow Examples
                  </Link>
                </div>
              </div>
              <div className="rounded-xl border border-[#3F3F46] bg-[#111111] p-6 md:p-7">
                <h2 className="text-lg md:text-xl font-semibold mb-4">Three steps</h2>
                <div className="space-y-3">
                  <div className="rounded-lg border border-[#2F2F2F] bg-[#0E0E0E] p-3 flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">1</span>
                    <div>
                      <p className="font-medium text-white">Create</p>
                      <p className="text-sm text-gray-400">Write and capture story context in one place.</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#2F2F2F] bg-[#0E0E0E] p-3 flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">2</span>
                    <div>
                      <p className="font-medium text-white">Produce</p>
                      <p className="text-sm text-gray-400">Generate references and keep them linked to intent.</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#2F2F2F] bg-[#0E0E0E] p-3 flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">3</span>
                    <div>
                      <p className="font-medium text-white">Direct</p>
                      <p className="text-sm text-gray-400">Extend selected scenes into planning workflows.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI Use Transparency */}
        <section className="py-12 md:py-16 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-xl border border-[#3F3F46] bg-[#111111] p-6 md:p-8 max-w-4xl mx-auto">
              <h2 className="text-xl md:text-2xl font-bold mb-3 text-white">Writer-first AI use transparency</h2>
              <p className="text-gray-300 mb-4">
                Wryda includes the optional <strong className="text-white">Wryda Provenance Ledger</strong> so you can track in-app AI-assisted writing actions and lock a timestamped, noneditable provenance bundle (PDF + JSON + SHA-256 hash) for WGA and studio policy submission workflows. It&apos;s optional and nonblocking, designed to support your workflow without changing how you write.
              </p>
              <ul className="space-y-2 text-sm text-gray-400 mb-4">
                <li className="flex items-start gap-2">
                  <span className="text-[#DC143C] mt-0.5">•</span>
                  <span>Track where AI insertions (Story Advisor, Rewrite, Dialogue, Screenwriter, Director) were accepted in your script</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#DC143C] mt-0.5">•</span>
                  <span>Lock and export a noneditable disclosure bundle (PDF + JSON snapshot + SHA-256 hash file) for WGA and studio policy submission packages</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#DC143C] mt-0.5">•</span>
                  <span>Add optional consent or policy context to the report</span>
                </li>
              </ul>
              <p className="text-xs text-gray-500">
                Supports WGA and studio disclosure workflows; not a legal determination, legal advice, or certification of compliance.
              </p>
              <p className="text-xs text-gray-400 mt-2">
                <Link href="/provenance-ledger" className="underline hover:text-white">
                  Learn more about Wryda Provenance Ledger
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* Three-Step Process */}
        <section className="py-20 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 md:gap-16">
              {/* Step 1: CREATE */}
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg text-white text-2xl font-bold">
                    1
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                      Create
                    </h2>
                    <span className="text-sm font-semibold text-gray-400 bg-[#141414] px-3 py-1 rounded-full">
                      Step 1
                    </span>
                  </div>
                  <p className="text-lg text-gray-300 leading-relaxed">
                    Start with the page. In Create, you build script context first, then connect supporting characters, locations, and props so everything stays grounded in your screenplay.
                  </p>
                  
                  {/* Import & Smart Detection Section */}
                  <div className="mt-6 p-6 bg-[#141414] border border-[#3F3F46] rounded-lg">
                    <h3 className="text-xl font-bold mb-4 text-[#DC143C]">Import & Smart Detection</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2 text-white">Import Your Existing Script</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          Import a Fountain script and Wryda automatically extracts characters and locations into reusable cards, reducing manual setup.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2 text-white">Rescan After Changes</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          After script edits, use "Re-scan Script" to detect newly added characters and locations and sync them back into your project.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2 text-white">Create Characters & Locations Outside the Script</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          You can create characters and locations before they appear in the script for planning and reference. Once they are written into your screenplay, a rescan links them automatically.
                        </p>
                        <p className="text-sm text-gray-400 mt-2 italic">
                          Works for both characters and locations, so planning and writing stay connected from the start.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3">
                      <span className="text-[#DC143C] mt-0.5">•</span>
                      <div>
                        <p className="font-medium text-white">Upload reference images</p>
                        <p className="text-sm text-gray-400">Add images for characters, locations, and props to establish your visual foundation</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[#DC143C] mt-0.5">•</span>
                      <div>
                        <p className="font-medium text-white">Write your script</p>
                        <p className="text-sm text-gray-400">Use our screenplay editor to write directly, or start with just an idea</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[#DC143C] mt-0.5">•</span>
                      <div>
                        <p className="font-medium text-white">Get AI assistance</p>
                        <p className="text-sm text-gray-400">Start from an idea, generate a first scene, and refine with specialized agents inside your screenplay workflow</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connecting Line */}
              <div className="hidden md:flex justify-center -my-8">
                <div className="w-px h-12 bg-gradient-to-b from-indigo-500 to-purple-600"></div>
              </div>

              {/* Step 2: PRODUCE */}
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg text-white text-2xl font-bold">
                    2
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                      Produce
                    </h2>
                    <span className="text-sm font-semibold text-gray-400 bg-[#141414] px-3 py-1 rounded-full">
                      Step 2
                    </span>
                  </div>
                  <p className="text-lg text-gray-300 leading-relaxed">
                    Turn screenplay context into reusable references. The Production Hub helps you generate character, location, and prop sets while preserving continuity and intent.
                  </p>
                  
                  {/* Transform Your Creation Assets Section */}
                  <div className="mt-6 p-6 bg-[#141414] border border-[#3F3F46] rounded-lg">
                    <h3 className="text-xl font-bold mb-4 text-[#DC143C]">Transform Your Creation Assets</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2 text-white">Your Uploaded Images Become AI References</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          Images you upload in Create become the foundation for production generation. Open any character, location, or prop to generate variations based on your references.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2 text-white">Character Generation & Custom Wardrobe</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          In the Character Bank, generate positions and pose variations, or upload your own wardrobe references for tighter creative control.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2 text-white">Location Angle Packages & Backgrounds</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          For locations, generate angle packages from your references with reusable background variations for different scene needs.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2 text-white">Props from Multiple Angles</h4>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          Transform initial prop references into multiple angles so they can be reused across scenes and shot setups.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3">
                      <span className="text-[#DC143C] mt-0.5">•</span>
                      <div>
                        <p className="font-medium text-white">Character variations</p>
                        <p className="text-sm text-gray-400">Generate characters in different positions, outfits, and styles while maintaining continuity</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[#DC143C] mt-0.5">•</span>
                      <div>
                        <p className="font-medium text-white">Location angle packages</p>
                        <p className="text-sm text-gray-400">Create angle packages and backgrounds from uploaded location references for scene planning</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[#DC143C] mt-0.5">•</span>
                      <div>
                        <p className="font-medium text-white">Props from multiple angles</p>
                        <p className="text-sm text-gray-400">Generate reusable prop views from multiple angles, ready for different camera setups</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[#DC143C] mt-0.5">•</span>
                      <div>
                        <p className="font-medium text-white">Export anywhere</p>
                        <p className="text-sm text-gray-400">All assets are downloadable and can be used in Scene Builder or your preferred downstream tools</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connecting Line */}
              <div className="hidden md:flex justify-center -my-8">
                <div className="w-px h-12 bg-gradient-to-b from-purple-500 to-pink-600"></div>
              </div>

              {/* Step 3: DIRECT */}
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-pink-500 to-orange-600 flex items-center justify-center shadow-lg text-white text-2xl font-bold">
                    3
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
                      Direct
                    </h2>
                    <span className="text-xs font-semibold bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full border border-yellow-500/30">
                      Beta
                    </span>
                    <span className="text-sm font-semibold text-gray-400 bg-[#141414] px-3 py-1 rounded-full">
                      Step 3
                    </span>
                  </div>
                  <p className="text-lg text-gray-300 leading-relaxed">
                    Extend approved writing and references into visual planning workflows. Scene Builder helps stage scene intent into coherent shot progressions.
                  </p>
                  <div className="space-y-3 pt-2">
                    <div className="flex items-start gap-3">
                      <span className="text-[#DC143C] mt-0.5">•</span>
                      <div>
                        <p className="font-medium text-white">Scene Builder</p>
                        <p className="text-sm text-gray-400">Assemble shot progressions from your scene context and approved references</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[#DC143C] mt-0.5">•</span>
                      <div>
                        <p className="font-medium text-white">Algorithmic composition</p>
                        <p className="text-sm text-gray-400">Compose scenes from Production Hub assets to speed planning and previsualization</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[#DC143C] mt-0.5">•</span>
                      <div>
                        <p className="font-medium text-white">Your assets, your choice</p>
                        <p className="text-sm text-gray-400">Use Scene Builder or export assets into any workflow you prefer</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-[#141414]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              If this workflow feels right, build with us.
            </h2>
            <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto mb-8">
              Join early access and help shape a better way to keep writing, ideas, and visuals connected.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors text-base md:text-lg min-h-[44px] w-full sm:w-auto"
              >
                Become a Founding Supporter
              </Link>
              <Link
                href="/examples"
                className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 bg-[#141414] border border-[#3F3F46] text-white font-semibold rounded-lg hover:bg-[#1F1F1F] transition-colors text-base md:text-lg min-h-[44px] w-full sm:w-auto"
              >
                View Examples
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
