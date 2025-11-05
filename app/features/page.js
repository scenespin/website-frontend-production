import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Complete Features | ${config.appName}`,
  description: "Explore all 58 AI workflows including professional studio export, professional screenplay writing tools, multi-track timeline editor, Hollywood transitions & compositions, and more. Everything unlocked from day one.",
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
            <strong>85+ features. 58 AI workflows. All unlocked from day one.</strong>
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
              <div className="text-4xl font-bold text-[#DC143C]">85+</div>
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
              title="Character & Location Bank"
              description="FREE library management for characters and locations. Organize reference images, track consistency scores, manage your asset library. Generating new characters/locations costs credits, but the bank itself is 100% free to use."
              free={true}
              note="(Library FREE - generation costs credits)"
            />
            <FeatureCard
              title="🎨 Asset Bank - Digital Prop Department (NEW!)"
              description="Scan any real-world object once (props, vehicles, furniture) → Use in unlimited scenes with perfect consistency. Generate photorealistic 3D models (GLB/OBJ/USDZ) for games, AR, and video. Never worry about inconsistent props again."
              free={false}
              credits="30 credits per prop, 70 credits per vehicle/furniture"
              highlight={true}
            />
            <FeatureCard
              title="Custom Voice-Overs (ElevenLabs Integration)"
              description="Connect your ElevenLabs account to add custom narration and voice-overs using your cloned voices. Perfect for tutorials, documentaries, and background narration."
              free={true}
              note="(FREE integration - bring your own ElevenLabs API key)"
            />
            <FeatureCard
              title="Character Dialogue & Lip-Sync (AI Workflows)"
              description="Generate characters speaking with perfect lip-sync and facial animation. Upload any audio (including your ElevenLabs cloned voices), and get fully animated talking characters."
              free={false}
              credits="400+ credits per scene"
            />
            <FeatureCard
              title="3D Model Export for Games & AR"
              description="Export your generated characters, locations, and props as 3D models (GLB/OBJ/USDZ) for Unity, Unreal Engine, or AR. The export feature is FREE - you only pay for generating the original assets. Turn your screenplay into a complete digital asset library."
              free={true}
              note="(Export FREE - you pay only for asset generation)"
            />
            <FeatureCard
              title="Cloud Storage Integration"
              description="Export to PDF or Fountain format, GitHub version control with hierarchical folder structure, no vendor lock-in"
              free={true}
            />
            <FeatureCard
              title="🎥 Upload Your Own Footage - 100% FREE Forever"
              description="Replace your entire software stack for $0. Upload MP4, MOV, WebM, MKV in ANY resolution (4K, 8K, RED camera footage, DaVinci exports). Mix with AI, apply Hollywood transitions, export pro-quality renders. PLUS: Enhance uploaded footage with AI - add weather effects (rain, snow), change lighting (day/night), style transfer, color matching to make everything cohesive. Only pay for AI enhancements & final export—never for uploading or editing your own footage."
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
            <div className="card bg-gradient-to-br from-[#DC143C]/10 to-[#B01030]/10 border-2 border-[#DC143C]/30">
              <div className="card-body">
                <h3 className="text-xl font-bold text-[#DC143C] mb-3">🔄 Round-Trip Editing</h3>
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

            <div className="card bg-gradient-to-br from-[#DC143C]/10 to-[#B01030]/10 border-2 border-[#DC143C]/30">
              <div className="card-body">
                <h3 className="text-xl font-bold text-[#DC143C] mb-3">✂️ Edge Trimming & Precision Editing</h3>
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
                  Apply cinematic color grades directly on timeline. Preview in real-time, no render needed. Includes built-in Wryda signature look.
                </p>
                <ul className="text-sm space-y-2 opacity-80">
                  <li>✅ One-click color grade application to any clip</li>
                  <li>✅ Real-time preview before applying</li>
                  <li>✅ Auto-apply Wryda color grade to imported clips (optional)</li>
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
                <h3 className="text-xl font-bold text-pink-400 mb-3">🎬 Professional Studio Export</h3>
                <p className="text-sm opacity-90 mb-3">
                  Export your timeline as 16-bit HDR EXR for professional color grading in DaVinci Resolve, After Effects, or Nuke. Perfect for agencies and studios.
                </p>
                <ul className="text-sm space-y-2 opacity-80">
                  <li>✅ 16-bit HDR (ACES2065-1 color space)</li>
                  <li>✅ Hollywood VFX pipeline compatible</li>
                  <li>✅ Unlimited grading headroom</li>
                  <li>✅ Perfect for client deliverables</li>
                </ul>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border-2 border-cyan-500/30">
              <div className="card-body">
                <h3 className="text-xl font-bold text-cyan-400 mb-3">⚡ Speed Control & Reverse</h3>
                <p className="text-sm opacity-90 mb-3">
                  Professional speed ramping and reverse playback. Create slow-motion, timelapse, or reverse effects with one click.
                </p>
                <ul className="text-sm space-y-2 opacity-80">
                  <li>✅ Speed control: 0.25x - 4x (slow-mo to timelapse)</li>
                  <li>✅ Reverse playback with one click</li>
                  <li>✅ Live preview mode (browser-native)</li>
                  <li>✅ Timeline indicators show speed & direction</li>
                </ul>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-[#DC143C]/10 to-[#B01030]/10 border-2 border-[#DC143C]/30">
              <div className="card-body">
                <h3 className="text-xl font-bold text-[#DC143C] mb-3">📝 Text & Title Overlays</h3>
                <p className="text-sm opacity-90 mb-3">
                  Add professional titles, captions, and lower thirds. 9 fonts, full styling control, outline/shadow effects, and 9 position presets.
                </p>
                <ul className="text-sm space-y-2 opacity-80">
                  <li>✅ 9 professional fonts (Arial to Impact)</li>
                  <li>✅ Full typography control (size 12-200px, bold, italic)</li>
                  <li>✅ Outline & shadow effects</li>
                  <li>✅ 9 position presets + custom positioning</li>
                </ul>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-violet-500/10 to-violet-600/10 border-2 border-violet-500/30">
              <div className="card-body">
                <h3 className="text-xl font-bold text-violet-400 mb-3">✨ Text Animations (NEW!)</h3>
                <p className="text-sm opacity-90 mb-3">
                  Hollywood-style text animations that rival Premiere Pro. Fade, slide, and scale effects with professional easing curves.
                </p>
                <ul className="text-sm space-y-2 opacity-80">
                  <li>✅ Fade In/Out (4 easing options)</li>
                  <li>✅ Slide In/Out (4 directions)</li>
                  <li>✅ Scale In/Out (includes bounce effect!)</li>
                  <li>✅ Color-coded timeline indicators</li>
                </ul>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-fuchsia-500/10 to-fuchsia-600/10 border-2 border-fuchsia-500/30">
              <div className="card-body">
                <h3 className="text-xl font-bold text-fuchsia-400 mb-3">🎨 Text Templates (NEW!)</h3>
                <p className="text-sm opacity-90 mb-3">
                  12 professional text templates across 4 categories. One-click styling for YouTube, Instagram, corporate videos, and more.
                </p>
                <ul className="text-sm space-y-2 opacity-80">
                  <li>✅ 12 professional templates</li>
                  <li>✅ 4 categories: Social, Corporate, Cinematic, Education</li>
                  <li>✅ Template browser with search & filtering</li>
                  <li>✅ One-click application with customization</li>
                </ul>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-2 border-orange-500/30">
              <div className="card-body">
                <h3 className="text-xl font-bold text-orange-400 mb-3">🎭 Visual Effects & Filters</h3>
                <p className="text-sm opacity-90 mb-3">
                  Advanced color correction and visual effects. Adjust brightness, contrast, saturation, temperature, blur, sharpen, vignette, and grain.
                </p>
                <ul className="text-sm space-y-2 opacity-80">
                  <li>✅ Color correction: Brightness, contrast, saturation</li>
                  <li>✅ Temperature & tint control</li>
                  <li>✅ Effects: Blur, sharpen, vignette, film grain</li>
                  <li>✅ Real-time sliders with live preview</li>
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
                <strong>Unique Value:</strong> Complete production pipeline from script to final export. Generate videos with AI, edit professionally on timeline, apply professional color grading, and export with optional 16-bit HDR for post-production - all in one platform.
              </p>
            </div>
          </div>
        </section>

        {/* 58 AI Workflows */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">⚡ 58 AI Workflows</h2>
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
            <h3 className="text-xl font-semibold mb-4">📂 Browse All 58 Workflows:</h3>
            <Link href="/help/workflows" className="card bg-gradient-to-br from-blue-500/10 to-purple-600/10 border-2 border-blue-500/30 hover:border-blue-500 transition-colors block">
              <div className="card-body p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold mb-2">🚀 View Complete Workflow Directory</div>
                    <div className="text-sm opacity-70">58 professional workflows organized by category with full details, costs, and step-by-step guides</div>
                  </div>
                  <div className="text-4xl">→</div>
                </div>
              </div>
            </Link>
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
                  <li>• Frame-accurate clip trimming within compositions</li>
                  <li>• Adjust clip lengths, start/end times on the fly</li>
                  <li>• Full audio mixing & sync controls</li>
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
              description="5 role-based permissions with automatic GitHub + cloud storage sync. Real-time collaboration and activity tracking across all platforms."
              free={true}
            />
            <FeatureCard
              title="Credit Management"
              description="Simple credit-based billing (1 credit = $0.01), subscription management, usage tracking"
              free={false}
              credits="Pay as you go"
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
                  <h3 className="card-title text-xl">5 Collaboration Roles</h3>
                  <p className="text-sm opacity-80 mb-4">
                    Manage everything from the software - no GitHub expertise needed.
                    Permissions sync automatically across GitHub + your cloud storage.
                  </p>
                  <ul className="text-xs opacity-70 space-y-1">
                    <li>🎬 <strong>Director</strong> - Full access (script + assets)</li>
                    <li>✍️ <strong>Writer</strong> - Edit screenplay + AI agents</li>
                    <li>🎬 <strong>Asset Manager</strong> - Generate & manage assets</li>
                    <li>🎨 <strong>Contributor</strong> - Upload assets only</li>
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
                    <td className="text-green-600 font-semibold">5 roles</td>
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
              <Link href="/help/collaboration" className="btn btn-primary">
                Learn More About Collaboration →
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-16 bg-base-200 rounded-box">
          <h2 className="text-3xl font-bold mb-4">Ready to Create?</h2>
          <p className="text-lg opacity-80 mb-8">
            Sign up for free and get 50 credits to start. All features unlocked from day one.
          </p>
          <Link href="/dashboard" className="btn btn-primary btn-lg">
            Start Free (50 Credits)
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

