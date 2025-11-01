import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Production Page Guide | ${config.appName}`,
  description: "Complete guide to the Production Page - AI workflows, scene builder, character bank, and seamless integration with timeline editing.",
  canonicalUrlRelative: "/help/production",
});

export default function ProductionPageGuide() {
  return (
    <>
      <header className="p-4 flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-extrabold">
            {config.appName}<span className="text-[#DC143C]">.ai</span>
          </span>
        </Link>
        <div className="flex gap-2">
          <Link href="/help" className="btn btn-ghost btn-sm">← Help Center</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-16">
        <div className="text-sm breadcrumbs mb-6">
          <ul>
            <li><Link href="/help">Help Center</Link></li>
            <li className="font-semibold">Production Page</li>
          </ul>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>🎬 Production Page - Complete Guide</h1>
          <p className="lead">Your AI video generation hub. Generate professional videos with 58 pre-built workflows, including 7 cinema-grade HDR post-production workflows. Features script-based scene builder and character management - all seamlessly integrated with timeline editing.</p>

          <div className="alert alert-success my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <div className="font-bold">🚀 Complete Production Pipeline</div>
              <div className="text-sm">From script to final export - generate videos with AI, edit professionally on timeline, apply cinema-grade finishing, and export in any format. All in one platform.</div>
            </div>
          </div>

          <h2>📑 Production Page Tabs</h2>
          <p>The Production Page has 5 main tabs for different workflows:</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 not-prose my-8">
            <div className="card bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-2 border-blue-500/30">
              <div className="card-body">
                <h3 className="card-title text-base">📑 Tab 1: Workflows</h3>
                <p className="text-sm">Quick & easy - 90% of users. 58 pre-built AI workflows for instant generation. No script needed!</p>
                <div className="badge badge-primary badge-sm">Recommended</div>
              </div>
            </div>
            <div className="card bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-2 border-purple-500/30">
              <div className="card-body">
                <h3 className="card-title text-base">📝 Tab 2: Scene Builder</h3>
                <p className="text-sm">Advanced - Screenplay-driven production with character consistency and hybrid upload/AI.</p>
                <div className="badge badge-secondary badge-sm">Power Users</div>
              </div>
            </div>
            <div className="card bg-gradient-to-br from-green-500/10 to-green-600/10 border-2 border-green-500/30">
              <div className="card-body">
                <h3 className="card-title text-base">👥 Tab 3: Characters</h3>
                <p className="text-sm">Manage character profiles and reference libraries for consistent characters across all scenes.</p>
              </div>
            </div>
            <div className="card bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-2 border-orange-500/30">
              <div className="card-body">
                <h3 className="card-title text-base">⚙️ Tab 4: Jobs</h3>
                <p className="text-sm">Track generation progress, view history, and recover failed jobs.</p>
              </div>
            </div>
            <div className="card bg-gradient-to-br from-pink-500/10 to-pink-600/10 border-2 border-pink-500/30">
              <div className="card-body">
                <h3 className="card-title text-base">📍 Tab 5: Locations</h3>
                <p className="text-sm">Manage location references for consistent settings across scenes (Feature 0098!)</p>
                <div className="badge badge-accent badge-sm">NEW!</div>
              </div>
            </div>
          </div>

          <h2>📑 Tab 1: Workflows (Quick Generation)</h2>
          <p>The fastest way to generate videos - perfect for beginners and one-off creations. This is the <strong>quick and easy</strong> mode used by <strong>90% of users</strong>.</p>

          <h3>What It Does:</h3>
          <ul>
            <li><strong>58 Pre-Built AI Workflows</strong> for instant video generation</li>
            <li><strong>One-Click Generation</strong> with automatic settings optimized for each workflow</li>
            <li><strong>No Script Needed</strong> - Just describe what you want or upload files</li>
            <li><strong>Results Go Anywhere</strong> - Send directly to Timeline, Composition Studio, or save to Library</li>
            <li><strong>All Formats Supported</strong> - Vertical (TikTok/Reels), horizontal (YouTube), square (Instagram), cinema ultrawide</li>
          </ul>

          <h3>Why Use Workflows Tab?</h3>
          <div className="card bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/30 my-6 not-prose">
            <div className="card-body">
              <ul className="text-sm space-y-2">
                <li>✅ <strong>No learning curve</strong> - Pick a workflow, enter prompt, click generate</li>
                <li>✅ <strong>Optimized settings</strong> - Each workflow uses best AI models and parameters automatically</li>
                <li>✅ <strong>Fast iteration</strong> - Try different styles/approaches in minutes</li>
                <li>✅ <strong>One-off content</strong> - Perfect for quick TikToks, Reels, or standalone videos</li>
                <li>✅ <strong>Experimentation</strong> - Explore different workflows without commitment</li>
              </ul>
            </div>
          </div>

          <h3>📂 Workflow Categories (Organized by Viral Potential):</h3>

          <div className="space-y-6 my-8 not-prose">
            {/* Performance Capture */}
            <div className="card bg-gradient-to-br from-red-500/10 to-red-600/10 border-2 border-red-500/30">
              <div className="card-body">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-lg">🎭 Performance Capture</h4>
                  <div className="badge badge-error">MOST VIRAL! 🔥</div>
                </div>
                <p className="text-sm opacity-90 mb-3">&quot;Be the Character&quot; - Upload your performance, get stylized output. Perfect for viral content creators!</p>
                <div className="text-xs opacity-70">
                  <strong>12 workflows including:</strong> AI Avatar, Image to Speech, Podcast to Video, Multilingual Dubbing, Anime Performance, 3D Animation, Cartoon Style, Character Animation, Multi-angle Coverage, Reality-to-Toon, Complete Scene, Production Pipeline
                </div>
              </div>
            </div>

            {/* Budget/Speed */}
            <div className="card bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-2 border-yellow-500/30">
              <div className="card-body">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-lg">⚡ Budget / Speed</h4>
                  <div className="badge badge-warning">HIGHLY VIRAL! 🔥</div>
                </div>
                <p className="text-sm opacity-90 mb-3">Ultra-fast generation under 2 minutes. Perfect for TikTok/Reels, GIFs, and rapid iteration.</p>
                <div className="text-xs opacity-70">
                  <strong>7 workflows including:</strong> Speed Demon, Micro Action Loop, Multi-Platform Loop, Perfect Loop Generator, Loop Variations, Endless Scroll Content, Quick Draft Mode
                </div>
              </div>
            </div>

            {/* Photorealistic */}
            <div className="card bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-2 border-blue-500/30">
              <div className="card-body">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-lg">🎬 Photorealistic</h4>
                  <div className="badge badge-info">Professional Quality</div>
                </div>
                <p className="text-sm opacity-90 mb-3">Cinema-grade photorealistic generation for professional projects, commercials, and client work.</p>
                <div className="text-xs opacity-70">
                  <strong>6 workflows including:</strong> Hollywood Standard, Budget Photorealistic, Multi-Platform Hero, Precision Poser, Cinematic Camera Suite, Scene Composer
                </div>
              </div>
            </div>

            {/* Animated */}
            <div className="card bg-gradient-to-br from-pink-500/10 to-pink-600/10 border-2 border-pink-500/30">
              <div className="card-body">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-lg">✨ Animated</h4>
                  <div className="badge badge-secondary">High Viral Potential</div>
                </div>
                <p className="text-sm opacity-90 mb-3">Anime, cartoon, and 3D animation styles. Perfect for animated content creators and storytellers.</p>
                <div className="text-xs opacity-70">
                  <strong>3 workflows including:</strong> Anime Master, Cartoon Classic, 3D Character Animation
                </div>
              </div>
            </div>

            {/* Production Tools */}
            <div className="card bg-gradient-to-br from-green-500/10 to-green-600/10 border-2 border-green-500/30">
              <div className="card-body">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-lg">🛠️ Production Tools</h4>
                  <div className="badge badge-success">Professional</div>
                </div>
                <p className="text-sm opacity-90 mb-3">Professional production utilities - B-roll, stock replacement, coverage, and continuity tools.</p>
                <div className="text-xs opacity-70">
                  <strong>9 workflows including:</strong> Scene Bridge, Video Chain Builder, Genre Camera Variants, Shot Type Variants, Complete Scene, VFX Elements, Stock Footage Replacement, B-Roll Master, Location Previs
                </div>
              </div>
            </div>

            {/* Post-Production */}
            <div className="card bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-2 border-purple-500/30">
              <div className="card-body">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-lg">🎨 Post-Production & HDR</h4>
                  <div className="badge badge-primary">Cinema-Grade</div>
                </div>
                <p className="text-sm opacity-90 mb-3">Professional HDR finishing and cinema mastering. Transform any footage into premium quality with 7 post-production workflows.</p>
                <div className="text-xs opacity-70">
                  <strong>7 workflows:</strong> Native HDR Generation, SDR to HDR Upgrade (convert ANY video to HDR!), Cinema HDR Master, Hybrid 4K HDR Pipeline, Multi-Format HDR Delivery, Draft to HDR Master, EXR Export Professional
                </div>
              </div>
            </div>
          </div>

          <h3>How to Use Workflows:</h3>
          <ol>
            <li>Click <strong>&quot;Workflows&quot;</strong> tab in Production page</li>
            <li>Browse by category or search for specific workflow</li>
            <li>Select a workflow that matches your needs</li>
            <li>Enter your prompt or upload required files</li>
            <li>Click <strong>&quot;Generate&quot;</strong></li>
            <li>Wait for generation (2-5 minutes depending on workflow)</li>
            <li>Click <strong>&quot;Send to Timeline&quot;</strong> for editing, or <strong>&quot;Save to Library&quot;</strong> for later</li>
          </ol>

          <div className="card bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30 my-8 not-prose">
            <div className="card-body">
              <h4 className="font-bold text-lg">💡 Workflow Example: AI Avatar</h4>
              <div className="text-sm space-y-2">
                <p><strong>Use Case:</strong> Create a talking avatar for your YouTube channel intro</p>
                <ol className="list-decimal list-inside space-y-1 mt-2 ml-4">
                  <li>Production → Workflows → Performance Capture → &quot;AI Avatar&quot;</li>
                  <li>Upload your photo</li>
                  <li>Type your dialogue OR clone a voice</li>
                  <li>Click &quot;Generate&quot; (costs ~100 credits)</li>
                  <li>Wait 3-4 minutes</li>
                  <li>Send to Timeline → Add background music → Export!</li>
                </ol>
                <p className="mt-3"><strong>Result:</strong> Professional talking avatar in under 10 minutes total!</p>
              </div>
            </div>
          </div>

          <h2>📝 Tab 2: Scene Builder (Advanced)</h2>
          <p>This is the <strong>advanced mode</strong> for screenplay-driven production. Used by <strong>power users</strong> who want full control over their storytelling process.</p>

          <h3>What It Does:</h3>
          <ul>
            <li><strong>Works Directly with Your Screenplay</strong> - Integrates with the Write page</li>
            <li><strong>AI Analyzes Scenes</strong> - Suggests shot compositions and coverage automatically</li>
            <li><strong>Character-Aware</strong> - Uses Character Bank for perfect consistency across scenes</li>
            <li><strong>Generates Multi-Clip Scenes</strong> - Create entire scenes with proper coverage (wide, medium, close-up)</li>
            <li><strong>Hybrid Workflow</strong> - Mix AI generation with your own uploaded footage</li>
            <li><strong>Smart Cost Optimization</strong> - Upload wide shots, AI generates character close-ups = 50-70% savings</li>
          </ul>

          <h3>Why Scene Builder Is Powerful:</h3>
          <div className="card bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 my-6 not-prose">
            <div className="card-body">
              <div className="text-sm space-y-3">
                <p><strong>Traditional AI Video Problem:</strong> Generate one clip at a time, characters look different in every shot, no scene continuity.</p>
                <p><strong>Scene Builder Solution:</strong> AI understands your screenplay, maintains character consistency across ALL clips, suggests proper scene composition, and generates everything together as a cohesive scene.</p>
                <p className="mt-3"><strong>Result:</strong> Professional multi-clip scenes with perfect character consistency and proper coverage - just like Hollywood productions!</p>
              </div>
            </div>
          </div>

          <h3>3-Column Layout Explained:</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 not-prose my-8">
            <div className="card bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-2 border-blue-500/30">
              <div className="card-body">
                <h4 className="font-bold text-base mb-2">📖 Column 1: Story Beats</h4>
                <p className="text-sm mb-2">Shows scenes from your screenplay</p>
                <ul className="text-xs space-y-1">
                  <li>• Select a beat → AI analyzes it</li>
                  <li>• Suggests composition templates</li>
                  <li>• Examples: split-screen, picture-in-picture, multi-angle</li>
                </ul>
              </div>
            </div>
            <div className="card bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-2 border-purple-500/30">
              <div className="card-body">
                <h4 className="font-bold text-base mb-2">🎬 Column 2: Clip Generation</h4>
                <p className="text-sm mb-2">Shows required clips for the scene</p>
                <ul className="text-xs space-y-1">
                  <li>• Assign each clip to:</li>
                  <li>  - <strong>AI Generate</strong> (with character reference)</li>
                  <li>  - <strong>Upload</strong> your own footage</li>
                  <li>• Mix and match!</li>
                  <li>• <strong>Hybrid = huge cost savings</strong></li>
                </ul>
              </div>
            </div>
            <div className="card bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-2 border-green-500/30">
              <div className="card-body">
                <h4 className="font-bold text-base mb-2">👥 Column 3: Character Bank</h4>
                <p className="text-sm mb-2">Shows all your characters with references</p>
                <ul className="text-xs space-y-1">
                  <li>• Select character → shows reference angles</li>
                  <li>• Generates references automatically</li>
                  <li>• Drag character to clip assignment</li>
                  <li>• <strong>Instant character consistency!</strong></li>
                </ul>
              </div>
            </div>
          </div>

          <h3>Step-by-Step: How Scene Builder Works</h3>
          <div className="alert alert-info my-6 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <div className="font-bold mb-2">The Magic of Scene Builder:</div>
              <div className="text-sm space-y-1">
                <p><strong>You:</strong> Write screenplay → Select scene</p>
                <p><strong>AI:</strong> &quot;This scene needs 3 clips - dialogue split-screen composition&quot;</p>
                <p><strong>You:</strong> Assign clips (2 AI-generated with characters + 1 uploaded B-roll)</p>
                <p><strong>AI:</strong> Generates clips with character consistency → Auto-composes to split-screen</p>
                <p><strong>Result:</strong> Professional scene, ready for Timeline editing!</p>
              </div>
            </div>
          </div>

          <h3>How to Use Scene Builder:</h3>
          <ol>
            <li>Go to <strong>Write page</strong> and create your screenplay</li>
            <li>Production → <strong>Scene Builder</strong> tab</li>
            <li>Select a scene from left panel</li>
            <li>AI analyzes scene and suggests: <em>&quot;This needs 3 clips - dialogue split-screen&quot;</em></li>
            <li>Assign each clip:
              <ul>
                <li><strong>Clip 1:</strong> AI generate with &quot;Sarah&quot; character</li>
                <li><strong>Clip 2:</strong> AI generate with &quot;Marcus&quot; character</li>
                <li><strong>Clip 3:</strong> Upload your own B-roll footage</li>
              </ul>
            </li>
            <li>Click <strong>&quot;Generate Scene&quot;</strong></li>
            <li>Clips render automatically, then compose to split-screen</li>
            <li><strong>Send to Timeline</strong> for final editing</li>
          </ol>

          <div className="alert alert-info my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <div className="font-bold">💰 Hybrid Workflow = Huge Savings!</div>
              <div className="text-sm">Upload wide shots, AI generates close-ups with characters. Save 50-70% on credits vs all-AI! Example: 3-clip scene - 2 AI + 1 upload = 200 credits vs 450 all-AI.</div>
            </div>
          </div>

          <h2>👥 Tab 3: Character Bank</h2>
          <p>Create and manage character profiles for <strong>perfect consistency</strong> across all your scenes. This is the secret to professional-looking AI video production!</p>

          <h3>What It Does:</h3>
          <ul>
            <li><strong>Character Profiles</strong> - Create characters with base reference images</li>
            <li><strong>Auto-Generate References</strong> - AI creates 8 variations automatically (angles, expressions, poses)</li>
            <li><strong>Consistency Across ALL Scenes</strong> - Same character looks identical in every single scene</li>
            <li><strong>Manual Uploads</strong> - Add your own reference images for real people</li>
            <li><strong>Reference Library Management</strong> - Organize angles, expressions, and action poses</li>
          </ul>

          <h3>Why Character Bank Is Essential:</h3>
          <div className="card bg-gradient-to-br from-red-500/10 to-orange-500/10 border-2 border-red-500/30 my-6 not-prose">
            <div className="card-body">
              <div className="text-sm space-y-3">
                <p><strong>❌ Without Character Bank:</strong> Generate video of &quot;Sarah&quot; in Scene 1 → Generate &quot;Sarah&quot; in Scene 2 → Looks like completely different people!</p>
                <p><strong>✅ With Character Bank:</strong> Create &quot;Sarah&quot; with references → Use in Scene 1, Scene 2, Scene 10 → Looks like the SAME PERSON in every scene!</p>
                <p className="mt-3 font-bold">This is the difference between amateur and professional AI video production.</p>
              </div>
            </div>
          </div>

          <h3>How to Create a Character (Step-by-Step):</h3>
          <ol>
            <li>Production → <strong>Characters</strong> tab</li>
            <li>Click <strong>&quot;Add Character&quot;</strong></li>
            <li>Enter character name (e.g., &quot;Detective Sarah&quot;)</li>
            <li>Choose one:
              <ul>
                <li><strong>Option A:</strong> Upload base reference image (photo of real person or artwork)</li>
                <li><strong>Option B:</strong> Generate with AI (describe character, AI creates base image)</li>
              </ul>
            </li>
            <li>Click <strong>&quot;Generate References&quot;</strong> (costs ~40 credits, one-time)</li>
            <li>AI automatically creates <strong>8 variations</strong>:
              <ul>
                <li>📸 Front view, side view, 3/4 angle</li>
                <li>😊 Different expressions (happy, sad, neutral, surprised)</li>
                <li>🤸 Different poses (standing, sitting, action)</li>
              </ul>
            </li>
            <li>Now use &quot;Detective Sarah&quot; in Scene Builder → She looks the same in EVERY scene!</li>
          </ol>

          <h3>Character Bank Advanced Features:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-6">
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold text-sm mb-2">🎭 Base Reference</h4>
                <p className="text-xs">Primary character image. This is the &quot;source of truth&quot; for the character&apos;s appearance.</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold text-sm mb-2">📐 Auto-Generated Angles</h4>
                <p className="text-xs">Front, side, 3/4 angles created automatically for different shot types.</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold text-sm mb-2">😄 Expression Library</h4>
                <p className="text-xs">Happy, sad, angry, neutral expressions for emotional scenes.</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold text-sm mb-2">🎬 Action Poses</h4>
                <p className="text-xs">Running, sitting, standing poses for different scene requirements.</p>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 my-8 not-prose">
            <div className="card-body">
              <h4 className="font-bold text-lg">🎯 Character Consistency Pro Tip</h4>
              <div className="text-sm space-y-2">
                <p>Generate character references ONCE, use in EVERY scene. No more &quot;different person in every shot&quot; problem!</p>
                <p className="mt-2"><strong>Example:</strong> Create &quot;Detective Sarah&quot; → Generate 8 references (40 credits one-time) → Use in 10 scenes → Perfect consistency!</p>
              </div>
            </div>
          </div>

          <h2>⚙️ Tab 4: Jobs (Workflow History & Recovery)</h2>
          <p>Track all your generation jobs, view complete history, and recover from failures. This is your production <strong>command center</strong>.</p>

          <h3>What It Shows:</h3>
          <ul>
            <li><strong>Active Jobs</strong> - Currently generating videos with real-time progress bars (0% → 100%)</li>
            <li><strong>Completed Jobs</strong> - Successfully generated videos with download/send-to-timeline options</li>
            <li><strong>Failed Jobs</strong> - Jobs that encountered errors with automatic retry option</li>
            <li><strong>Job Details</strong> - Credits used, workflow name, quality tier, timestamps, prompts</li>
            <li><strong>Searchable History</strong> - Find past generations by workflow, date, or prompt</li>
          </ul>

          <h3>Why Jobs Tab Is Useful:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-6">
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold text-sm mb-2">📊 Real-Time Tracking</h4>
                <p className="text-xs">Watch your videos generate in real-time. Average 2-5 minutes depending on workflow.</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold text-sm mb-2">🔄 Automatic Recovery</h4>
                <p className="text-xs">If a job fails (rare), one-click retry. Credits automatically refunded on failures.</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold text-sm mb-2">📜 Complete History</h4>
                <p className="text-xs">Access every video you&apos;ve ever generated. Re-run previous prompts instantly.</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold text-sm mb-2">💰 Credit Tracking</h4>
                <p className="text-xs">See exactly how many credits each job used. Optimize your workflow costs.</p>
              </div>
            </div>
          </div>

          <h2>📍 Tab 5: Locations (Location Bank) - NEW!</h2>
          <p>Maintain consistent locations across multiple scenes by managing location reference libraries. Similar to Character Bank, but for settings and environments.</p>

          <div className="alert alert-info my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <div className="font-bold">🆕 Feature 0098: Location Consistency System</div>
              <div className="text-sm">Upload photos or generate location references to maintain consistent settings throughout your production.</div>
            </div>
          </div>

          <h3>What It Does:</h3>
          <ul>
            <li><strong>Location Profiles</strong> - Create locations with base reference images</li>
            <li><strong>Multiple Angles</strong> - Store different views of the same location (wide, close-up, entrance, interior)</li>
            <li><strong>Time-of-Day Variations</strong> - Day, night, golden hour versions of same location</li>
            <li><strong>Consistency Across Scenes</strong> - Same location looks identical in every scene</li>
            <li><strong>Real Photo Integration</strong> - Upload actual location photos for photorealistic consistency</li>
          </ul>

          <h3>Why Location Bank Is Important:</h3>
          <div className="card bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/30 my-6 not-prose">
            <div className="card-body">
              <div className="text-sm space-y-3">
                <p><strong>❌ Without Location Bank:</strong> Generate &quot;coffee shop&quot; in Scene 1 → Generate &quot;coffee shop&quot; in Scene 5 → Completely different coffee shops!</p>
                <p><strong>✅ With Location Bank:</strong> Create &quot;Joe&apos;s Coffee Shop&quot; with references → Use in multiple scenes → Same coffee shop every time!</p>
                <p className="mt-3 font-bold">Essential for professional series, episodic content, and multi-scene projects.</p>
              </div>
            </div>
          </div>

          <h3>How to Create a Location (Step-by-Step):</h3>
          <ol>
            <li>Production → <strong>Locations</strong> tab</li>
            <li>Click <strong>&quot;Add Location&quot;</strong></li>
            <li>Choose creation method:
              <ul>
                <li><strong>Upload Photo:</strong> Upload a real photo of the location</li>
                <li><strong>Generate with AI:</strong> Describe the location and let AI create it</li>
              </ul>
            </li>
            <li>AI automatically generates <strong>multiple angle variations</strong> from your base reference</li>
            <li>Add the location name and type (INT./EXT./INT./EXT.)</li>
            <li>Use location references in Scene Builder or workflows</li>
          </ol>

          <h3>Location Types:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 not-prose my-6">
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="card-title text-sm">INT. (Interior)</h4>
                <p className="text-xs">Indoor locations like homes, offices, stores</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="card-title text-sm">EXT. (Exterior)</h4>
                <p className="text-xs">Outdoor locations like streets, parks, buildings</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="card-title text-sm">INT./EXT.</h4>
                <p className="text-xs">Mixed locations like doorways, windows, patios</p>
              </div>
            </div>
          </div>

          <h3>Pro Tips for Location References:</h3>
          <ul>
            <li>📸 <strong>Upload real photos</strong> when possible for maximum consistency</li>
            <li>🌅 <strong>Generate time-of-day variations</strong> if scenes happen at different times</li>
            <li>📐 <strong>Store multiple angles</strong> for complex locations (wide, close-up, different rooms)</li>
            <li>🎬 <strong>Use in Scene Builder</strong> - drag location references into scene generation</li>
            <li>🔄 <strong>Update as needed</strong> - add new angles or variations as your project grows</li>
          </ul>

          <div className="card bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/30 my-8 not-prose">
            <div className="card-body">
              <h4 className="font-bold text-lg">🎯 Location Consistency Pro Tip</h4>
              <div className="text-sm space-y-2">
                <p>Just like Character Bank revolutionized character consistency, Location Bank solves the &quot;different location every scene&quot; problem!</p>
                <p className="mt-2"><strong>Example:</strong> Create &quot;Tony&apos;s Restaurant&quot; → Upload/generate references → Use in 8 different scenes → Perfect consistency!</p>
              </div>
            </div>
          </div>

          <h2>🔗 Seamless Integration with Timeline & Composition</h2>
          <p>The Production Page doesn&apos;t exist in isolation - it&apos;s part of a <strong>complete production pipeline</strong> that flows seamlessly between all pages.</p>

          <h3>How Everything Connects:</h3>

          <div className="card bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-2 border-indigo-500/30 my-8 not-prose">
            <div className="card-body">
              <h4 className="font-bold text-lg mb-3">📋 The Complete Wryda Pipeline:</h4>
              <div className="text-sm space-y-3">
                <div className="flex items-center gap-2">
                  <div className="badge badge-primary">1</div>
                  <p><strong>Write Page</strong> → Create your screenplay with Fountain format</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="badge badge-secondary">2</div>
                  <p><strong>Production Page</strong> → Generate videos from screenplay (Scene Builder) or standalone (Workflows)</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="badge badge-accent">3</div>
                  <p><strong>Composition Studio</strong> → Apply layouts (split-screen, PIP, grids) to multiple clips</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="badge badge-info">4</div>
                  <p><strong>Timeline Editor</strong> → Arrange clips, add music, transitions, color grading</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="badge badge-success">5</div>
                  <p><strong>Export</strong> → Professional video ready for YouTube, TikTok, clients, or festivals</p>
                </div>
              </div>
            </div>
          </div>

          <h3>One-Click Navigation:</h3>
          <ul>
            <li><strong>&quot;Send to Timeline&quot;</strong> - After generation, click button → Video appears on Timeline instantly</li>
            <li><strong>&quot;Send to Composition&quot;</strong> - Generate multiple clips → Send all to Composition for layouts</li>
            <li><strong>&quot;Save to Library&quot;</strong> - Not ready to edit? Save for later, access anytime</li>
            <li><strong>Round-Trip Editing</strong> - Timeline → Composition → Timeline → back to Composition → fully bidirectional!</li>
          </ul>

          <div className="alert alert-success my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <div className="font-bold">🚀 This Is Wryda&apos;s Advantage</div>
              <div className="text-sm">Other platforms stop at generation. Wryda gives you the complete pipeline: Write → Generate → Compose → Edit → Export. All in one platform, seamlessly connected!</div>
            </div>
          </div>

          <h2>🔄 Complete Production Workflow Examples</h2>

          <h3>Workflow A: Quick One-Off (Beginner)</h3>
          <div className="card bg-base-200 my-6 not-prose">
            <div className="card-body">
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>Production → Workflows → Select &quot;Hollywood Standard&quot;</li>
                <li>Enter prompt: <em>&quot;Detective examining evidence in dark office&quot;</em></li>
                <li>Click Generate (100 credits, 3 minutes)</li>
                <li>Click <strong>&quot;Send to Timeline&quot;</strong></li>
                <li>Timeline → Add music, apply color grade, export</li>
                <li><strong>Done!</strong> Professional video in under 10 minutes</li>
              </ol>
            </div>
          </div>

          <h3>Workflow B: Full Screenplay Production (Professional)</h3>
          <div className="card bg-base-200 my-6 not-prose">
            <div className="card-body">
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li><strong>Write page</strong> → Write your screenplay (5 scenes)</li>
                <li><strong>Production → Characters</strong> → Create 2 characters with references</li>
                <li><strong>Production → Scene Builder</strong> → Select first scene</li>
                <li>AI suggests: <em>&quot;3-shot dialogue, split-screen composition&quot;</em></li>
                <li>Assign clips (mix AI + upload for cost savings)</li>
                <li>Generate scene (200 credits vs 450 all-AI)</li>
                <li>Repeat for all 5 scenes</li>
                <li>All scenes auto-send to <strong>Timeline</strong></li>
                <li><strong>Timeline</strong> → Arrange, transitions, music, color grade</li>
                <li>Export → Professional short film in under 2 hours!</li>
              </ol>
            </div>
          </div>

          <h3>Workflow C: Iterative Composition (Advanced)</h3>
          <div className="card bg-base-200 my-6 not-prose">
            <div className="card-body">
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>Production → Generate 3 clips separately (300 credits)</li>
                <li>Send all 3 to <strong>Timeline</strong></li>
                <li>Realize they&apos;d work better as split-screen</li>
                <li>Select all 3 clips → Click <strong>&quot;Re-compose&quot;</strong></li>
                <li><strong>Composition Studio</strong> opens with clips preloaded</li>
                <li>Apply split-screen layout → Render</li>
                <li>Composed video returns to Timeline automatically</li>
                <li>Continue editing, add effects, export</li>
              </ol>
            </div>
          </div>

          <h2>💎 Production Page Best Practices</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold text-base">🎯 Start Simple</h4>
                <p className="text-sm">New to Wryda? Start with Workflows tab. Pick a workflow, enter prompt, generate. Don&apos;t overthink it!</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold text-base">💰 Use Hybrid Workflow</h4>
                <p className="text-sm">Upload wide shots, let AI generate character close-ups. Save 50-70% on credits!</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold text-base">👥 Create Characters Once</h4>
                <p className="text-sm">Generate character references once, use in every scene. Perfect consistency across your entire project.</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold text-base">🔄 Use Round-Trip Editing</h4>
                <p className="text-sm">Generate → Timeline → Realize need changes → Re-compose → Back to Timeline. Fully bidirectional!</p>
              </div>
            </div>
          </div>

          <h2>What&apos;s Next?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 not-prose my-8">
            <Link href="/help/advanced/timeline-mastery" className="card bg-primary text-primary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Timeline Editing</h3>
                <p className="text-sm">Professional editing after generation</p>
              </div>
            </Link>
            <Link href="/help/advanced/character-consistency" className="card bg-secondary text-secondary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Character Consistency</h3>
                <p className="text-sm">Advanced character management</p>
              </div>
            </Link>
            <Link href="/help/quick-start" className="card bg-accent text-accent-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Quick Start Guide</h3>
                <p className="text-sm">Get started in 5 minutes</p>
              </div>
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}

