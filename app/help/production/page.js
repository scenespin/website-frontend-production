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
      <header className="p-4 flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-extrabold">
            {config.appName}<span className="text-[#DC143C]">.ai</span>
          </span>
        </Link>
        <Link href="/help" className="btn btn-ghost">← Back to Help</Link>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-16 bg-[#0A0A0A] text-[#FFFFFF]">
        <h1 className="text-4xl font-extrabold mb-4">🎬 Production</h1>
        <p className="text-xl opacity-80 mb-12">
          Generate professional videos with Scene Builder and maintain consistency across your entire production.
        </p>

        {/* Video Generation */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4">AI Video Generation</h2>
          <p className="mb-4">
            Wryda.ai provides powerful AI video generation capabilities with multiple quality tiers and options. 
            Choose the right option for your needs based on quality, speed, and cost.
          </p>

          <div className="card bg-[#141414] border border-white/10 mb-6">
            <div className="card-body">
              <h3 className="font-bold mb-3">Available Options:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2 text-[#DC143C]">Fast Generation</h4>
                  <ul className="space-y-1 text-sm text-[#B3B3B3]">
                    <li>• 25-50 credits per video</li>
                    <li>• Quick turnaround (30-60 seconds)</li>
                    <li>• Perfect for prototyping</li>
                    <li>• Multiple aspect ratios</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-[#DC143C]">Premium Generation</h4>
                  <ul className="space-y-1 text-sm text-[#B3B3B3]">
                    <li>• 75-120 credits per video</li>
                    <li>• High-quality cinematic output</li>
                    <li>• 1080p resolution</li>
                    <li>• Professional pre-visualization</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-[#DC143C]">Ultra Premium</h4>
                  <ul className="space-y-1 text-sm text-[#B3B3B3]">
                    <li>• 100-120 credits per video</li>
                    <li>• Hollywood-grade quality</li>
                    <li>• 4K capable</li>
                    <li>• Character animation support</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-[#DC143C]">Text & Image Input</h4>
                  <ul className="space-y-1 text-sm text-[#B3B3B3]">
                    <li>• Text-to-video generation</li>
                    <li>• Image-to-video conversion</li>
                    <li>• Video extension/chaining</li>
                    <li>• Multiple aspect ratios (16:9, 9:16, 1:1)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Scene Builder */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4">Scene Builder (Motion Picture Technology)</h2>
          <p className="mb-4">
            <strong className="badge badge-primary">UNIQUE FEATURE</strong> - Generate complete scenes directly from your screenplay. 
            Not available in any other platform.
          </p>
          
          <div className="card bg-[#141414] border border-white/10">
            <div className="card-body">
              <h3 className="font-bold mb-2">How It Works:</h3>
              <ol className="space-y-2 list-decimal list-inside">
                <li>Select a scene from your screenplay</li>
                <li>Scene Builder analyzes the scene structure</li>
                <li>AI generates video clips for each shot</li>
                <li>Maintains character, location, and prop consistency automatically</li>
                <li>Export your complete scene</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Consistency Systems */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4">Professional Production Consistency</h2>
          <p className="mb-6">
            <strong className="badge badge-primary">UNIQUE FEATURES</strong> - The only platform that maintains consistency 
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
          <h2 className="text-3xl font-bold mb-4">Getting Started</h2>
          <div className="card bg-[#141414] border border-white/10">
            <div className="card-body">
              <ol className="space-y-4 list-decimal list-inside">
                <li>
                  <strong>Write Your Screenplay</strong> - Create your script in the Write section
                </li>
                <li>
                  <strong>Set Up Consistency</strong> - Upload character images, locations, and props to the banks
                </li>
                <li>
                  <strong>Use Scene Builder</strong> - Select a scene from your screenplay and let Scene Builder generate it
                </li>
                <li>
                  <strong>Maintain Consistency</strong> - Character, location, and prop consistency is handled automatically
                </li>
                <li>
                  <strong>Review & Direct</strong> - Review your generated videos and direct your production
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <div className="flex gap-4 justify-between mt-12">
          <Link href="/help/writing" className="btn btn-ghost">← Writing</Link>
          <Link href="/help/faq" className="btn btn-primary">FAQ →</Link>
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
            <h3 className="card-title text-xl">{title}</h3>
            <p className="text-sm opacity-70">{description}</p>
          </div>
        </div>
        <ul className="space-y-1">
          {features.map((feature, idx) => (
            <li key={idx} className="text-sm flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
