import Link from "next/link";
import Image from "next/image";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";
import logo from "@/app/icon.png";
import ComingSoonBadge from "@/components/ComingSoonBadge";

export const metadata = getSEOTags({
  title: `Help Center | ${config.appName}`,
  description: "Get started quickly with Wryda.ai: write your first script, run your first agent pass, create first references, and understand credits.",
  canonicalUrlRelative: "/help",
});

export default function HelpCenter() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
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
        <Link href="/" className="btn btn-ghost text-[#B3B3B3] hover:text-[#FFFFFF] border-white/10">← Back to Home</Link>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-16 bg-[#0A0A0A] text-[#FFFFFF]">
        {/* Hero */}
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-[#FFFFFF]">
            📚 Help Center
          </h1>
          <p className="text-xl opacity-80 max-w-3xl mx-auto text-[#B3B3B3]">
            Start fast with a practical activation path:
            <br />
            First script → first agent pass → first references → credits clarity
          </p>
        </section>

        {/* First Success Path */}
        <section className="mb-16">
          <div className="card bg-[#141414] border border-[#DC143C]/30">
            <div className="card-body">
              <h2 className="text-3xl font-bold mb-2 text-[#DC143C]">🚀 First Success Path (20-30 Minutes)</h2>
              <p className="text-sm opacity-70 mb-6 text-[#B3B3B3]">
                Use this path to get your first real result quickly.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/help/writing" className="card bg-[#141414] hover:bg-[#1F1F1F] transition-colors border border-[#DC143C]/30">
                  <div className="card-body items-start">
                    <div className="text-xs text-gray-500">Step 1</div>
                    <h3 className="font-bold text-base">Create first script page</h3>
                    <p className="text-xs opacity-70">Import Fountain or start from a scene idea.</p>
                  </div>
                </Link>
                <Link href="/help/advanced/dialogue-generation" className="card bg-[#141414] hover:bg-[#1F1F1F] transition-colors border border-[#DC143C]/30">
                  <div className="card-body items-start">
                    <div className="text-xs text-gray-500">Step 2</div>
                    <h3 className="font-bold text-base">Run first agent pass</h3>
                    <p className="text-xs opacity-70">Use Dialogue, Rewrite, or Screenwriter additively.</p>
                  </div>
                </Link>
                <Link href="/help/production" className="card bg-[#141414] hover:bg-[#1F1F1F] transition-colors border border-[#DC143C]/30">
                  <div className="card-body items-start">
                    <div className="text-xs text-gray-500">Step 3</div>
                    <h3 className="font-bold text-base">Build first references</h3>
                    <p className="text-xs opacity-70">Generate character, location, and prop continuity sets.</p>
                  </div>
                </Link>
                <Link href="/help/credits" className="card bg-[#141414] hover:bg-[#1F1F1F] transition-colors border border-[#DC143C]/30">
                  <div className="card-body items-start">
                    <div className="text-xs text-gray-500">Step 4</div>
                    <h3 className="font-bold text-base">Understand credits</h3>
                    <p className="text-xs opacity-70">Learn what consumes credits and how to scale usage.</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Workflow Overview */}
        <section className="mb-16">
          <div className="card bg-[#141414] border border-[#DC143C]/30">
            <div className="card-body">
              <h2 className="text-3xl font-bold mb-2 text-[#DC143C]">🧭 Core Workflow Overview</h2>
              <p className="text-sm opacity-70 mb-6 text-[#B3B3B3]">Follow the product flow: write first, build references, then direct when needed.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/help/writing" className="card bg-[#141414] hover:bg-[#1F1F1F] transition-colors border border-[#DC143C]/30">
                  <div className="card-body items-center text-center">
                    <div className="text-4xl mb-2">✍️</div>
                    <h3 className="font-bold text-base">1. Write</h3>
                    <p className="text-xs opacity-70">Draft and revise with screenplay-native agents</p>
                    <div className="badge badge-sm badge-primary mt-2">START HERE</div>
                  </div>
                </Link>

                <Link href="/help/production" className="card bg-[#141414] hover:bg-[#1F1F1F] transition-colors border border-[#DC143C]/30">
                  <div className="card-body items-center text-center">
                    <div className="text-4xl mb-2">🎬</div>
                    <h3 className="font-bold text-base text-[#FFFFFF]">2. Produce</h3>
                    <p className="text-xs opacity-70 text-[#B3B3B3]">Create continuity references and prep assets</p>
                    <div className="badge bg-[#DC143C] text-[#FFFFFF] border-none badge-sm mt-2">GENERATE</div>
                  </div>
                </Link>

                <Link href="/help/direct" className="card bg-[#141414] hover:bg-[#1F1F1F] transition-colors border border-[#00D9FF]/30">
                  <div className="card-body items-center text-center">
                    <div className="text-4xl mb-2">🎞️</div>
                    <h3 className="font-bold text-base text-[#FFFFFF]">3. Direct</h3>
                    <p className="text-xs opacity-70 text-[#B3B3B3]">Stage outputs and steer visual execution</p>
                    <div className="badge bg-[#00D9FF] text-[#0A0A0A] border-none badge-sm mt-2">DIRECT</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Main Help Sections */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <HelpSectionCard
            href="/help/writing"
            icon="✍️"
            title="Writing"
            description="Screenplay editor, Fountain format, and 5 AI writing agents"
            features={[
              "Professional screenplay editor",
              "5 AI writing agents (Story Advisor, Screenwriter, Director, Dialogue, Rewrite)",
              "Smart Tab - Scene heading navigation (Tab or button on mobile)",
              "@ Quick Link - Fast character/location linking",
              "Fountain format support",
              "GitHub version control"
            ]}
          />
          <HelpSectionCard
            href="/help/production"
            icon="🎬"
            title="Production"
            description="AI video generation and consistency systems"
            features={[
              "AI video generation (multiple quality tiers)",
              "Character, location & prop consistency",
              "Scene Builder (Motion Picture Technology)",
              "Turn screenplay into video"
            ]}
          />
          <div className="relative">
            <HelpSectionCard
              href="/help/direct"
              icon="🎞️"
              title="Direct"
              description="Review, organize, and control your production"
              features={[
                "Scene Builder interface",
                "Shot Board view of all first frames and videos",
                "Review generated videos",
                "Organize your production"
              ]}
            />
            <div className="absolute top-4 right-4">
              <ComingSoonBadge size="sm" />
            </div>
          </div>
          <HelpSectionCard
            href="/help/faq"
            icon="❓"
            title="FAQ"
            description="Common questions and troubleshooting"
            features={[
              "Getting started",
              "Credits & pricing",
              "Common issues",
              "Quick answers"
            ]}
          />
        </section>

        {/* Quick Links */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-[#FFFFFF]">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickLinkCard
              href="/help/writing"
              title="Write Your First Page"
              description="Start a script and build clean screenplay structure"
            />
            <QuickLinkCard
              href="/help/advanced/dialogue-generation"
              title="Run Your First Agent Pass"
              description="Apply an additive Dialogue/Rewrite pass in context"
            />
            <QuickLinkCard
              href="/help/credits"
              title="Understand Credits Fast"
              description="Know what uses credits and how to plan usage"
            />
          </div>
        </section>

        {/* Still Need Help CTA */}
        <section className="text-center py-16 bg-[#141414] rounded-box border border-white/10">
          <h2 className="text-3xl font-bold mb-4 text-[#FFFFFF]">Still Need Help?</h2>
          <p className="text-lg opacity-80 mb-8 text-[#B3B3B3]">
            Our support team is here to help you succeed.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/help/contact" className="btn bg-[#DC143C] hover:bg-[#8B0000] text-[#FFFFFF] border-none">
              Contact Support
            </Link>
            <Link href="/dashboard" className="btn btn-ghost text-[#B3B3B3] hover:text-[#FFFFFF] border-white/10">
              Go to Dashboard
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function HelpSectionCard({ href, icon, title, description, features }) {
  return (
    <Link href={href} className="card bg-[#141414] hover:bg-[#1F1F1F] transition-shadow border border-[#DC143C]/30">
      <div className="card-body">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-5xl">{icon}</div>
          <div>
            <h3 className="card-title text-2xl text-[#FFFFFF]">{title}</h3>
            <p className="text-sm opacity-70 text-[#B3B3B3]">{description}</p>
          </div>
        </div>
        <ul className="space-y-2">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <span className="text-[#DC143C]">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <div className="card-actions justify-end mt-4">
          <span className="text-sm opacity-60">Learn more →</span>
        </div>
      </div>
    </Link>
  );
}

function QuickLinkCard({ href, title, description }) {
  return (
    <Link href={href} className="card bg-[#141414] hover:bg-[#1F1F1F] transition-colors border border-white/10">
      <div className="card-body">
        <h3 className="card-title text-base text-[#FFFFFF]">{title}</h3>
        <p className="text-sm opacity-70 text-[#B3B3B3]">{description}</p>
      </div>
    </Link>
  );
}
