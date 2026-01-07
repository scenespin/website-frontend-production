import Link from "next/link";
import Image from "next/image";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";
import logo from "@/app/icon.png";

export const metadata = getSEOTags({
  title: `Direct & Storyboard | ${config.appName} Help`,
  description: "Learn how to review, organize, and control your production with Wryda.ai's Direct hub featuring Scene Builder and Storyboard views.",
  canonicalUrlRelative: "/help/direct",
});

export default function DirectHelp() {
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
        <h1 className="text-4xl font-extrabold mb-4 text-[#FFFFFF]">🎞️ Direct</h1>
        <p className="text-xl opacity-80 mb-12 text-[#B3B3B3]">
          Review, organize, and control your production. Use Scene Builder to generate scenes and Storyboard to view all your generated videos.
        </p>

        {/* Direct Hub Overview */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#FFFFFF]">Direct Hub</h2>
          <p className="mb-6 text-[#B3B3B3]">
            The Direct hub is your command center for production. It features two main views: Scene Builder for generating scenes 
            and Storyboard for reviewing and organizing all your generated content.
          </p>
          
          <div className="card bg-[#141414] border border-white/10 mb-6">
            <div className="card-body">
              <h3 className="font-bold mb-4 text-[#DC143C]">Two Main Views:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded border border-[#DC143C]/30 bg-[#0A0A0A]">
                  <h4 className="font-semibold mb-3 text-[#DC143C] flex items-center gap-2">
                    🎬 Scene Builder
                  </h4>
                  <p className="text-sm text-[#B3B3B3] mb-3">
                    Generate complete scenes directly from your screenplay. Configure shots, assign characters, and generate videos with automatic consistency.
                  </p>
                  <ul className="space-y-1 text-sm text-[#B3B3B3]">
                    <li>• Select scenes from your screenplay</li>
                    <li>• Configure quality, resolution, aspect ratio</li>
                    <li>• Assign characters with outfit selection</li>
                    <li>• Generate complete scene packages</li>
                  </ul>
                </div>
                <div className="p-4 rounded border border-[#00D9FF]/30 bg-[#0A0A0A]">
                  <h4 className="font-semibold mb-3 text-[#00D9FF] flex items-center gap-2">
                    📋 Storyboard
                  </h4>
                  <p className="text-sm text-[#B3B3B3] mb-3">
                    Visual storyboard view of all your generated scenes. See full stitched scenes, individual shots, and organize your production.
                  </p>
                  <ul className="space-y-1 text-sm text-[#B3B3B3]">
                    <li>• View all generated scenes</li>
                    <li>• See individual shots per scene</li>
                    <li>• Review first frame thumbnails</li>
                    <li>• Organize by scene number</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Scene Builder */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#FFFFFF]">Scene Builder</h2>
          <p className="mb-6 text-[#B3B3B3]">
            Generate complete scenes with multiple shots, maintaining perfect consistency across characters, locations, and props.
          </p>
          
          <div className="card bg-[#141414] border border-white/10 mb-6">
            <div className="card-body">
              <h3 className="font-bold mb-4 text-[#DC143C]">How to Use Scene Builder:</h3>
              <ol className="space-y-3 list-decimal list-inside text-[#B3B3B3]">
                <li><strong className="text-[#FFFFFF]">Select a Scene</strong> - Choose a scene from your screenplay</li>
                <li><strong className="text-[#FFFFFF]">Scene Analysis</strong> - AI analyzes the scene structure, dialogue, and action</li>
                <li><strong className="text-[#FFFFFF]">Configure Shots</strong> - Set quality tier, resolution, aspect ratio, and duration</li>
                <li><strong className="text-[#FFFFFF]">Assign Characters</strong> - Assign characters to shots with outfit selection</li>
                <li><strong className="text-[#FFFFFF]">Generate</strong> - AI generates video clips for each shot with automatic consistency</li>
                <li><strong className="text-[#FFFFFF]">Review</strong> - Review generated videos in the Storyboard view</li>
              </ol>
            </div>
          </div>

          <div className="card bg-[#141414] border border-white/10">
            <div className="card-body">
              <h3 className="font-bold mb-4 text-[#DC143C]">Scene Builder Features:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2 text-[#FFFFFF]">Generation Options</h4>
                  <ul className="space-y-1 text-sm text-[#B3B3B3]">
                    <li>• Quality tiers: Professional (~50 credits/5s) or Premium (~75 credits/5s)</li>
                    <li>• Resolution: 1080p or 4K</li>
                    <li>• Aspect ratios: 16:9, 9:16, 1:1</li>
                    <li>• Duration: 5s or 10s per clip</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-[#FFFFFF]">Character & Consistency</h4>
                  <ul className="space-y-1 text-sm text-[#B3B3B3]">
                    <li>• Character assignment per shot</li>
                    <li>• Outfit selection per shot</li>
                    <li>• Automatic consistency across shots</li>
                    <li>• Dialogue selection per shot</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Storyboard */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4 text-[#FFFFFF]">Storyboard View</h2>
          <p className="mb-6 text-[#B3B3B3]">
            Visual storyboard interface showing all your generated scenes organized by scene number.
          </p>
          
          <div className="card bg-[#141414] border border-white/10">
            <div className="card-body">
              <h3 className="font-bold mb-4 text-[#DC143C]">Storyboard Features:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2 text-[#FFFFFF]">Scene Organization</h4>
                  <ul className="space-y-1 text-sm text-[#B3B3B3]">
                    <li>• View all scenes by scene number</li>
                    <li>• See full stitched scenes (combined videos)</li>
                    <li>• View individual shots per scene</li>
                    <li>• First frame thumbnails for quick preview</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-[#FFFFFF]">Review & Control</h4>
                  <ul className="space-y-1 text-sm text-[#B3B3B3]">
                    <li>• Review generated videos</li>
                    <li>• See generation metadata</li>
                    <li>• Organize your production</li>
                    <li>• Access all media in Media Library</li>
                  </ul>
                </div>
              </div>
            </div>
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
                  <strong className="text-[#FFFFFF]">Generate Videos</strong> - Use Production to generate videos with Scene Builder
                </li>
                <li>
                  <strong className="text-[#FFFFFF]">Review in Direct</strong> - Go to Direct hub to review generated scenes in Storyboard view
                </li>
                <li>
                  <strong className="text-[#FFFFFF]">Control Your Production</strong> - Organize scenes, review shots, and manage your production
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <div className="flex gap-4 justify-between mt-12">
          <Link href="/help/production" className="btn btn-ghost text-[#B3B3B3] hover:text-[#FFFFFF] border-white/10">← Production</Link>
          <Link href="/help/faq" className="btn bg-[#DC143C] hover:bg-[#8B0000] text-[#FFFFFF] border-none">FAQ →</Link>
        </div>
      </main>
    </div>
  );
}

