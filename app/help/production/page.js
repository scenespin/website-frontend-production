import Link from "next/link";
import Image from "next/image";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";
import logo from "@/app/icon.png";

export const metadata = getSEOTags({
  title: `Production Help | ${config.appName}`,
  description: "Learn how to generate images and video with Scene Builder and maintain character/location/prop consistency with Wryda.ai.",
  canonicalUrlRelative: "/help/production",
});

export default function ProductionHelp() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <header className="p-4 flex justify-between items-center max-w-7xl mx-auto bg-[#0A0A0A] border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={logo}
            alt={`${config.appName} logo`}
            width={40}
            height={40}
            className="w-10 h-10"
            priority={true}
          />
          <span className="text-2xl font-extrabold text-[#FFFFFF]">
            {config.appName}<span className="text-[#DC143C]">.ai</span>
          </span>
        </Link>
        <Link href="/help" className="btn btn-ghost text-[#B3B3B3] hover:text-[#FFFFFF] border-white/10">← Back to Help</Link>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-16 bg-[#0A0A0A] text-[#FFFFFF]">
        <h1 className="text-4xl font-extrabold mb-4 text-[#FFFFFF]">Production</h1>
        <p className="text-xl opacity-80 mb-12 text-[#B3B3B3]">
          When you are ready, turn screenplay context into images and video. Model, resolution, aspect ratio, duration, and credits are shown in the app before generation.
        </p>
        <p className="text-sm text-[#808080] mb-8">
          Need submission records? Use the Wryda Provenance Ledger to lock and export a timestamped, noneditable provenance bundle (PDF + JSON + SHA-256 hash) for WGA and studio policy workflows.
        </p>

        {/* Image & Video Generation */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#FFFFFF]">Image and Video Generation</h2>
          <p className="mb-6 text-[#B3B3B3]">
            Wryda offers image and video generation with transparent model options. In the app you can review each model&apos;s available controls before generating.
          </p>

          <div className="card bg-[#141414] border border-white/10 mb-6">
            <div className="card-body">
              <h3 className="font-bold mb-4 text-[#DC143C]">What You Can Configure</h3>
              <p className="text-sm text-[#B3B3B3] mb-4">
                Each model in the Video Generation area shows its own options (e.g. resolution, aspect ratio, duration). Character assignment, outfit selection, and dialogue choices are available where the workflow supports them. Credits are shown before generation.
              </p>
              <div className="alert alert-info bg-[#0A0A0A] border border-[#00D9FF]/30">
                <div className="text-sm text-[#B3B3B3]">
                  <strong className="text-[#00D9FF]">Transparency:</strong> Model names, resolutions, and pricing are displayed up front. Use the options shown for your selected model before generation.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Scene Builder */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#FFFFFF]">Scene Builder</h2>
          <p className="mb-6 text-[#B3B3B3]">
            Generate complete scenes directly from your screenplay using structured shot configuration, character assignment, and continuity-aware setup.
          </p>
          
          <div className="card bg-[#141414] border border-white/10 mb-6">
            <div className="card-body">
              <h3 className="font-bold mb-4 text-[#DC143C]">How Scene Builder Works</h3>
              <ol className="space-y-3 list-decimal list-inside text-[#B3B3B3]">
                <li><strong className="text-[#FFFFFF]">Select a Scene</strong> - Choose a scene from your screenplay</li>
                <li><strong className="text-[#FFFFFF]">Scene Analysis</strong> - AI analyzes the scene structure, dialogue, and action</li>
                <li><strong className="text-[#FFFFFF]">Shot Configuration</strong> - Choose model, resolution, aspect ratio, and duration (options shown per model)</li>
                <li><strong className="text-[#FFFFFF]">Character Assignment</strong> - Assign characters to shots with outfit selection</li>
                <li><strong className="text-[#FFFFFF]">Video Generation</strong> - AI generates video clips for each shot</li>
                <li><strong className="text-[#FFFFFF]">Automatic Consistency</strong> - Character, location, and prop consistency maintained automatically</li>
                <li><strong className="text-[#FFFFFF]">Review & Export</strong> - Review generated videos and export your complete scene</li>
              </ol>
            </div>
          </div>

          <div className="card bg-[#141414] border border-white/10">
            <div className="card-body">
              <h3 className="font-bold mb-4 text-[#DC143C]">Scene Builder Options</h3>
              <p className="text-sm text-[#B3B3B3] mb-4">
                Model, resolution, aspect ratio, and duration are shown per model in the app. You can configure character assignment, outfit selection per shot, optional image prompts, and dialogue where supported.
              </p>
            </div>
          </div>
        </section>

        {/* Consistency Systems */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#FFFFFF]">Coverage Packages</h2>
          <p className="mb-6 text-[#B3B3B3]">
            Produce organizes visual coverage by screenplay entities so character, location, and prop assets remain reusable across planning and execution workflows.
          </p>

          <div className="space-y-6">
            <ConsistencyCard
              icon="C"
              title="Character Pose Coverage"
              description="Build reusable character visual sets with identity continuity"
              features={[
                "Face consistency across all scenes",
                "Voice consistency with premade or cloned voices",
                "Outfit consistency with virtual try-ons",
                "One headshot → unlimited scenes"
              ]}
            />

            <ConsistencyCard
              icon="L"
              title="Location Angle Coverage"
              description="Expand one location into angle and background coverage"
              features={[
                "Multiple camera angles per location",
                "Background consistency across scenes",
                "Reuse locations across unlimited scenes",
                "Upload once, use everywhere"
              ]}
            />

            <ConsistencyCard
              icon="P"
              title="Prop Angle Coverage"
              description="Maintain prop continuity for story-critical objects"
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
                  <strong className="text-[#FFFFFF]">Write Your Screenplay</strong> - Create your script in the Create (Write) section
                </li>
                <li>
                  <strong className="text-[#FFFFFF]">Set Up Coverage</strong> - Upload or generate character, location, and prop assets
                </li>
                <li>
                  <strong className="text-[#FFFFFF]">Use Scene Builder</strong> - Select a scene from your screenplay and configure generation settings
                </li>
                <li>
                  <strong className="text-[#FFFFFF]">Configure Shots</strong> - Select model, resolution, aspect ratio, and assign characters
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
          <Link href="/help/direct" className="btn bg-[#DC143C] hover:bg-[#8B0000] text-[#FFFFFF] border-none">Next: Direct →</Link>
        </div>
        <p className="text-xs text-[#808080] mt-6">
          * Availability depends on selected model/provider. Some controls are shown only where supported by selected workflow/model.
        </p>
      </main>
    </div>
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
