import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Screenplay Editor - Write to Visual Production | ${config.appName}`,
  description: "Professional screenplay editor with 8-sequence structure, contextual linking to production, and AI-powered writing assistance. Write your script and generate videos from the same platform.",
  canonicalUrlRelative: "/features/editor",
});

export default function EditorFeaturePage() {
  return (
    <>
      {/* Header */}
      <header className="p-4 flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-extrabold">
            {config.appName}<span className="text-[#DC143C]">.ai</span>
          </span>
        </Link>
        <div className="flex gap-2">
          <Link href="/features" className="btn btn-ghost btn-sm">All Features</Link>
          <Link href="/dashboard" className="btn btn-sm bg-[#DC143C] hover:bg-[#B91238] text-white border-none">Start Writing →</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-12 md:py-20">
        
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-[#DC143C]/10 border border-[#DC143C]/30 rounded-full text-sm font-semibold text-[#DC143C] mb-4">
            ✍️ Screenplay Editor
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            From Script to Screen<br/>
            <span className="text-[#DC143C]">All in One Platform</span>
          </h1>
          <p className="text-xl md:text-2xl opacity-80 max-w-3xl mx-auto mb-8">
            Professional screenplay editor that <strong>contextually links</strong> to production, composition, and timeline. Write your scene, generate videos, edit, and export—without ever leaving the platform.
          </p>
          
          {/* Quick Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
            <div className="flex items-center gap-2 justify-center text-sm">
              <span className="text-green-500 text-xl">✓</span>
              <span>8-Sequence Structure</span>
            </div>
            <div className="flex items-center gap-2 justify-center text-sm">
              <span className="text-green-500 text-xl">✓</span>
              <span>Contextual Linking</span>
            </div>
            <div className="flex items-center gap-2 justify-center text-sm">
              <span className="text-green-500 text-xl">✓</span>
              <span>AI Writing Assistant</span>
            </div>
          </div>
        </section>

        {/* The Big Idea */}
        <section className="mb-16 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30 rounded-2xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
            🎯 The Big Idea
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-3">❌ Old Way (Disconnected)</h3>
              <ol className="space-y-2 text-sm opacity-80">
                <li className="flex gap-2">
                  <span className="font-bold">1.</span>
                  <span>Write screenplay in Final Draft</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">2.</span>
                  <span>Copy/paste scenes to AI platform</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">3.</span>
                  <span>Download generated videos</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">4.</span>
                  <span>Import to Premiere/DaVinci</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">5.</span>
                  <span>Manually match videos to scenes</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold">6.</span>
                  <span>Edit and export</span>
                </li>
              </ol>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3">✅ Wryda Way (Integrated)</h3>
              <ol className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="font-bold text-green-500">1.</span>
                  <span><strong>Write screenplay</strong> (8-sequence structure guides you)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-green-500">2.</span>
                  <span><strong>Click scene</strong> → Auto-loads in Production</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-green-500">3.</span>
                  <span><strong>Generate videos</strong> → Auto-tagged to scene</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-green-500">4.</span>
                  <span><strong>Open Timeline</strong> → Clips already organized</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-green-500">5.</span>
                  <span><strong>Compose & export</strong> → Done!</span>
                </li>
              </ol>
            </div>
          </div>
          <div className="mt-8 p-4 bg-base-300/50 rounded-lg text-center">
            <p className="text-lg font-semibold">
              🚀 <strong>Result:</strong> 6 steps → 5 steps. 3 tools → 1 platform. Hours → Minutes.
            </p>
          </div>
        </section>

        {/* Core Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Core Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1: 8-Sequence Structure */}
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-xl mb-3">📖 8-Sequence Story Structure</h3>
                <p className="text-sm opacity-80 mb-4">
                  Professional Hollywood structure built-in. Every project starts with 8 pre-defined sequences that guide your screenplay from setup to resolution.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="badge badge-sm badge-primary flex-shrink-0">1</span>
                    <div>
                      <strong>Sequence 1: Setup</strong>
                      <div className="text-xs opacity-70">Introduce world, characters, status quo (Act I)</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="badge badge-sm badge-primary flex-shrink-0">2</span>
                    <div>
                      <strong>Sequence 2: Catalyst</strong>
                      <div className="text-xs opacity-70">Inciting incident, new situation begins</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="badge badge-sm badge-secondary flex-shrink-0">3-6</span>
                    <div>
                      <strong>Act II: Rising Conflict</strong>
                      <div className="text-xs opacity-70">Obstacles, complications, midpoint turn</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="badge badge-sm badge-accent flex-shrink-0">7-8</span>
                    <div>
                      <strong>Act III: Resolution</strong>
                      <div className="text-xs opacity-70">Climax, resolution, new equilibrium</div>
                    </div>
                  </div>
                </div>
                <div className="divider text-xs opacity-50">WHY THIS MATTERS</div>
                <p className="text-xs opacity-70">
                  No more blank page anxiety. The structure is already there—you just fill in your unique story. Plus, production tools are organized by sequence for easy navigation.
                </p>
              </div>
            </div>

            {/* Feature 2: Contextual Linking */}
            <div className="card bg-gradient-to-br from-[#DC143C]/10 to-purple-600/10 border-2 border-[#DC143C]/30">
              <div className="card-body">
                <h3 className="card-title text-xl mb-3">🔗 Contextual Linking (The Killer Feature)</h3>
                <p className="text-sm opacity-80 mb-4">
                  The app knows where you are in your screenplay. Switch pages, and context follows automatically.
                </p>
                <div className="space-y-3 text-sm">
                  <div className="bg-base-300/50 rounded-lg p-3">
                    <div className="font-semibold mb-1">📝 Writing Scene 15</div>
                    <div className="text-xs opacity-70 mb-2">"INT. APARTMENT - NIGHT" with SARAH and JOHN</div>
                    <div className="space-y-1 text-xs">
                      <div>→ Switch to <strong>Story Beats</strong>: Auto-scrolls to Sequence 5</div>
                      <div>→ Switch to <strong>Characters</strong>: SARAH & JOHN at top</div>
                      <div>→ Switch to <strong>Production</strong>: Scene 15 loaded in Scene Builder</div>
                      <div>→ Switch to <strong>Timeline</strong>: Shows Scene 15 clips highlighted</div>
                    </div>
                  </div>
                  <div className="bg-base-300/50 rounded-lg p-3">
                    <div className="font-semibold mb-1">🎬 In Production</div>
                    <div className="text-xs opacity-70 mb-2">Generating videos for Scene 8</div>
                    <div className="space-y-1 text-xs">
                      <div>→ Switch to <strong>Editor</strong>: Jumps to Scene 8</div>
                      <div>→ Switch to <strong>Timeline</strong>: Scene 8 clips ready to edit</div>
                      <div>→ Generated videos <strong>auto-tagged</strong> to Scene 8</div>
                    </div>
                  </div>
                </div>
                <div className="divider text-xs opacity-50">THE RESULT</div>
                <p className="text-xs font-semibold text-[#DC143C]">
                  ✨ No manual searching. No lost clips. No confusion. Context flows seamlessly across the entire platform.
                </p>
              </div>
            </div>

            {/* Feature 3: Characters & Locations */}
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-xl mb-3">👥 Characters & Locations</h3>
                <p className="text-sm opacity-80 mb-4">
                  Automatically extracted from your screenplay. Click any character or location to see all their scenes.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-bold mb-2">Characters:</div>
                    <ul className="space-y-1 text-xs opacity-80">
                      <li>• Auto-tracked from dialogue</li>
                      <li>• See scene appearances</li>
                      <li>• Upload reference images</li>
                      <li>• Generate character videos</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-bold mb-2">Locations:</div>
                    <ul className="space-y-1 text-xs opacity-80">
                      <li>• Auto-detected from headings</li>
                      <li>• INT/EXT tracking</li>
                      <li>• Upload location photos</li>
                      <li>• Generate establishing shots</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 bg-base-300/50 rounded-lg p-3 text-xs">
                  <strong>💡 Pro Tip:</strong> Characters and locations are shared across all pages. Add a reference image in Characters page → Production automatically uses it for consistent video generation!
                </div>
              </div>
            </div>

            {/* Feature 4: Write OR Paste */}
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-xl mb-3">✍️ Write Yourself or Paste Existing Script</h3>
                <p className="text-sm opacity-80 mb-4">
                  Two workflows: start from scratch with AI help, or bring your existing screenplay.
                </p>
                <div className="space-y-3">
                  <div>
                    <div className="font-bold text-sm mb-2">Option 1: Write from Scratch</div>
                    <ul className="text-xs opacity-80 space-y-1">
                      <li>• 8-sequence structure guides you</li>
                      <li>• AI writing agents help with dialogue, action, structure</li>
                      <li>• Real-time Fountain formatting</li>
                      <li>• Auto-saves every 2 seconds</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-bold text-sm mb-2">Option 2: Import Existing</div>
                    <ul className="text-xs opacity-80 space-y-1">
                      <li>• Copy/paste from Final Draft, Celtx, etc.</li>
                      <li>• Auto-detects scenes, characters, locations</li>
                      <li>• Auto-populates Story Beats page</li>
                      <li>• Organizes into 8 sequences automatically</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 bg-success/10 border border-success/30 rounded-lg p-3 text-xs">
                  <strong className="text-success">✅ Either way:</strong> Your screenplay becomes production-ready. Characters, locations, and scenes flow to all production tools automatically.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How Contextual Linking Works */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">How Contextual Linking Works</h2>
          
          <div className="space-y-6">
            <div className="card bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-2 border-blue-500/30">
              <div className="card-body">
                <div className="flex items-start gap-4">
                  <div className="text-4xl flex-shrink-0">1️⃣</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Editor → Production</h3>
                    <p className="text-sm opacity-80 mb-3">
                      You're writing Scene 12. Click <strong>Production</strong> in the nav bar.
                    </p>
                    <div className="bg-base-300/50 rounded-lg p-3 text-sm">
                      <strong>What Happens:</strong>
                      <ul className="mt-2 space-y-1 text-xs">
                        <li>✓ Production page opens</li>
                        <li>✓ Scene Builder tab loads Scene 12 automatically</li>
                        <li>✓ Scene text, characters, location all pre-filled</li>
                        <li>✓ Ready to generate videos with one click</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-r from-purple-500/10 to-purple-600/10 border-2 border-purple-500/30">
              <div className="card-body">
                <div className="flex items-start gap-4">
                  <div className="text-4xl flex-shrink-0">2️⃣</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Production → Timeline</h3>
                    <p className="text-sm opacity-80 mb-3">
                      Generated 3 clips for Scene 12. Click <strong>Timeline</strong>.
                    </p>
                    <div className="bg-base-300/50 rounded-lg p-3 text-sm">
                      <strong>What Happens:</strong>
                      <ul className="mt-2 space-y-1 text-xs">
                        <li>✓ Timeline opens</li>
                        <li>✓ All 3 clips from Scene 12 highlighted</li>
                        <li>✓ Clips tagged with "Scene 12" metadata</li>
                        <li>✓ Ready to compose, add transitions, and export</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-r from-green-500/10 to-green-600/10 border-2 border-green-500/30">
              <div className="card-body">
                <div className="flex items-start gap-4">
                  <div className="text-4xl flex-shrink-0">3️⃣</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Story Beats → Editor</h3>
                    <p className="text-sm opacity-80 mb-3">
                      On Story Beats page. Click a scene in Sequence 3.
                    </p>
                    <div className="bg-base-300/50 rounded-lg p-3 text-sm">
                      <strong>What Happens:</strong>
                      <ul className="mt-2 space-y-1 text-xs">
                        <li>✓ Editor opens</li>
                        <li>✓ Auto-scrolls to that exact scene</li>
                        <li>✓ Scene is highlighted</li>
                        <li>✓ Ready to edit or read</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-r from-[#DC143C]/10 to-[#DC143C]/20 border-2 border-[#DC143C]/30">
              <div className="card-body">
                <div className="flex items-start gap-4">
                  <div className="text-4xl flex-shrink-0">4️⃣</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Characters → Production</h3>
                    <p className="text-sm opacity-80 mb-3">
                      Click "SARAH" in Characters page. Click a scene she's in.
                    </p>
                    <div className="bg-base-300/50 rounded-lg p-3 text-sm">
                      <strong>What Happens:</strong>
                      <ul className="mt-2 space-y-1 text-xs">
                        <li>✓ Production opens with that scene loaded</li>
                        <li>✓ SARAH's reference images pre-loaded</li>
                        <li>✓ Character-consistent video generation ready</li>
                        <li>✓ One click to generate</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-base-200 rounded-2xl text-center">
            <p className="text-xl font-semibold mb-2">
              🎯 The Pattern
            </p>
            <p className="opacity-80">
              <strong>No matter where you are</strong>, the app knows your context and carries it forward. No copy/paste. No manual searching. No friction.
            </p>
          </div>
        </section>

        {/* Story Beats Explained */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Story Beats: Your Story Map</h2>
          
          <div className="card bg-base-200 mb-8">
            <div className="card-body">
              <p className="text-lg opacity-90 mb-6">
                The <strong>Story Beats</strong> page shows your entire screenplay organized into the 8-sequence structure. Think of it as your story's bird's-eye view.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold mb-3">What You See:</h3>
                  <ul className="space-y-2 text-sm opacity-80">
                    <li>• <strong>8 Sequences</strong> with descriptions</li>
                    <li>• <strong>All scenes</strong> organized under each sequence</li>
                    <li>• <strong>Scene summaries</strong> auto-generated</li>
                    <li>• <strong>Characters & locations</strong> for each scene</li>
                    <li>• <strong>Progress tracking</strong> (written, generated, edited)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold mb-3">What You Can Do:</h3>
                  <ul className="space-y-2 text-sm opacity-80">
                    <li>• Click scene → Jump to Editor</li>
                    <li>• Drag scenes between sequences</li>
                    <li>• See which scenes have videos</li>
                    <li>• Track completion status</li>
                    <li>• Reorganize story structure</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-info/10 border-2 border-info/30 rounded-xl p-6 text-center">
            <p className="text-lg font-semibold mb-2">
              💡 Auto-Population
            </p>
            <p className="text-sm opacity-80">
              Write in the Editor → Story Beats auto-populates.<br/>
              Paste a screenplay → Beats page organizes it into sequences automatically.<br/>
              <strong>It's always in sync. Zero manual work.</strong>
            </p>
          </div>
        </section>

        {/* AI Writing Agents */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">AI Writing Agents</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-2 border-purple-500/30">
              <div className="card-body">
                <div className="text-3xl mb-2">🎬</div>
                <h3 className="text-lg font-bold mb-2">Screenwriter Agent</h3>
                <p className="text-sm opacity-80 mb-3">Brainstorming, structure, plot development</p>
                <div className="text-xs space-y-1 opacity-70">
                  <div>• "Help me structure Act II"</div>
                  <div>• "What should happen in this scene?"</div>
                  <div>• "Give me 5 plot twist ideas"</div>
                </div>
                <div className="badge badge-sm badge-primary mt-3">0.1-2 credits</div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-pink-500/10 to-pink-600/10 border-2 border-pink-500/30">
              <div className="card-body">
                <div className="text-3xl mb-2">🎭</div>
                <h3 className="text-lg font-bold mb-2">Director Agent</h3>
                <p className="text-sm opacity-80 mb-3">Write entire scenes with dialogue & direction</p>
                <div className="text-xs space-y-1 opacity-70">
                  <div>• "Write confrontation: SARAH vs boss"</div>
                  <div>• "Create car chase sequence"</div>
                  <div>• "Generate romantic dinner scene"</div>
                </div>
                <div className="badge badge-sm badge-secondary mt-3">0.5-2 credits</div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-2 border-yellow-500/30">
              <div className="card-body">
                <div className="text-3xl mb-2">✨</div>
                <h3 className="text-lg font-bold mb-2">Polish Agent</h3>
                <p className="text-sm opacity-80 mb-3">Refine dialogue, tighten prose, fix grammar</p>
                <div className="text-xs space-y-1 opacity-70">
                  <div>• Select text → "Make this natural"</div>
                  <div>• "Add subtext to this dialogue"</div>
                  <div>• "Tighten this action line"</div>
                </div>
                <div className="badge badge-sm badge-accent mt-3">0.1-1 credit</div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-success/10 border border-success/30 rounded-xl p-6 text-center">
            <p className="font-semibold mb-2">💰 AI Agents are Nearly FREE</p>
            <p className="text-sm opacity-80">
              AI agents (0.1-2 cr) vs Video generation (25-300 cr) = <strong>25-75x cheaper!</strong><br/>
              Free users (10 cr/month) can have 5-100 agent conversations.
            </p>
          </div>
        </section>

        {/* Getting Started */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Getting Started</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title">🆕 Starting from Scratch</h3>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-2">
                    <span className="font-bold">1.</span>
                    <span>Click <strong>+ New Project</strong> in nav bar</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">2.</span>
                    <span>Enter project name (e.g., "My Thriller Script")</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">3.</span>
                    <span>Editor opens with 8-sequence structure ready</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">4.</span>
                    <span>Start writing in Sequence 1, Scene 1</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">5.</span>
                    <span>Use AI agents for help (Ctrl+/)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">6.</span>
                    <span>Write naturally—auto-saves every 2 seconds</span>
                  </li>
                </ol>
              </div>
            </div>

            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title">📋 Importing Existing Script</h3>
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-2">
                    <span className="font-bold">1.</span>
                    <span>Click <strong>+ New Project</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">2.</span>
                    <span>Name your project</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">3.</span>
                    <span>Copy screenplay from Final Draft/Celtx/etc.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">4.</span>
                    <span>Paste into Editor</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">5.</span>
                    <span>Auto-detects scenes, characters, locations</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">6.</span>
                    <span>Check Story Beats—scenes organized into 8 sequences!</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Why This Matters */}
        <section className="mb-16 bg-gradient-to-br from-[#DC143C]/10 to-purple-600/10 border-2 border-[#DC143C]/30 rounded-2xl p-8 md:p-12">
          <h2 className="text-3xl font-bold mb-6 text-center">Why This Matters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-base-200/50 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-3">For Screenwriters</h3>
              <ul className="space-y-2 text-sm">
                <li>✓ <strong>Professional structure</strong> guides your story</li>
                <li>✓ <strong>Never lose context</strong> when switching tools</li>
                <li>✓ <strong>See your screenplay visually</strong> without leaving the platform</li>
                <li>✓ <strong>Iterate faster</strong>—write, generate, review, revise</li>
              </ul>
            </div>
            
            <div className="bg-base-200/50 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-3">For Filmmakers</h3>
              <ul className="space-y-2 text-sm">
                <li>✓ <strong>Script → Screen in one platform</strong></li>
                <li>✓ <strong>No manual organization</strong>—everything auto-tagged</li>
                <li>✓ <strong>Pre-visualize scenes</strong> before production</li>
                <li>✓ <strong>Share with clients/investors</strong> instantly</li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xl font-semibold mb-4">
              🎯 The Bottom Line
            </p>
            <p className="text-lg opacity-90 max-w-3xl mx-auto">
              Wryda's editor isn't just a screenplay tool—it's the <strong>command center</strong> for your entire production. Write once, context flows everywhere. No friction, no lost work, no manual tagging.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Writing?</h2>
          <p className="text-lg opacity-80 mb-8 max-w-2xl mx-auto">
            Create your first project, write a scene, and watch it transform into video—all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard" className="btn btn-lg bg-[#DC143C] hover:bg-[#B91238] text-white border-none">
              Start Writing Now →
            </Link>
            <Link href="/help/screenplay-editor" className="btn btn-lg btn-outline">
              Read Full Guide
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-base-300 py-8 text-center text-sm opacity-70">
        <p>© 2024 {config.appName}. All rights reserved.</p>
      </footer>
    </>
  );
}

