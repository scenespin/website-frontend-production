import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Production Help | ${config.appName}`,
  description: "Learn how to generate videos with Scene Builder and maintain character/location/prop consistency with Wryda.ai.",
  canonicalUrlRelative: "/help/production",
});

export default function ProductionHelp() {
  return (
    <>
      <header className="p-4 flex justify-between items-center max-w-7xl mx-auto bg-[#0A0A0A] border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-extrabold text-[#FFFFFF]">
            {config.appName}<span className="text-[#DC143C]">.ai</span>
          </span>
        </Link>
        <Link href="/help" className="btn btn-ghost text-[#B3B3B3] hover:text-[#FFFFFF] border-white/10">← Back to Help</Link>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-16 bg-[#0A0A0A] text-[#FFFFFF]">
        <h1 className="text-4xl font-extrabold mb-4 text-[#FFFFFF]">🎬 Production</h1>
        <p className="text-xl opacity-80 mb-12 text-[#B3B3B3]">
          Generate professional videos with Scene Builder and maintain consistency across your entire production.
        </p>

        {/* Video Generation */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#FFFFFF]">AI Video Generation</h2>
          <p className="mb-6 text-[#B3B3B3]">
            Wryda.ai provides powerful AI video generation with professional quality tiers and comprehensive customization options. 
            Choose the right settings for your production needs.
          </p>

          <div className="card bg-[#141414] border border-white/10 mb-6">
            <div className="card-body">
              <h3 className="font-bold mb-4 text-[#DC143C]">Quality Tiers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded border border-[#DC143C]/30 bg-[#0A0A0A]">
                  <h4 className="font-semibold mb-2 text-[#DC143C] flex items-center gap-2">
                    👑 Professional (1080p)
                    <span className="badge bg-[#DC143C] text-[#FFFFFF] border-none badge-sm">Recommended</span>
                  </h4>
                  <ul className="space-y-1 text-sm text-[#B3B3B3]">
                    <li>• 50 credits per 5-second video</li>
                    <li>• 100 credits per 10-second video</li>
                    <li>• High-quality 1080p resolution</li>
                    <li>• Fast generation time</li>
                    <li>• Perfect for most productions</li>
                  </ul>
                </div>
                <div className="p-4 rounded border border-[#00D9FF]/30 bg-[#0A0A0A]">
                  <h4 className="font-semibold mb-2 text-[#00D9FF] flex items-center gap-2">
                    ✨ Premium (4K)
                    <span className="badge bg-[#00D9FF] text-[#0A0A0A] border-none badge-sm">Best Quality</span>
                  </h4>
                  <ul className="space-y-1 text-sm text-[#B3B3B3]">
                    <li>• 75 credits per 5-second video</li>
                    <li>• 150 credits per 10-second video</li>
                    <li>• Ultra-high quality 4K resolution</li>
                    <li>• Professional cinematic output</li>
                    <li>• Ideal for final production</li>
                  </ul>
                </div>
              </div>

              <h3 className="font-bold mb-4 text-[#DC143C]">Generation Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2 text-[#FFFFFF]">Resolution</h4>
                  <ul className="space-y-1 text-sm text-[#B3B3B3]">
                    <li>• 1080p (Professional tier)</li>
                    <li>• 4K (Premium tier)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-[#FFFFFF]">Aspect Ratios</h4>
                  <ul className="space-y-1 text-sm text-[#B3B3B3]">
                    <li>• 16:9 (Horizontal/Cinema)</li>
                    <li>• 9:16 (Vertical/TikTok)</li>
                    <li>• 1:1 (Square/Instagram)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-[#FFFFFF]">Duration</h4>
                  <ul className="space-y-1 text-sm text-[#B3B3B3]">
                    <li>• 5 seconds (standard)</li>
                    <li>• 10 seconds (extended)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-[#FFFFFF]">Quality Settings</h4>
                  <ul className="space-y-1 text-sm text-[#B3B3B3]">
                    <li>• Low, Medium, High, Ultra</li>
                    <li>• Image prompts (optional)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Scene Builder */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#FFFFFF]">Scene Builder (Motion Picture Technology)</h2>
          <p className="mb-6 text-[#B3B3B3]">
            <strong className="badge bg-[#DC143C] text-[#FFFFFF] border-none">UNIQUE FEATURE</strong> - Generate complete scenes directly from your screenplay. 
            Not available in any other platform.
          </p>
          
          <div className="card bg-[#141414] border border-white/10 mb-6">
            <div className="card-body">
              <h3 className="font-bold mb-4 text-[#DC143C]">How Scene Builder Works:</h3>
              <ol className="space-y-3 list-decimal list-inside text-[#B3B3B3]">
                <li><strong className="text-[#FFFFFF]">Select a Scene</strong> - Choose a scene from your screenplay</li>
                <li><strong className="text-[#FFFFFF]">Scene Analysis</strong> - AI analyzes the scene structure, dialogue, and action</li>
                <li><strong className="text-[#FFFFFF]">Shot Configuration</strong> - Configure quality tier, resolution, aspect ratio, and duration</li>
                <li><strong className="text-[#FFFFFF]">Character Assignment</strong> - Assign characters to shots with outfit selection</li>
                <li><strong className="text-[#FFFFFF]">Video Generation</strong> - AI generates video clips for each shot</li>
                <li><strong className="text-[#FFFFFF]">Automatic Consistency</strong> - Character, location, and prop consistency maintained automatically</li>
                <li><strong className="text-[#FFFFFF]">Review & Export</strong> - Review generated videos and export your complete scene</li>
              </ol>
            </div>
          </div>

          <div className="card bg-[#141414] border border-white/10">
            <div className="card-body">
              <h3 className="font-bold mb-4 text-[#DC143C]">Scene Builder Options:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2 text-[#FFFFFF]">Quality Tier Selection</h4>
                  <ul className="space-y-1 text-sm text-[#B3B3B3]">
                    <li>• Professional (1080p) - 50 credits per 5s</li>
                    <li>• Premium (4K) - 75 credits per 5s</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-[#FFFFFF]">Resolution & Aspect Ratio</h4>
                  <ul className="space-y-1 text-sm text-[#B3B3B3]">
                    <li>• Resolution: 1080p or 4K</li>
                    <li>• Aspect Ratios: 16:9, 9:16, 1:1</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-[#FFFFFF]">Duration & Quality</h4>
                  <ul className="space-y-1 text-sm text-[#B3B3B3]">
                    <li>• Duration: 5s or 10s per clip</li>
                    <li>• Quality: Low, Medium, High, Ultra</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-[#FFFFFF]">Advanced Options</h4>
                  <ul className="space-y-1 text-sm text-[#B3B3B3]">
                    <li>• Image prompts (optional reference images)</li>
                    <li>• Character outfit selection per shot</li>
                    <li>• Dialogue workflow selection</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Consistency Systems */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#FFFFFF]">Professional Production Consistency</h2>
          <p className="mb-6 text-[#B3B3B3]">
            <strong className="badge bg-[#DC143C] text-[#FFFFFF] border-none">UNIQUE FEATURES</strong> - The only platform that maintains consistency 
            across character, location, and prop throughout your entire production.
          </p>

          <div className="space-y-6">
            <ConsistencyCard
              icon="👤"
              title="Character Consistency"
              description="Same character, same voice, same outfit across every scene"
              features={[
                "Face consistency across all scenes",
                "Voice consistency with premade or cloned voices",
                "Outfit consistency with virtual try-ons",
                "One headshot → unlimited scenes"
              ]}
            />

            <ConsistencyCard
              icon="📍"
              title="Location Consistency"
              description="Same location, multiple angles. Background consistency across shots"
              features={[
                "Multiple camera angles per location",
                "Background consistency across scenes",
                "Reuse locations across unlimited scenes",
                "Upload once, use everywhere"
              ]}
            />

            <ConsistencyCard
              icon="🎬"
              title="Prop Consistency"
              description="Same prop, multiple angles. Consistent appearance across scenes"
              features={[
                "Multiple angles per prop",
                "Consistent appearance across scenes",
                "Reuse props across unlimited scenes",
                "Digital asset library"
              ]}
            />
          </div>
        </section>

        {/* Getting Started */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#FFFFFF]">Getting Started</h2>
          <div className="card bg-[#141414] border border-white/10">
            <div className="card-body">
              <ol className="space-y-4 list-decimal list-inside text-[#B3B3B3]">
                <li>
                  <strong className="text-[#FFFFFF]">Write Your Screenplay</strong> - Create your script in the Write section
                </li>
                <li>
                  <strong className="text-[#FFFFFF]">Set Up Consistency</strong> - Upload character images, locations, and props to the banks
                </li>
                <li>
                  <strong className="text-[#FFFFFF]">Use Scene Builder</strong> - Select a scene from your screenplay and configure generation settings
                </li>
                <li>
                  <strong className="text-[#FFFFFF]">Configure Shots</strong> - Select quality tier, resolution, aspect ratio, and assign characters
                </li>
                <li>
                  <strong className="text-[#FFFFFF]">Generate & Review</strong> - AI generates videos with automatic consistency, then review and export
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <div className="flex gap-4 justify-between mt-12">
          <Link href="/help/writing" className="btn btn-ghost text-[#B3B3B3] hover:text-[#FFFFFF] border-white/10">← Writing</Link>
          <Link href="/help/faq" className="btn bg-[#DC143C] hover:bg-[#8B0000] text-[#FFFFFF] border-none">FAQ →</Link>
        </div>
      </main>
    </>
  );
}


function ConsistencyCard({ icon, title, description, features }) {
  return (
            <div className="card bg-[#141414] border border-[#DC143C]/30">
      <div className="card-body">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <h3 className="card-title text-xl text-[#FFFFFF]">{title}</h3>
            <p className="text-sm opacity-70 text-[#B3B3B3]">{description}</p>
          </div>
        </div>
        <ul className="space-y-1">
          {features.map((feature, idx) => (
            <li key={idx} className="text-sm flex items-start gap-2">
              <span className="text-[#DC143C]">•</span>
              <span className="text-[#B3B3B3]">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
