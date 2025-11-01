import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Complete Features | ${config.appName}`,
  description: "Explore all 58 AI workflows including cinema-grade HDR finishing, professional screenplay writing tools, multi-track timeline editor, Hollywood transitions & compositions, and more. Everything unlocked from day one.",
  canonicalUrlRelative: "/features",
});

export default function Features() {
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
            Complete Feature List
          </h1>
          <p className="text-xl opacity-80 max-w-3xl mx-auto">
            <strong>80+ features. 58 AI workflows. All unlocked from day one.</strong>
            <br />
            Free users get everything. Pro/Ultra/Studio just get more credits.
          </p>
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <div className="card bg-base-200">
            <div className="card-body text-center">
              <div className="text-4xl font-bold text-[#DC143C]">58</div>
              <div className="text-sm opacity-70">AI Workflows</div>
            </div>
          </div>
          <div className="card bg-base-200">
            <div className="card-body text-center">
              <div className="text-4xl font-bold text-[#DC143C]">68</div>
              <div className="text-sm opacity-70">Compositions</div>
            </div>
          </div>
          <div className="card bg-base-200">
            <div className="card-body text-center">
              <div className="text-4xl font-bold text-[#DC143C]">30</div>
              <div className="text-sm opacity-70">Transitions</div>
            </div>
          </div>
          <div className="card bg-base-200">
            <div className="card-body text-center">
              <div className="text-4xl font-bold text-[#DC143C]">80+</div>
              <div className="text-sm opacity-70">Features</div>
            </div>
          </div>
        </section>

        {/* HERO: Upload Your Footage */}
        <section className="mb-16 bg-gradient-to-br from-[#DC143C]/10 to-purple-600/10 border-2 border-[#DC143C]/30 rounded-2xl p-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="text-5xl mb-4">🎬</div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Replace Your Entire Software Stack for $0
            </h2>
            <p className="text-xl mb-6 opacity-90">
              Upload <strong>unlimited footage</strong> in <strong>any format, any resolution</strong> — 100% FREE forever
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-base-200/50 rounded-lg p-4">
                <div className="text-2xl mb-2">📹</div>
                <div className="font-bold mb-1">ANY Format</div>
                <div className="text-sm opacity-70">MP4, MOV, WebM, MKV</div>
              </div>
              <div className="bg-base-200/50 rounded-lg p-4">
                <div className="text-2xl mb-2">🎥</div>
                <div className="font-bold mb-1">ANY Resolution</div>
                <div className="text-sm opacity-70">4K, 8K, RED, Cinema</div>
              </div>
              <div className="bg-base-200/50 rounded-lg p-4">
                <div className="text-2xl mb-2">💰</div>
                <div className="font-bold mb-1">$0 Forever</div>
                <div className="text-sm opacity-70">Never pay for your footage</div>
              </div>
            </div>
            <div className="bg-base-300/50 rounded-lg p-6 text-left">
              <div className="font-semibold mb-3 text-lg">🎯 How It Works:</div>
              <div className="space-y-2 text-sm">
                <div>✅ <strong>Upload your footage</strong> — MP4, MOV, WebM, MKV up to 100MB per file (FREE)</div>
                <div>✅ <strong>Upload audio & images</strong> — MP3, WAV, JPG, PNG (FREE)</div>
                <div>✅ <strong>Edit on 8-track timeline</strong> — Keyframes, transitions, compositions (FREE)</div>
                <div>✅ <strong>Mix with AI-generated clips</strong> — Only pay for AI generations (50-300 credits)</div>
                <div>✅ <strong>Export final render</strong> — Only pay for rendering (30-75 credits/min)</div>
              </div>
              <div className="mt-4 pt-4 border-t border-base-content/10">
                <strong>💡 The Value:</strong> Use Wryda.ai as your complete video editor. Only pay for AI and final export—never for using your own footage. Rival Premiere Pro & DaVinci Resolve at a fraction of the cost.
              </div>
            </div>
          </div>
        </section>

        {/* Core Platform Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">🎬 Core Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeatureCard
              title="Professional Screenplay Editor"
              description="Full Fountain format support, real-time GitHub sync, version control integration, industry-standard formatting"
              free={true}
            />
            <FeatureCard
              title="🎬 8-Track Timeline Editor - Professional Non-Linear Editing"
              description="Hollywood-grade timeline with round-trip editing, edge trimming, frame-accurate snapping, and seamless composition workflow. Edit like a pro - 100% FREE forever."
              free={true}
              highlight={true}
            />
            <FeatureCard
              title="AI Video Generation"
              description="3 quality tiers (Professional 1080p, Premium 4K, Ultra Native 4K), 5 aspect ratios (16:9, 9:16, 1:1, 4:3, 21:9)"
              free={false}
              credits="50-150 credits per 5s"
            />
            <FeatureCard
              title="Character Bank"
              description="Maintain character consistency across scenes with reference images, auto-consistency scoring, character library management"
              free={true}
            />
            <FeatureCard
              title="Custom Voice-Overs (ElevenLabs Integration)"
              description="Add custom narration and voice-overs using your own ElevenLabs voices. Perfect for tutorials, documentaries, and background narration. Does NOT include character lip-sync."
              free={true}
              note="(FREE integration - bring your own ElevenLabs API key)"
            />
            <FeatureCard
              title="Character Dialogue & Lip-Sync (AI Workflows)"
              description="Generate characters speaking with perfect lip-sync and facial animation using our AI workflows. Upload audio or describe dialogue, get fully animated talking characters."
              free={false}
              credits="400+ credits per scene"
            />
            <FeatureCard
              title="3D Model Export - Turn Your Screenplay into Games & AR"
              description="Transform your characters AND locations into 3D models for Unity, Unreal Engine, or AR experiences. Create a video game from your screenplay, build AR series for mobile devices, or export to Blender for 3D animation. Your story, infinite possibilities."
              free={false}
              credits="$5 per character, $10 per location"
            />
            <FeatureCard
              title="Cloud Storage Integration"
              description="Export to Google Drive or Dropbox, hierarchical folder structure, no vendor lock-in"
              free={true}
            />
            <FeatureCard
              title="🎥 Upload Your Own Footage - 100% FREE Forever"
              description="Replace your entire software stack for $0. Upload MP4, MOV, WebM, MKV in ANY resolution (4K, 8K, RED camera footage, DaVinci exports). Mix with AI, apply Hollywood transitions, export pro-quality renders. Only pay for AI generation & final export—never for your own footage."
              free={true}
              highlight={true}
            />
          </div>
        </section>

        {/* Timeline Editor Deep Dive */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">🎬 Timeline Editor - Professional Features</h2>
          <p className="text-lg opacity-80 mb-8">
            Hollywood-grade non-linear editing that rivals Premiere Pro & DaVinci Resolve. 100% FREE forever - never pay for using your own footage.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="card bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-2 border-purple-500/30">
              <div className="card-body">
                <h3 className="text-xl font-bold text-purple-400 mb-3">🔄 Round-Trip Editing</h3>
                <p className="text-sm opacity-90 mb-3">
                  Seamlessly move between Timeline and Composition Studio infinitely. Edit clips on timeline, send to composition for layouts, return with composed video automatically replacing originals. Non-destructive - originals always preserved.
                </p>
                <ul className="text-sm space-y-2 opacity-80">
                  <li>✅ Select clips → "Re-compose" → Opens Composition Studio</li>
                  <li>✅ Render composition → Auto-replaces original clips on timeline</li>
                  <li>✅ Re-edit compositions anytime - full bidirectional workflow</li>
                  <li>✅ Metadata preserved through entire production pipeline</li>
                </ul>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-2 border-blue-500/30">
              <div className="card-body">
                <h3 className="text-xl font-bold text-blue-400 mb-3">✂️ Edge Trimming & Precision Editing</h3>
                <p className="text-sm opacity-90 mb-3">
                  Frame-accurate editing with professional trimming tools. Drag clip edges to trim, snap to frame boundaries (30fps precision), split at playhead, and more.
                </p>
                <ul className="text-sm space-y-2 opacity-80">
                  <li>✅ Drag resize handles to trim clips non-destructively</li>
                  <li>✅ Frame-accurate snapping (30fps default, customizable)</li>
                  <li>✅ Split clips at playhead position</li>
                  <li>✅ Duplicate clips with keyboard shortcuts</li>
                </ul>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-500/10 to-green-600/10 border-2 border-green-500/30">
              <div className="card-body">
                <h3 className="text-xl font-bold text-green-400 mb-3">🎨 Professional Color Grading</h3>
                <p className="text-sm opacity-90 mb-3">
                  Apply cinematic color grades (LUTs) directly on timeline. Preview in real-time, no render needed. Includes built-in Wryda signature look.
                </p>
                <ul className="text-sm space-y-2 opacity-80">
                  <li>✅ One-click LUT application to any clip</li>
                  <li>✅ Real-time preview before applying</li>
                  <li>✅ Auto-apply Wryda LUT to imported clips (optional)</li>
                  <li>✅ Mix different grades across tracks</li>
                </ul>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-red-500/10 to-red-600/10 border-2 border-red-500/30">
              <div className="card-body">
                <h3 className="text-xl font-bold text-red-400 mb-3">🎞️ Transitions & Effects</h3>
                <p className="text-sm opacity-90 mb-3">
                  Hollywood-quality transitions applied directly on timeline. Crossfades, wipes, dissolves, and custom durations with easing curves.
                </p>
                <ul className="text-sm space-y-2 opacity-80">
                  <li>✅ Drag & drop transitions between clips</li>
                  <li>✅ Customizable duration and easing (ease-in, ease-out, etc.)</li>
                  <li>✅ Real-time preview of transition effects</li>
                  <li>✅ Access full transition library from timeline</li>
                </ul>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-2 border-yellow-500/30">
              <div className="card-body">
                <h3 className="text-xl font-bold text-yellow-400 mb-3">🎵 8-Track Audio Mixing</h3>
                <p className="text-sm opacity-90 mb-3">
                  Multi-track audio with independent volume controls. Layer dialogue, music, sound effects, and voiceovers with precision.
                </p>
                <ul className="text-sm space-y-2 opacity-80">
                  <li>✅ 4 video tracks + 4 audio tracks (8 total)</li>
                  <li>✅ Independent volume faders per track</li>
                  <li>✅ Keyframe volume automation (fade in/out)</li>
                  <li>✅ Waveform visualization for precise audio editing</li>
                </ul>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-pink-500/10 to-pink-600/10 border-2 border-pink-500/30">
              <div className="card-body">
                <h3 className="text-xl font-bold text-pink-400 mb-3">🌐 HDR Video Upgrade</h3>
                <p className="text-sm opacity-90 mb-3">
                  Upload any standard video and upgrade it to professional 16-bit HDR with consistent cinema-grade color. Works with footage from any source.
                </p>
                <ul className="text-sm space-y-2 opacity-80">
                  <li>✅ Upgrade any video to cinema-grade HDR</li>
                  <li>✅ Transform iPhone footage to professional quality</li>
                  <li>✅ Consistent color grading across all clips</li>
                  <li>✅ Turn $10 stock footage into $500 HDR assets</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="alert bg-gradient-to-r from-cinema-red/20 to-purple-500/20 border-2 border-cinema-red/50">
            <div>
              <h3 className="font-bold text-lg mb-2">💎 The Wryda Timeline Advantage</h3>
              <p className="text-sm opacity-90 mb-3">
                Replace Premiere Pro, DaVinci Resolve, and After Effects for <strong>$0/month</strong>. Upload unlimited footage in ANY resolution (4K, 8K, RED camera files). Only pay for AI generation and final exports - never for editing your own content.
              </p>
              <p className="text-sm opacity-90">
                <strong>Unique Value:</strong> Complete production pipeline from script to final export. Generate videos with AI, edit professionally on timeline, apply cinema-grade HDR finishing, and export in any format - all in one platform.
              </p>
            </div>
          </div>
        </section>

        {/* 51 AI Workflows */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">⚡ 51 AI Workflows</h2>
          <p className="text-lg opacity-80 mb-8">
            Pre-built professional workflows for instant content creation. All workflows support vertical video (TikTok, Reels) and multi-format bundles.
          </p>

          {/* Browse by Input Type */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">🎯 Browse by Input Type:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <a href="/help/workflows#text-only" className="card bg-gradient-to-br from-green-500/10 to-green-600/10 border-2 border-green-500/30 hover:border-green-500 transition-colors">
                <div className="card-body p-4">
                  <div className="text-green-500 font-bold">✍️ Text Only (18)</div>
                  <div className="text-xs opacity-70">Start from description alone</div>
                </div>
              </a>
              <a href="/help/workflows#text-images" className="card bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-2 border-orange-500/30 hover:border-orange-500 transition-colors">
                <div className="card-body p-4">
                  <div className="text-orange-500 font-bold">🖼️ Text + Images (14)</div>
                  <div className="text-xs opacity-70">Character consistency required</div>
                </div>
              </a>
              <a href="/help/workflows#video-transform" className="card bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-2 border-purple-500/30 hover:border-purple-500 transition-colors">
                <div className="card-body p-4">
                  <div className="text-purple-500 font-bold">🎬 Video Transform (15)</div>
                  <div className="text-xs opacity-70">Upload & transform footage</div>
                </div>
              </a>
            </div>
          </div>

          {/* Browse by Category */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">📂 Browse by Category (Sorted by Viral Potential):</h3>
            <div className="space-y-4">
              {/* Performance Capture */}
              <div className="collapse collapse-arrow bg-base-200">
                <input type="radio" name="workflow-category" defaultChecked />
                <div className="collapse-title text-lg font-semibold">
                  🎭 Performance Capture 🔥 <span className="text-sm opacity-70">(12 workflows) - MOST VIRAL!</span>
                </div>
                <div className="collapse-content">
                  <p className="text-sm opacity-70 mb-4 pt-2">&quot;Be the Character&quot; - Upload your performance, get stylized output</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WorkflowCard
                title="🎯 AI Avatar (NEW!)"
                description="Clone ANY voice and create photorealistic talking avatars! Two options: (1) Clone a voice + type dialogue = instant avatar, OR (2) Upload your own audio file + photo = instant lip-sync video. Perfect for scaling personal brands, creating digital spokespersons, or making any audio visual."
                stars={5}
                helpLink="/help/advanced/ai-avatar"
              />
              <WorkflowCard
                title="🎨 Image to Speech (NEW!)"
                description="Make ANY image speak! Upload artwork, cartoons, mascots, or photos and add audio. Perfect for viral content—make Mona Lisa talk, anime characters come alive, or brand mascots pitch products."
                stars={5}
                helpLink="/help/advanced/image-to-speech"
              />
              <WorkflowCard
                title="🎙️ Podcast to Video (NEW!)"
                description="Turn podcast episodes into YouTube videos! Upload your podcast audio + host photo = instant talking-head video. Perfect for repurposing audio content without re-recording. Batch process entire seasons!"
                stars={5}
                helpLink="/help/advanced/podcast-to-video"
              />
              <WorkflowCard
                title="🌍 Multilingual Dubbing (NEW!)"
                description="Create videos in multiple languages instantly! Same face, different languages with perfect lip sync. One recording → 20+ language versions. Massive B2B opportunity for global content creators!"
                stars={5}
                helpLink="/help/advanced/multilingual-dubbing"
              />
              <WorkflowCard
                title="Anime Performance Capture"
                description="Upload your own video performance, get it transformed into anime style while preserving your movements, expressions, and timing. Perfect for anime creators without traditional animation skills."
                stars={5}
              />
              <WorkflowCard
                title="3D Performance Capture"
                description="Convert your performance into high-quality 3D animation. Your acting drives the 3D character—no mocap suit required. Industry-grade 3D animation from your webcam."
                stars={5}
              />
              <WorkflowCard
                title="Cartoon Performance Capture"
                description="Transform your performance into classic Western cartoon style with exaggerated expressions and squash-and-stretch animation. Your performance, cartoonified in seconds."
                stars={5}
              />
              <WorkflowCard
                title="Anthro Performance Capture"
                description="Become an anthropomorphic animal character. Upload your performance, get a talking animal version. Ideal for animated stories, mascot content, and character-driven narratives."
                stars={5}
                helpLink="/help/advanced/character-consistency"
              />
              <WorkflowCard
                title="Action Director Performance"
                description="Upload one action performance, get multi-angle coverage automatically. Creates master, close-ups, and reaction shots from your single performance—complete professional coverage."
                stars={5}
                helpLink="/help/advanced/multi-shot-scenes"
              />
              <WorkflowCard
                title="Reality-to-Toon Performance"
                description="Hybrid workflow combining live-action with animated transformation. Start realistic, transform mid-scene, or blend both styles throughout for creative hybrid effects."
                stars={5}
              />
              <WorkflowCard
                title="Complete Scene Performance"
                description="Full scene package from your performance upload. Generates character consistency, proper coverage, and scene assembly automatically—complete production from one take."
                stars={5}
              />
              <WorkflowCard
                title="Production Pipeline Performance"
                description="Enterprise workflow: upload your performance, get complete production pipeline output including all necessary deliverables and formats. Professional production automation."
                stars={5}
              />
                  </div>
                </div>
              </div>

              {/* Budget / Speed */}
              <div className="collapse collapse-arrow bg-base-200">
                <input type="radio" name="workflow-category" />
                <div className="collapse-title text-lg font-semibold">
                  ⚡ Budget / Speed 🔥 <span className="text-sm opacity-70">(7 workflows) - HIGHLY VIRAL!</span>
                </div>
                <div className="collapse-content">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <WorkflowCard
                title="Speed Demon"
                description="Ultra-fast generation in under 2 minutes. Generate from text alone or add optional Character Bank for consistency. Perfect for rapid ideation, storyboarding, and testing concepts quickly."
                stars={3}
              />
              <WorkflowCard
                title="Micro Action Loop"
                description="Short, seamless looping action clips (2-4 seconds) perfect for social media, GIFs, and attention-grabbing content. Optimized for viral potential on TikTok and Reels."
                stars={4}
              />
              <WorkflowCard
                title="Multi-Platform Loop"
                description="Generate one perfect loop, automatically reframed for all social platforms. Creates 16:9, 9:16, 1:1, and 4:3 versions from a single generation—maximum platform reach."
                stars={4}
              />
              <WorkflowCard
                title="Perfect Loop Generator"
                description="Mathematically perfect seamless loops where the end frame matches the start frame exactly. Creates infinite replay-able content for backgrounds, ambiance, and hypnotic visuals."
                stars={4}
              />
              <WorkflowCard
                title="Loop Variations"
                description="Generate 5 style variations of the same looping clip. Test different moods, colors, times of day, or weather conditions to find the perfect look for your content."
                stars={4}
              />
              <WorkflowCard
                title="Budget Loop 2"
                description="Additional budget-friendly loop variation with lower credit cost. Great for bulk content creation and testing loop concepts before investing in premium quality."
                stars={3}
              />
              <WorkflowCard
                title="Speed Loop V2"
                description="Alternative ultra-fast loop generation with different optimization settings. Balances speed and loop quality for rapid content production and high-volume workflows."
                stars={3}
              />
                  </div>
                </div>
              </div>

              {/* Video Enhancement */}
              <div className="collapse collapse-arrow bg-base-200">
                <input type="radio" name="workflow-category" />
                <div className="collapse-title text-lg font-semibold">
                  ✨ Video Enhancement 🔥 <span className="text-sm opacity-70">(5 workflows) - VIRAL TRANSFORMATIONS!</span>
                </div>
                <div className="collapse-content">
                  <p className="text-sm opacity-70 mb-4 pt-2">Transform existing video footage with special effects, style changes, object removal, and more</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WorkflowCard
                title="VFX Magic"
                description="Add special effects to your existing footage. Rain, fire, magic, powers—Hollywood VFX without the Hollywood budget. Transform any video with seamless effects integration."
                stars={5}
              />
              <WorkflowCard
                title="Scene Transformer"
                description="Transform your scene&apos;s environment, lighting, time of day, or art style. Shoot once, create unlimited variations. Virtual production without the green screen."
                stars={5}
              />
              <WorkflowCard
                title="Element Eraser"
                description="Remove unwanted objects, people, or elements from your video. Clean up footage and salvage otherwise unusable shots. AI-powered content-aware fill."
                stars={4}
              />
              <WorkflowCard
                title="Product Reshoot"
                description="Transform product photos or videos with new backgrounds, lighting, or settings. No expensive photoshoots required. Perfect for e-commerce and marketing."
                stars={5}
              />
              <WorkflowCard
                title="Still Photo Performer"
                description="Animate still photos with your voice and expressions. Make grandma&apos;s photo speak again. Revolutionary for tribute videos and viral content."
                stars={5}
              />
                  </div>
                </div>
              </div>

              {/* Post-Production & HDR Finishing - NEW! */}
              <div className="collapse collapse-arrow bg-base-200 border-2 border-[#DC143C]/30">
                <input type="radio" name="workflow-category" />
                <div className="collapse-title text-lg font-semibold">
                  🎬 Post-Production & HDR Finishing ✨ <span className="text-sm opacity-70">(7 workflows) - CINEMA-GRADE PROFESSIONAL</span>
                </div>
                <div className="collapse-content">
                  <p className="text-sm opacity-70 mb-4 pt-2">
                    <strong className="text-[#DC143C]">THE ONLY AI PLATFORM WITH HDR SUPPORT.</strong> Transform any video to cinema-grade 16-bit HDR. Export EXR for DaVinci Resolve. Film festival ready.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WorkflowCard
                title="SDR to HDR Upgrade 🔥"
                description="Transform ANY video into cinema-grade 16-bit HDR—even videos from other AI platforms, iPhone footage, or stock libraries. The ultimate finishing tool that NO competitor offers."
                stars={5}
              />
              <WorkflowCard
                title="Hybrid 4K HDR Pipeline 🏆"
                description="The ultimate quality workflow: Professional generation → 4K enhancement → HDR conversion → Cinema finishing. Combines multiple techniques for output quality impossible anywhere else."
                stars={5}
              />
              <WorkflowCard
                title="Cinema HDR Master (21:9)"
                description="Generate professional 21:9 ultrawide content in native 16-bit HDR. Film festival ready with EXR export for professional color grading. The filmmaker's choice."
                stars={5}
              />
              <WorkflowCard
                title="Multi-Format HDR Delivery"
                description="Generate once in HDR, intelligently reframe to ALL platforms—21:9 cinema, 9:16 vertical, 1:1 square, and more. All formats maintain 16-bit HDR quality. 60-75% cost savings."
                stars={5}
              />
              <WorkflowCard
                title="Native HDR Generation"
                description="Generate cinema-grade 16-bit HDR video directly from text or images. Export as EXR frame sequence for professional color grading in DaVinci Resolve."
                stars={4}
              />
              <WorkflowCard
                title="EXR Export (Professional)"
                description="Export any video as 16-bit EXR frame sequence for professional color grading. Industry-standard ACES2065-1 color space. The professional finishing workflow."
                stars={4}
              />
              <WorkflowCard
                title="Draft to HDR Master"
                description="Iterate fast with Draft Mode (5x cheaper), then master your best shots to 4K HDR. Perfect for rapid exploration with professional delivery. Coming soon - Phase 2."
                stars={5}
              />
                  </div>
                  <div className="mt-6 p-4 bg-gradient-to-r from-[#DC143C]/10 to-purple-600/10 rounded-lg border border-[#DC143C]/20">
                    <div className="text-sm font-semibold mb-2 text-[#DC143C]">🏆 Competitive Advantage:</div>
                    <div className="text-xs space-y-1 opacity-80">
                      <div>✅ <strong>ONLY platform with HDR support</strong> - No competitor offers this</div>
                      <div>✅ <strong>21:9 Cinema + HDR + EXR</strong> - Complete professional pipeline</div>
                      <div>✅ <strong>SDR → HDR Upgrade</strong> - Transform videos from ANY source</div>
                      <div>✅ <strong>Film Festival Ready</strong> - 16-bit ACES2065-1 color space</div>
                      <div>✅ <strong>DaVinci Resolve Integration</strong> - Industry-standard workflow</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hybrid & Transformation */}
              <div className="collapse collapse-arrow bg-base-200">
                <input type="radio" name="workflow-category" />
                <div className="collapse-title text-lg font-semibold">
                  🔄 Hybrid & Transformation <span className="text-sm opacity-70">(7 workflows)</span>
                </div>
                <div className="collapse-content">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <WorkflowCard
                title="Action Director"
                description="Create multi-angle action sequences with guaranteed character consistency. Automatically generates master shots, close-ups, and reaction angles for dynamic, professional action scenes."
                stars={5}
                helpLink="/help/advanced/multi-shot-scenes"
              />
              <WorkflowCard
                title="Reality-to-Toon"
                description="Transform live-action reference footage into any animated style while preserving motion, timing, and performance. Revolutionary for creators who want animation without traditional animation skills."
                stars={5}
              />
              <WorkflowCard
                title="Style Chameleon"
                description="Generate the same scene across multiple artistic styles simultaneously. Perfect for client presentations, creative exploration, and finding the perfect visual direction for your project."
                stars={5}
              />
              <WorkflowCard
                title="Reverse Action Builder"
                description="Create action sequences designed to play in reverse. Generates physics-accurate motion that looks intentional when reversed—perfect for dramatic effect and time-manipulation narratives."
                stars={4}
              />
              <WorkflowCard
                title="Bidirectional Storytelling"
                description="Scenes that work perfectly playing forward or backward. Used for loop-based content, time-travel narratives, or artistic reversals. Mathematically perfect symmetry."
                stars={5}
              />
              <WorkflowCard
                title="Voice Actor Match"
                description="Generate character dialogue with perfect lip-sync, facial animation, and emotional performance. Sync any audio track to your characters with frame-perfect accuracy."
                stars={5}
                helpLink="/help/advanced/dialogue-generation"
              />
              <WorkflowCard
                title="Production Pipeline"
                description="Complete end-to-end workflow from script breakdown to final edit. Automated scene generation, coverage, and assembly for maximum production efficiency."
                stars={5}
              />
                  </div>
                </div>
              </div>

              {/* Photorealistic */}
              <div className="collapse collapse-arrow bg-base-200">
                <input type="radio" name="workflow-category" />
                <div className="collapse-title text-lg font-semibold">
                  🎥 Photorealistic / Live-Action <span className="text-sm opacity-70">(6 workflows)</span>
                </div>
                <div className="collapse-content">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <WorkflowCard
                title="Hollywood Standard"
                description="The gold standard for professional video production. Multi-step processing delivers cinema-grade quality that rivals traditional film production—at a fraction of the cost."
                stars={5}
              />
              <WorkflowCard
                title="Budget Photorealistic"
                description="Fast and affordable photorealistic generation optimized for speed and cost efficiency. Still delivers impressive quality—perfect for rapid prototyping, social media content, and high-volume production."
                stars={4}
              />
              <WorkflowCard
                title="Multi-Platform Hero"
                description="Generate once, optimize for all platforms automatically. Intelligent reframing for YouTube (16:9), TikTok (9:16), Instagram (1:1), and more. Maximum reach with minimum effort."
                stars={5}
              />
              <WorkflowCard
                title="Precision Poser"
                description="Control exact character positioning using keyframe-based pose guidance. Perfect for matching specific choreography, dance moves, or reference footage with frame-perfect accuracy."
                stars={4}
              />
              <WorkflowCard
                title="Cinematic Camera Suite"
                description="Professional camera movements including dollies, crane shots, tracking moves, and complex camera choreography. Hollywood-grade cinematography without the Hollywood crew."
                stars={5}
              />
              <WorkflowCard
                title="Scene Composer"
                description="Apply professional composition rules automatically: Rule of Thirds, Golden Ratio, leading lines, and balanced framing for visually compelling storytelling."
                stars={5}
              />
                  </div>
                </div>
              </div>

              {/* Production Tools */}
              <div className="collapse collapse-arrow bg-base-200">
                <input type="radio" name="workflow-category" />
                <div className="collapse-title text-lg font-semibold">
                  🎬 Production Tools <span className="text-sm opacity-70">(7 workflows)</span>
                </div>
                <div className="collapse-content">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <WorkflowCard
                title="Scene Bridge"
                description="Generate smooth transitions between two existing clips. AI analyzes both scenes to create a seamless bridge shot that connects them naturally—perfect for coverage gaps."
                stars={4}
              />
              <WorkflowCard
                title="Video Chain Builder"
                description="Chain multiple video clips together while maintaining consistent style, lighting, and atmosphere. Perfect for montages and sequences with unified visual language."
                stars={5}
              />
              <WorkflowCard
                title="Genre Camera Variants"
                description="Generate the same scene with different genre-specific camera work: horror (handheld shaky), comedy (bright steady), action (dynamic tracking), and more. Perfect for finding your style."
                stars={5}
              />
              <WorkflowCard
                title="Shot Type Variants"
                description="Automatically generate multiple shot types from one scene: wide establishing, medium coverage, close-ups, and inserts. Complete professional coverage from a single prompt."
                stars={5}
                helpLink="/help/advanced/multi-shot-scenes"
              />
              <WorkflowCard
                title="B-Roll Master"
                description="Generate professional B-roll footage: establishing shots, cutaways, environmental details, and atmospheric footage to enhance your main narrative. Essential for documentary-style content."
                stars={5}
              />
              <WorkflowCard
                title="Coverage Master"
                description="Complete scene coverage workflow: generates master shot, over-the-shoulder angles, close-ups, and reaction shots. TV/film production standard coverage automatically."
                stars={5}
                helpLink="/help/advanced/multi-shot-scenes"
              />
              <WorkflowCard
                title="Scene Variants"
                description="Generate multiple variations of the same scene with different lighting conditions, time of day, weather, or mood. Perfect for client options, A/B testing, or creative exploration."
                stars={4}
              />
                  </div>
                </div>
              </div>

              {/* Dialogue Workflows */}
              <div className="collapse collapse-arrow bg-base-200">
                <input type="radio" name="workflow-category" />
                <div className="collapse-title text-lg font-semibold">
                  💬 Dialogue & Conversation <span className="text-sm opacity-70">(2 workflows)</span>
                </div>
                <div className="collapse-content">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <WorkflowCard
                title="Standard Dialogue Generation"
                description="Generate AI-powered character dialogue with video, voice synthesis, and perfectly synced lip animation. Supports 4-8 second clips with emotion control."
                stars={5}
                credits="400 credits"
                helpLink="/help/advanced/dialogue-generation"
              />
              <WorkflowCard
                title="Extended & Cinema Dialogue"
                description="Longer dialogue clips (4-12 seconds) with cinema format (21:9) support. Perfect for dramatic scenes, monologues, and extended conversations."
                stars={5}
                credits="450-750 credits"
                helpLink="/help/advanced/dialogue-generation"
              />
                  </div>
                </div>
              </div>

              {/* Animals & Creatures */}
              <div className="collapse collapse-arrow bg-base-200">
                <input type="radio" name="workflow-category" />
                <div className="collapse-title text-lg font-semibold">
                  🦁 Animals & Creatures <span className="text-sm opacity-70">(2 workflows)</span>
                </div>
                <div className="collapse-content">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <WorkflowCard
                title="Animal Kingdom"
                description="Realistic animal characters with accurate anatomy, natural behaviors, and lifelike movements. From domestic pets to wildlife—documentary-quality animal footage with complete control."
                stars={5}
              />
              <WorkflowCard
                title="Anthro Character"
                description="Anthropomorphic animal characters with expressive faces and human-like gestures. Talking animals perfect for animated storytelling, mascots, and character-driven narratives."
                stars={5}
                helpLink="/help/advanced/character-consistency"
              />
                  </div>
                </div>
              </div>

              {/* Fantasy & VFX */}
              <div className="collapse collapse-arrow bg-base-200">
                <input type="radio" name="workflow-category" />
                <div className="collapse-title text-lg font-semibold">
                  ✨ Fantasy & VFX <span className="text-sm opacity-70">(2 workflows)</span>
                </div>
                <div className="collapse-content">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <WorkflowCard
                title="Fantasy Epic"
                description="Create immersive fantasy worlds with mythical creatures, magical effects, and otherworldly environments. Includes particle effects, atmospheric lighting, and epic scale for world-building."
                stars={5}
              />
              <WorkflowCard
                title="Superhero Transform"
                description="Dramatic transformation sequences with power effects, energy auras, costume changes, and heroic poses. Perfect for action content, superhero stories, and dramatic character reveals."
                stars={5}
              />
                  </div>
                </div>
              </div>

              {/* Animated */}
              <div className="collapse collapse-arrow bg-base-200">
                <input type="radio" name="workflow-category" />
                <div className="collapse-title text-lg font-semibold">
                  🎨 Animated Styles <span className="text-sm opacity-70">(3 workflows)</span>
                </div>
                <div className="collapse-content">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <WorkflowCard
                title="Anime Master"
                description="Authentic anime-style generation with consistent art direction, proper shading techniques, and maintained character features across all scenes. Perfect for anime creators and storytellers."
                stars={5}
              />
              <WorkflowCard
                title="Cartoon Classic"
                description="Western cartoon aesthetics with exaggerated expressions, squash-and-stretch animation principles, and vibrant color palettes. Perfect for comedy, family content, and animated storytelling."
                stars={5}
              />
              <WorkflowCard
                title="3D Character"
                description="High-quality 3D animated characters with professional lighting, realistic materials, and premium rendering. Industry-grade 3D animation for professional animated content."
                stars={5}
              />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Compositions & Transitions */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">🎨 Compositions & Transitions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title">65 Professional Compositions</h3>
                <ul className="text-sm space-y-1">
                  <li>• 38 Static Layouts (split screens, PIP, grids)</li>
                  <li>• 21 Audio-Enabled Layouts (spatial audio, auto-ducking, 5.1 surround, Dolby Atmos)</li>
                  <li>• 6 Animated Compositions (motion graphics, dynamic transitions)</li>
                  <li>• Professional color grading & cinematic looks</li>
                </ul>
                <div className="badge badge-success">FREE</div>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title">30 Hollywood Transitions</h3>
                <ul className="text-sm space-y-1">
                  <li>• Whip pans & camera swipes</li>
                  <li>• Glitch effects & digital transitions</li>
                  <li>• Vintage film burns & light leaks</li>
                  <li>• Professional crossfades & dissolves</li>
                </ul>
                <div className="badge badge-success">FREE</div>
              </div>
            </div>
          </div>
        </section>

        {/* Advanced Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">🚀 Advanced Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              title="Smart Quality Optimization"
              description="Automatic quality and cost optimization based on your project needs"
              free={true}
            />
            <FeatureCard
              title="GitHub Integration"
              description="Version control for screenplays & timelines - we streamlined GitHub for writers"
              free={true}
            />
            <FeatureCard
              title="Asset Management"
              description="Organize all user assets in beautiful folder structures in Drive/Dropbox"
              free={true}
            />
            <FeatureCard
              title="Export System"
              description="Multiple formats, GPU-accelerated rendering, quality presets, batch export"
              free={true}
            />
            <FeatureCard
              title="Collaboration Tools"
              description="6 role-based permissions, real-time collaboration, activity tracking"
              free={true}
            />
            <FeatureCard
              title="Credit Management"
              description="Simple credit-based billing (1 credit = $0.01), subscription management, usage tracking"
              free={true}
            />
          </div>
        </section>

        {/* NEW: Data Ownership & Collaboration Section */}
        <section className="mb-16">
          <div className="bg-gradient-to-br from-base-200 to-base-300 rounded-box p-8 md:p-12">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold mb-4">🔐 Your Work, Your Control</h2>
              <p className="text-xl opacity-90 max-w-3xl mx-auto">
                Unlike other platforms that lock your content behind proprietary formats,
                <strong className="text-[#DC143C]"> YOU own everything</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* GitHub for Scripts & Timelines */}
              <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <div className="text-4xl mb-3">📚</div>
                  <h3 className="card-title text-xl">GitHub Version Control</h3>
                  <p className="text-sm opacity-80 mb-4">
                    Screenplay structure + Timeline edits backed up to YOUR GitHub repository every 10 seconds.
                    Full edit history, branch management, revert anytime.
                  </p>
                  <ul className="text-xs opacity-70 space-y-1">
                    <li>✅ Auto-save every 10 seconds</li>
                    <li>✅ Complete Git version history</li>
                    <li>✅ Plain JSON format (future-proof)</li>
                    <li>✅ Open format, zero lock-in</li>
                  </ul>
                </div>
              </div>

              {/* Google Drive & Dropbox for Media */}
              <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <div className="text-4xl mb-3">☁️</div>
                  <h3 className="card-title text-xl">Your Cloud Storage</h3>
                  <p className="text-sm opacity-80 mb-4">
                    Videos, audio, images stored in YOUR Google Drive or Dropbox.
                    We store files for 7 days max, then YOU decide where they go.
                  </p>
                  <ul className="text-xs opacity-70 space-y-1">
                    <li>✅ Choose Google Drive or Dropbox</li>
                    <li>✅ 100% off-site storage (your account)</li>
                    <li>✅ No files locked on our servers</li>
                    <li>✅ Export anytime, switch tools anytime</li>
                  </ul>
                </div>
              </div>

              {/* Collaboration Roles */}
              <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <div className="text-4xl mb-3">👥</div>
                  <h3 className="card-title text-xl">6 Collaboration Roles</h3>
                  <p className="text-sm opacity-80 mb-4">
                    Manage everything from the software - no GitHub expertise needed.
                    We streamlined GitHub for writers.
                  </p>
                  <ul className="text-xs opacity-70 space-y-1">
                    <li>🎬 <strong>Director</strong> - Full access (script + assets)</li>
                    <li>✍️ <strong>Writer</strong> - Edit screenplay + timeline</li>
                    <li>🎨 <strong>Contributor</strong> - Manage assets only</li>
                    <li>👁️ <strong>Viewer</strong> - Read-only access</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Wryda</th>
                    <th>Premiere Pro</th>
                    <th>Final Cut</th>
                    <th>DaVinci</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Auto-save frequency</strong></td>
                    <td className="text-green-600 font-semibold">10 seconds</td>
                    <td>5-20 minutes</td>
                    <td>15 minutes</td>
                    <td>Manual</td>
                  </tr>
                  <tr>
                    <td><strong>Version control</strong></td>
                    <td className="text-green-600 font-semibold">GitHub (yours)</td>
                    <td>Limited</td>
                    <td>Time Machine</td>
                    <td>Manual</td>
                  </tr>
                  <tr>
                    <td><strong>Timeline format</strong></td>
                    <td className="text-green-600 font-semibold">Open JSON</td>
                    <td>Proprietary</td>
                    <td>Proprietary</td>
                    <td>Proprietary</td>
                  </tr>
                  <tr>
                    <td><strong>Media storage</strong></td>
                    <td className="text-green-600 font-semibold">Your Drive/Dropbox</td>
                    <td>Your drive</td>
                    <td>Your drive</td>
                    <td>Your drive</td>
                  </tr>
                  <tr>
                    <td><strong>Collaboration roles</strong></td>
                    <td className="text-green-600 font-semibold">6 roles</td>
                    <td>Limited</td>
                    <td>Limited</td>
                    <td>Limited</td>
                  </tr>
                  <tr>
                    <td><strong>Export freedom</strong></td>
                    <td className="text-green-600 font-semibold">Anytime</td>
                    <td>Limited</td>
                    <td>Limited</td>
                    <td>Limited</td>
                  </tr>
                  <tr>
                    <td><strong>Ownership</strong></td>
                    <td className="text-green-600 font-semibold">100% yours</td>
                    <td>Project files</td>
                    <td>Library files</td>
                    <td>Database</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-center mt-8">
              <p className="text-lg font-semibold mb-4">
                💡 <strong>We streamlined GitHub for writers</strong> - manage everything from the software, no GitHub expertise needed
              </p>
              <Link href="/team" className="btn btn-primary">
                Learn More About Collaboration →
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-16 bg-base-200 rounded-box">
          <h2 className="text-3xl font-bold mb-4">Ready to Create?</h2>
          <p className="text-lg opacity-80 mb-8">
            Sign up for free and get 100 credits to start. All features unlocked from day one.
          </p>
          <Link href="/dashboard" className="btn btn-primary btn-lg">
            Start Free (100 Credits)
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z" clipRule="evenodd" />
            </svg>
          </Link>
        </section>
      </main>
    </>
  );
}

function FeatureCard({ title, description, free, credits, note }) {
  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h3 className="card-title text-lg">{title}</h3>
        <p className="text-sm opacity-80">{description}</p>
        {note && <p className="text-xs opacity-60 italic">{note}</p>}
        <div className="card-actions justify-end mt-2">
          {free ? (
            <div className="badge badge-success">FREE</div>
          ) : (
            <div className="badge badge-primary">{credits}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function WorkflowCard({ title, description, stars, credits, helpLink }) {
  const CardContent = (
    <div className="card-body p-4">
      <div className="flex justify-between items-start">
        <h4 className="font-semibold text-sm">{title}</h4>
        <div className="text-yellow-500 text-xs">
          {"⭐".repeat(stars)}
        </div>
      </div>
      <p className="text-xs opacity-70">{description}</p>
      {credits && (
        <div className="text-xs text-primary font-semibold mt-1">{credits}</div>
      )}
      {helpLink && (
        <div className="text-xs text-[#DC143C] mt-2 hover:underline">
          Learn more →
        </div>
      )}
    </div>
  );

  if (helpLink) {
    return (
      <Link href={helpLink} className="card bg-base-100 border border-base-300 hover:border-primary transition-colors">
        {CardContent}
      </Link>
    );
  }

  return (
    <div className="card bg-base-100 border border-base-300">
      {CardContent}
    </div>
  );
}

