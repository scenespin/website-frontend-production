import { getSEOTags } from "@/libs/seo";
import config from "@/config";
import { Film, Clapperboard, Music, Palette } from "lucide-react";

export const metadata = getSEOTags({
  title: `Direct - Coming Soon | ${config.appName}`,
  description: "Direct hub features are coming soon. Scene Builder, Storyboard, Style Profiles, and Soundscape will be available shortly.",
  canonicalUrlRelative: "/coming-soon",
});

export default function ComingSoonPage() {
  const features = [
    {
      name: "Scene Builder",
      icon: Clapperboard,
      description: "Script-based scene generation with AI-powered video creation",
    },
    {
      name: "Storyboard",
      icon: Film,
      description: "Stitched scene videos and interactive storyboard views",
    },
    {
      name: "Style Profiles",
      icon: Palette,
      description: "Analyze video styles for consistent generation across scenes",
    },
    {
      name: "Soundscape",
      icon: Music,
      description: "AI-generated sound effects and music for your videos",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#141414] border border-[#DC143C]/30 mb-6">
            <Film className="w-10 h-10 text-[#DC143C]" />
          </div>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black border border-[#DC143C]/30 text-sm mb-6">
            <span className="font-semibold text-gray-300">🚧 Coming Soon</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            Direct Hub
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            We're putting the finishing touches on our Direct features. 
            <br />
            <span className="text-gray-400 text-lg mt-2 block">
              Scene Builder, Storyboard, Style Profiles, and Soundscape will be available shortly.
            </span>
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.name}
                className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6 hover:border-[#DC143C]/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#0A0A0A] border border-[#3F3F46] flex items-center justify-center">
                    <Icon className="w-6 h-6 text-[#DC143C]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">{feature.name}</h3>
                    <p className="text-gray-300 text-sm">{feature.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6 text-center">
          <p className="text-gray-300 mb-2">
            <strong className="text-white">In the meantime,</strong> you can continue using our other features:
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <a
              href="/write"
              className="text-[#DC143C] hover:text-[#DC143C]/80 transition-colors text-sm font-medium"
            >
              Create →
            </a>
            <a
              href="/produce"
              className="text-[#DC143C] hover:text-[#DC143C]/80 transition-colors text-sm font-medium"
            >
              Produce →
            </a>
            <a
              href="/dashboard"
              className="text-[#DC143C] hover:text-[#DC143C]/80 transition-colors text-sm font-medium"
            >
              Dashboard →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
