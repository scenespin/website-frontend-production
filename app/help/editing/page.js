import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Editing Help | ${config.appName}`,
  description: "Learn how to use Wryda.ai's composition studio and timeline editor to create professional videos.",
  canonicalUrlRelative: "/help/editing",
});

export default function EditingHelp() {
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
        <h1 className="text-4xl font-extrabold mb-4">🎨 Editing</h1>
        <p className="text-xl opacity-80 mb-12">
          Arrange your clips with 12+ composition layouts, then polish with the professional timeline editor.
        </p>

        {/* Composition Studio */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4">Composition Studio</h2>
          <p className="mb-4">
            Create professional multi-clip compositions with <strong>12+ pre-built layouts</strong>. 
            Perfect for split-screens, grids, picture-in-picture, and more.
          </p>

          <div className="card bg-base-200 mb-6">
            <div className="card-body">
              <h3 className="font-bold mb-3">Layout Types:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Split-Screen (2-way)</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Side-by-side layouts</li>
                    <li>• Top-bottom layouts</li>
                    <li>• 60/40, 70/30, 80/20 ratios</li>
                    <li><strong>Cost:</strong> 10 credits</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Triple View (3-way)</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Three equal panels</li>
                    <li>• One large + two small</li>
                    <li>• Horizontal or vertical</li>
                    <li><strong>Cost:</strong> 15 credits</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Quad Grid (4-way)</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Four equal panels</li>
                    <li>• Picture-in-picture variations</li>
                    <li>• Custom positioning</li>
                    <li><strong>Cost:</strong> 20 credits</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Animated Compositions</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Transitions between panels</li>
                    <li>• Zoom effects</li>
                    <li>• Keyframe animations</li>
                    <li><strong>Cost:</strong> 30 credits</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-primary/10 border-2 border-primary/30">
            <div className="card-body">
              <h3 className="font-bold mb-2">Paced Sequences</h3>
              <p className="text-sm mb-2">
                Beat-synced cuts and emotional montages. Perfect for music videos and dynamic storytelling.
              </p>
              <p className="text-sm"><strong>Cost:</strong> 15 credits</p>
            </div>
          </div>
        </section>

        {/* Timeline Editor */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4">Timeline Editor</h2>
          <p className="mb-4">
            Professional <strong>8-track video editor</strong> with full audio mixing capabilities. 
            Export in multiple formats for any platform.
          </p>

          <div className="card bg-base-200 mb-6">
            <div className="card-body">
              <h3 className="font-bold mb-3">Features:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Video Tracks</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• 8 video tracks</li>
                    <li>• Drag-and-drop editing</li>
                    <li>• Keyframe animations</li>
                    <li>• Transitions library</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Audio Tracks</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• 8 audio tracks</li>
                    <li>• Multi-track mixing</li>
                    <li>• Audio waveform visualization</li>
                    <li>• Volume and fade controls</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="font-bold mb-3">Export Formats:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Standard Formats:</h4>
                  <ul className="space-y-1">
                    <li>• <strong>16:9</strong> - YouTube, web, traditional media</li>
                    <li>• <strong>9:16</strong> - TikTok, Reels, Stories</li>
                    <li>• <strong>1:1</strong> - Instagram Feed, Twitter</li>
                    <li>• <strong>4:3</strong> - Classic/Nostalgia aesthetic</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Premium Formats:</h4>
                  <ul className="space-y-1">
                    <li>• <strong>21:9</strong> - Cinema widescreen (Premium)</li>
                    <li>• <strong>Social Bundle</strong> - 16:9 + 9:16 + 1:1 (Save 20%)</li>
                    <li>• <strong>Filmmaker Bundle</strong> - 16:9 + 21:9</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4">Editing Workflow</h2>
          <div className="card bg-base-200">
            <div className="card-body">
              <ol className="space-y-4 list-decimal list-inside">
                <li>
                  <strong>Generate Your Clips</strong> - Create videos in the Production section
                </li>
                <li>
                  <strong>Compose Your Layout</strong> - Arrange clips in Composition Studio with your chosen layout
                </li>
                <li>
                  <strong>Add to Timeline</strong> - Import your composition to the timeline editor
                </li>
                <li>
                  <strong>Add Audio</strong> - Import music, dialogue, or sound effects to audio tracks
                </li>
                <li>
                  <strong>Fine-Tune</strong> - Adjust timing, add transitions, polish your edit
                </li>
                <li>
                  <strong>Export</strong> - Choose your format and export your final video
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <div className="flex gap-4 justify-between mt-12">
          <Link href="/help/production" className="btn btn-ghost">← Production</Link>
          <Link href="/help/faq" className="btn btn-primary">Next: FAQ →</Link>
        </div>
      </main>
    </>
  );
}

