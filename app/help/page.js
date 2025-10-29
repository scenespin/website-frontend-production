import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Help Center | ${config.appName}`,
  description: "Complete documentation for Wryda.ai - AI-powered video production, screenplay writing, timeline editing, and more. Learn everything from getting started to advanced techniques.",
  canonicalUrlRelative: "/help",
});

export default function HelpCenter() {
  return (
    <>
      {/* Header */}
      <header className="p-4 flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-extrabold">
            {config.appName}<span className="text-[#DC143C]">.ai</span>
          </span>
        </Link>
        <Link href="/" className="btn btn-ghost">← Back to Home</Link>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-16">
        {/* Hero */}
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            📚 Help Center
          </h1>
          <p className="text-xl opacity-80 max-w-3xl mx-auto">
            Everything you need to create professional AI-powered video content.
            <br />
            From your first video to advanced production techniques.
          </p>
        </section>

        {/* Quick Links */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <QuickLinkCard
            href="/help/quick-start"
            icon="🚀"
            title="Quick Start"
            description="Create your first video in 5 minutes"
          />
          <QuickLinkCard
            href="/help/credits"
            icon="💳"
            title="Credits System"
            description="Understand how credits work"
          />
          <QuickLinkCard
            href="/help/video-generation"
            icon="🎬"
            title="Video Generation"
            description="Master AI video creation"
          />
        </section>

        {/* Level 1: Getting Started */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-2">🚀 Level 1: Getting Started</h2>
          <p className="text-sm opacity-70 mb-6">New users - First 30 minutes</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HelpArticleCard
              href="/help/welcome"
              title="Welcome to Wryda.ai"
              description="Understand what Wryda.ai is and what you can do"
              time="3 min read"
            />
            <HelpArticleCard
              href="/help/quick-start"
              title="Quick Start Guide"
              description="Generate your first video in 5 minutes"
              time="5 min read"
            />
            <HelpArticleCard
              href="/help/quality-tiers"
              title="Understanding Quality Tiers"
              description="Choose the right quality for your needs"
              time="3 min read"
            />
            <HelpArticleCard
              href="/help/credits"
              title="Credit System Explained"
              description="How credits work and what they buy"
              time="5 min read"
            />
          </div>
        </section>

        {/* Level 2: Core Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-2">📘 Level 2: Core Features</h2>
          <p className="text-sm opacity-70 mb-6">Learning the platform - First week</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HelpArticleCard
              href="/help/video-generation"
              title="AI Video Generation"
              description="Master text-to-video, image-to-video, and character consistency"
              time="10 min read"
            />
            <HelpArticleCard
              href="/help/screenplay-editor"
              title="Screenplay Editor"
              description="Professional Fountain format editing and GitHub integration"
              time="15 min read"
            />
            <HelpArticleCard
              href="/help/workflows"
              title="AI Workflows Guide"
              description="Use 42 pre-built professional workflows"
              time="10 min read"
            />
          </div>
        </section>

        {/* Level 3: Advanced Techniques */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-2">📗 Level 3: Advanced Techniques</h2>
          <p className="text-sm opacity-70 mb-6">Power users - Ongoing</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HelpArticleCard
              href="/help/advanced/character-consistency"
              title="Character Consistency"
              description="Keep characters looking the same across multiple shots"
              time="12 min read"
            />
            <HelpArticleCard
              href="/help/advanced/multi-shot-scenes"
              title="Multi-Shot Scene Building"
              description="Create complex scenes with multiple camera angles"
              time="15 min read"
            />
            <HelpArticleCard
              href="/help/advanced/timeline-mastery"
              title="Timeline Editing Mastery"
              description="Professional multi-track editing techniques"
              time="20 min read"
            />
            <HelpArticleCard
              href="/help/advanced/dialogue-generation"
              title="Dialogue Generation"
              description="Create realistic character conversations with lip-sync"
              time="10 min read"
            />
          </div>
        </section>

        {/* Level 4: Reference */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-2">📙 Level 4: Reference</h2>
          <p className="text-sm opacity-70 mb-6">Quick lookup - As needed</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <HelpArticleCard
              href="/help/reference/pricing"
              title="Pricing Reference"
              description="Complete pricing breakdown and credit costs"
              time="5 min read"
            />
            <HelpArticleCard
              href="/help/reference/shortcuts"
              title="Keyboard Shortcuts"
              description="Speed up your workflow with shortcuts"
              time="3 min read"
            />
            <HelpArticleCard
              href="/help/reference/formats"
              title="Export Formats"
              description="All export options and format specifications"
              time="5 min read"
            />
            <HelpArticleCard
              href="/help/reference/troubleshooting"
              title="Troubleshooting"
              description="Common issues and solutions"
              time="10 min read"
            />
          </div>
        </section>

        {/* Still Need Help CTA */}
        <section className="text-center py-16 bg-base-200 rounded-box">
          <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
          <p className="text-lg opacity-80 mb-8">
            Our support team is here to help you succeed.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="mailto:support@wryda.ai" className="btn btn-primary">
              Contact Support
            </Link>
            <Link href="/dashboard" className="btn btn-ghost">
              Go to Dashboard
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

function QuickLinkCard({ href, icon, title, description }) {
  return (
    <Link href={href} className="card bg-gradient-to-br from-primary/10 to-secondary/10 hover:shadow-xl transition-shadow">
      <div className="card-body text-center">
        <div className="text-5xl mb-2">{icon}</div>
        <h3 className="card-title justify-center text-lg">{title}</h3>
        <p className="text-sm opacity-80">{description}</p>
      </div>
    </Link>
  );
}

function HelpArticleCard({ href, title, description, time }) {
  return (
    <Link href={href} className="card bg-base-200 hover:bg-base-300 transition-colors">
      <div className="card-body">
        <h3 className="card-title text-base">{title}</h3>
        <p className="text-sm opacity-70">{description}</p>
        <div className="card-actions justify-between items-center mt-2">
          <span className="text-xs opacity-60">{time}</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 opacity-50">
            <path fillRule="evenodd" d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

