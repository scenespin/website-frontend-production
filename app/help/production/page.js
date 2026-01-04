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

      <main className="max-w-4xl mx-auto px-8 py-16">
        <h1 className="text-4xl font-extrabold mb-4">🎬 Production</h1>
        <p className="text-xl opacity-80 mb-12">
          Generate professional videos with Scene Builder and maintain consistency across your entire production.
        </p>

        {/* Video Generation */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4">AI Video Generation</h2>
          <p className="mb-4">
            Wryda.ai gives you access to <strong>3 leading AI video providers</strong> in one platform. 
            Choose the right model for your needs based on quality, speed, and cost.
          </p>

          <div className="space-y-4 mb-6">
            <ProviderCard
              name="Google Veo 3.1"
              cost="100 credits"
              quality="Premium cinematic 1080p"
              speed="45-60 seconds"
              features={[
                "Text-to-video generation",
                "1080p resolution",
                "16:9, 9:16 aspect ratios",
                "Fast mode available (50% faster)",
                "Scene continuity support"
              ]}
              bestFor="High-quality cinematic shots, professional pre-visualization"
            />

            <ProviderCard
              name="Luma Dream Machine"
              cost="Ray Flash: 25 credits, Ray 2: 75 credits"
              quality="Fast to Premium"
              speed="60-90 seconds"
              features={[
                "Text-to-video",
                "Image-to-video (start/end frames)",
                "Video extension/chaining",
                "Multiple aspect ratios",
                "Loop option"
              ]}
              bestFor="Rapid prototyping (Ray Flash), premium quality (Ray 2)"
            />

            <ProviderCard
              name="Runway Gen-3"
              cost="Gen-3 Turbo: 100 credits, Gen-3 Alpha: 120 credits"
              quality="Hollywood-grade 4K capable"
              speed="Fast to Premium"
              features={[
                "Text-to-video",
                "Image-to-video",
                "Video-to-video transformations",
                "4K upscaling (2x, 4x, 8x)",
                "Character animation",
                "5s or 10s clips"
              ]}
              bestFor="Ultra-high quality final production footage, character animation"
            />
          </div>
        </section>

        {/* Scene Builder */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4">Scene Builder (Motion Picture Technology)</h2>
          <p className="mb-4">
            <strong className="badge badge-primary">UNIQUE FEATURE</strong> - Generate complete scenes directly from your screenplay. 
            Not available in any other platform.
          </p>
          
          <div className="card bg-base-200">
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
          <div className="card bg-base-200">
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

function ProviderCard({ name, cost, quality, speed, features, bestFor }) {
  return (
    <div className="card bg-base-200 border-2 border-secondary/30">
      <div className="card-body">
        <h3 className="card-title text-xl mb-2">{name}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3 text-sm">
          <div><strong>Cost:</strong> {cost}</div>
          <div><strong>Quality:</strong> {quality}</div>
          <div><strong>Speed:</strong> {speed}</div>
        </div>
        <ul className="space-y-1 mb-3">
          {features.map((feature, idx) => (
            <li key={idx} className="text-sm flex items-start gap-2">
              <span className="text-secondary">•</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm opacity-70"><strong>Best for:</strong> {bestFor}</p>
      </div>
    </div>
  );
}

function ConsistencyCard({ icon, title, description, features }) {
  return (
    <div className="card bg-base-200 border-2 border-primary/30">
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
