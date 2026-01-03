import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Writing Help | ${config.appName}`,
  description: "Learn how to write screenplays with Wryda.ai's professional editor and 5 AI writing agents.",
  canonicalUrlRelative: "/help/writing",
});

export default function WritingHelp() {
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
        <h1 className="text-4xl font-extrabold mb-4">✍️ Writing</h1>
        <p className="text-xl opacity-80 mb-12">
          Learn how to write professional screenplays with our Fountain format editor and 5 specialized AI writing agents.
        </p>

        {/* Screenplay Editor */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4">Professional Screenplay Editor</h2>
          <p className="mb-4">
            Wryda.ai uses the industry-standard <strong>Fountain format</strong>, the same format used by Final Draft, Celtx, and Fade In. 
            Your screenplays are compatible with all major screenwriting software.
          </p>
          
          <div className="card bg-base-200 mb-6">
            <div className="card-body">
              <h3 className="font-bold mb-2">Key Features:</h3>
              <ul className="space-y-2">
                <li>✓ <strong>Fountain Format</strong> - Industry-standard screenplay format</li>
                <li>✓ <strong>Auto-Formatting</strong> - Automatic scene headings, character names, dialogue</li>
                <li>✓ <strong>GitHub Integration</strong> - Version control for your screenplays</li>
                <li>✓ <strong>Auto-Save</strong> - Your work is saved every 2 seconds</li>
                <li>✓ <strong>Import/Export</strong> - Compatible with Final Draft (.fdx), PDF, HTML</li>
                <li>✓ <strong>Character Tracking</strong> - Automatically tracks all characters</li>
                <li>✓ <strong>Location Tracking</strong> - Manages scene locations</li>
              </ul>
            </div>
          </div>
        </section>

        {/* AI Writing Agents */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-4">5 AI Writing Agents</h2>
          <p className="mb-6">
            All agents understand your screenplay context and work together to help you write better scripts. 
            Powered by OpenAI, Anthropic, and Google.
          </p>

          <div className="space-y-6">
            <AgentCard
              name="Story Advisor"
              icon="🌟"
              unique={true}
              description="Reads your entire screenplay and provides comprehensive analysis"
              features={[
                "Analyzes structure across all acts",
                "Tracks character arcs throughout",
                "Identifies plot holes and inconsistencies",
                "Provides story-level feedback"
              ]}
            />

            <AgentCard
              name="Screenwriter"
              icon="✍️"
              description="Continue scenes, expand dialogue, develop characters"
              features={[
                "Continue scenes from where you left off",
                "Expand dialogue naturally",
                "Develop character backstories",
                "Understands your screenplay context"
              ]}
            />

            <AgentCard
              name="Director"
              icon="🎬"
              description="Generate full scenes with action, dialogue, and direction"
              features={[
                "Generate complete scenes from descriptions",
                "Production-ready formatting",
                "Visual direction and blocking",
                "Character interactions"
              ]}
            />

            <AgentCard
              name="Dialogue"
              icon="💬"
              description="Polish dialogue, match character voice, improve conversations"
              features={[
                "Polish dialogue for naturalness",
                "Match character voice and tone",
                "Improve conversation flow",
                "Character-aware rewriting"
              ]}
            />

            <AgentCard
              name="Rewrite"
              icon="✨"
              description="Polish and refine. Fix pacing, improve clarity, enhance style"
              features={[
                "Fix pacing issues",
                "Improve clarity and readability",
                "Enhance writing style",
                "Professional editing"
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
                  <strong>Start Writing</strong> - Navigate to the Write section and begin your screenplay
                </li>
                <li>
                  <strong>Use Fountain Format</strong> - Type scene headings, character names, and dialogue naturally
                </li>
                <li>
                  <strong>Ask AI for Help</strong> - Click the AI icon to access any of the 5 writing agents
                </li>
                <li>
                  <strong>Track Characters</strong> - Characters are automatically detected and tracked
                </li>
                <li>
                  <strong>Save & Export</strong> - Your work auto-saves. Export to PDF or Final Draft format when ready
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* Navigation */}
        <div className="flex gap-4 justify-between mt-12">
          <Link href="/help" className="btn btn-ghost">← Back to Help Center</Link>
          <Link href="/help/production" className="btn btn-primary">Next: Production →</Link>
        </div>
      </main>
    </>
  );
}

function AgentCard({ name, icon, unique, description, features }) {
  return (
    <div className="card bg-base-200 border-2 border-primary/30">
      <div className="card-body">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <h3 className="card-title text-xl">
              {name}
              {unique && <span className="badge badge-primary badge-sm ml-2">UNIQUE</span>}
            </h3>
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

