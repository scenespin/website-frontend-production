import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `AI Workflows Guide | ${config.appName}`,
  description: "Use 58 pre-built professional workflows for instant content creation. Character consistency guaranteed, organized by what you have: text, images, or video.",
  canonicalUrlRelative: "/help/workflows",
});

export default function WorkflowsPage() {
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
          <Link href="/help" className="btn btn-ghost btn-sm">← Help Center</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-16">
        {/* Breadcrumb */}
        <div className="text-sm breadcrumbs mb-6">
          <ul>
            <li><Link href="/help">Help Center</Link></li>
            <li>Core Features</li>
            <li className="font-semibold">Workflows</li>
          </ul>
        </div>

        {/* Article */}
        <article className="prose prose-lg max-w-none">
          <h1>AI Workflows Guide 🎭</h1>

          <h2>What are Workflows?</h2>
          <p>Pre-configured, multi-step processes that guide you through complex video production tasks. Think of workflows as professional production templates that ensure consistent quality, character consistency, and efficient credit usage.</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 not-prose my-8">
            <div className="card bg-base-200 text-center">
              <div className="card-body p-4">
                <div className="text-3xl">📋</div>
                <div className="text-sm font-bold">Production templates</div>
              </div>
            </div>
            <div className="card bg-base-200 text-center">
              <div className="card-body p-4">
                <div className="text-3xl">🧑‍🍳</div>
                <div className="text-sm font-bold">Guided recipes</div>
              </div>
            </div>
            <div className="card bg-base-200 text-center">
              <div className="card-body p-4">
                <div className="text-3xl">⚡</div>
                <div className="text-sm font-bold">Professional shortcuts</div>
              </div>
            </div>
            <div className="card bg-base-200 text-center">
              <div className="card-body p-4">
                <div className="text-3xl">✅</div>
                <div className="text-sm font-bold">Quality assurance</div>
              </div>
            </div>
          </div>

          <h2>How Workflows are Organized (58 Total)</h2>
          <p>We&apos;ve organized all 58 workflows based on <strong>what you have right now</strong>. This makes it easy to find the perfect workflow for your current situation.</p>
          
          <div className="alert alert-success my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <div className="font-bold">✅ Complete Workflow Catalog</div>
              <div className="text-sm">Text-Only (18) + Text+Images (14) + Video Transform (15) + Post-Production HDR (7) + Video Enhancement (5) - 1 (Complete Scene counted in Production) = <strong>58 total workflows</strong></div>
            </div>
          </div>

          <div className="alert alert-info my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <div className="font-bold">New User? Start Here!</div>
              <div className="text-sm">If you&apos;re just starting, use <strong>Text-Only</strong> workflows. No images or video needed—just write a description and generate!</div>
            </div>
          </div>

          <h3>🎯 Three-Tier Organization System</h3>

          {/* Tier 1: Text-Only */}
          <div className="card bg-gradient-to-br from-green-500/10 to-green-600/10 border-2 border-green-500/30 my-8 not-prose">
            <div className="card-body">
              <h3 className="card-title text-2xl">
                <span className="text-green-500">📝 Text-Only (18 workflows)</span>
              </h3>
              <p className="text-sm opacity-90 mb-4">
                <strong>Perfect for beginners.</strong> Just write what you want—no images or video required. You can optionally add Character Bank images later for consistency across multiple generations.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-base-100 rounded-lg p-4">
                  <div className="text-xs font-bold text-green-500 mb-2">✨ HOW IT WORKS:</div>
                  <ul className="text-sm space-y-1">
                    <li>✅ Describe your scene in text</li>
                    <li>✅ Generate your first video</li>
                    <li>💡 <em>Optional:</em> Add 1-2 Character Bank images for future consistency</li>
                  </ul>
                </div>
                <div className="bg-base-100 rounded-lg p-4">
                  <div className="text-xs font-bold text-green-500 mb-2">🎯 PERFECT FOR:</div>
                  <ul className="text-sm space-y-1">
                    <li>• Testing concepts quickly</li>
                    <li>• Beginners with no assets</li>
                    <li>• One-off content</li>
                    <li>• Rapid prototyping</li>
                  </ul>
                </div>
              </div>
              <div className="divider my-2"></div>
              <div className="text-xs opacity-70">
                <strong>Examples:</strong> Hollywood Standard, Speed Demon, Anime Master, Perfect Loop Generator, B-Roll Master, and 13 more
              </div>
            </div>
          </div>

          {/* Tier 2: Text + Images */}
          <div className="card bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-2 border-orange-500/30 my-8 not-prose">
            <div className="card-body">
              <h3 className="card-title text-2xl">
                <span className="text-orange-500">🖼️ Text + Images (14 workflows)</span>
              </h3>
              <p className="text-sm opacity-90 mb-4">
                <strong>For series and recurring characters.</strong> These workflows require 1-2 character images from the start. Perfect when you need guaranteed character consistency across all your content.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-base-100 rounded-lg p-4">
                  <div className="text-xs font-bold text-orange-500 mb-2">⚠️ REQUIRED INPUTS:</div>
                  <ul className="text-sm space-y-1">
                    <li>✅ Text description of the scene</li>
                    <li>✅ 1-2 character reference images</li>
                    <li>✅ Character Bank integration</li>
                  </ul>
                </div>
                <div className="bg-base-100 rounded-lg p-4">
                  <div className="text-xs font-bold text-orange-500 mb-2">🎯 PERFECT FOR:</div>
                  <ul className="text-sm space-y-1">
                    <li>• Series with recurring characters</li>
                    <li>• Brand mascots</li>
                    <li>• Character-driven stories</li>
                    <li>• Multi-episode content</li>
                  </ul>
                </div>
              </div>
              <div className="divider my-2"></div>
              <div className="text-xs opacity-70">
                <strong>Examples:</strong> Coverage Master, Shot Type Variants, Genre Camera Variants, Scene Variants, Video Chain Builder, and 9 more
              </div>
            </div>
          </div>

          {/* Tier 3: Video Transform */}
          <div className="card bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-2 border-purple-500/30 my-8 not-prose">
            <div className="card-body">
              <h3 className="card-title text-2xl">
                <span className="text-purple-500">🎬 Video Transform (15 workflows)</span>
              </h3>
              <p className="text-sm opacity-90 mb-4">
                <strong>Transform existing video footage.</strong> Upload your own video and transform it with AI: add VFX, change styles, remove objects, or capture your performance.
              </p>
              
              <div className="text-xs font-bold text-purple-500 mb-2">TWO TYPES:</div>
              
              {/* Video Enhancement */}
              <div className="bg-base-100 rounded-lg p-4 mb-3">
                <div className="font-bold text-sm mb-2">✨ Video Enhancement (5 workflows)</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs opacity-70 mb-1">Enhance existing footage:</div>
                    <ul className="text-xs space-y-1">
                      <li>• VFX Magic (add effects)</li>
                      <li>• Scene Transformer (change environment)</li>
                      <li>• Element Eraser (remove objects)</li>
                    </ul>
                  </div>
                  <div>
                    <ul className="text-xs space-y-1">
                      <li>• Product Reshoot (transform products)</li>
                      <li>• Still Photo Performer (animate photos)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Production Tools */}
              <div className="bg-base-100 rounded-lg p-4 mb-3">
                <div className="font-bold text-sm mb-2">🛠️ Production Tools (2 workflows)</div>
                <div className="text-xs opacity-70 mb-1">Connect and chain clips:</div>
                <ul className="text-xs space-y-1">
                  <li>• Scene Bridge (connect clips seamlessly)</li>
                  <li>• Video Chain Builder (multi-clip sequences)</li>
                </ul>
              </div>

              {/* Performance Capture */}
              <div className="bg-base-100 rounded-lg p-4">
                <div className="font-bold text-sm mb-2">🎭 Performance Capture (8 workflows)</div>
                <div className="text-xs opacity-70 mb-2">&quot;Be the Character&quot; - Film yourself, AI transforms your performance</div>
                <ul className="text-xs space-y-1">
                  <li>• Anime Performance Capture</li>
                  <li>• 3D Performance Capture</li>
                  <li>• Cartoon Performance Capture</li>
                  <li>• Anthro Performance Capture</li>
                  <li>• Action Director Performance</li>
                  <li>• Reality-to-Toon Performance</li>
                  <li>• Complete Scene Performance</li>
                  <li>• Production Pipeline Performance</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* NEW: Featured Workflows - Most Viral & Sellable */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-2">🔥 Featured Workflows</h2>
            <p className="text-sm opacity-70 mb-6">Our most popular and viral workflows - highest demand and sellability</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Multilingual Dubbing - #1 Viral */}
              <Link href="/help/workflows/multilingual-dubbing" className="card bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-2 border-purple-500/30 hover:border-purple-500 transition-all">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <h3 className="card-title text-lg">Multilingual Dubbing</h3>
                    <div className="badge badge-accent badge-sm">NEW</div>
                  </div>
                  <p className="text-xs opacity-80">One video → 20+ languages with lip-sync. Scale globally without re-recording.</p>
                  <div className="flex gap-2 mt-2">
                    <div className="badge badge-sm">100-2000 credits</div>
                    <div className="badge badge-sm">2-30 min</div>
                  </div>
                  <div className="card-actions justify-end mt-2">
                    <span className="text-xs font-bold text-purple-500">View Details →</span>
                  </div>
                </div>
              </Link>

              {/* Complete Scene - Foundation */}
              <Link href="/help/workflows/complete-scene" className="card bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-2 border-orange-500/30 hover:border-orange-500 transition-all">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <h3 className="card-title text-lg">Complete Scene</h3>
                    <div className="badge badge-sm">⭐ 100</div>
                  </div>
                  <p className="text-xs opacity-80">Master shot + character/product coverage. Foundation of Scene Builder.</p>
                  <div className="flex gap-2 mt-2">
                    <div className="badge badge-sm">145-689 credits</div>
                    <div className="badge badge-sm">8-15 min</div>
                  </div>
                  <div className="card-actions justify-end mt-2">
                    <span className="text-xs font-bold text-orange-500">View Details →</span>
                  </div>
                </div>
              </Link>

              {/* Hollywood Standard */}
              <Link href="/help/workflows/hollywood-standard" className="card bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-2 border-blue-500/30 hover:border-blue-500 transition-all">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <h3 className="card-title text-lg">Hollywood Standard</h3>
                    <div className="badge badge-sm">⭐ 95</div>
                  </div>
                  <p className="text-xs opacity-80">Portrait + 8 angles + video + optional 4K. Maximum quality for feature films.</p>
                  <div className="flex gap-2 mt-2">
                    <div className="badge badge-sm">58-258 credits</div>
                    <div className="badge badge-sm">5-10 min</div>
                  </div>
                  <div className="card-actions justify-end mt-2">
                    <span className="text-xs font-bold text-blue-500">View Details →</span>
                  </div>
                </div>
              </Link>

              {/* SDR to HDR Upgrade */}
              <Link href="/help/workflows/sdr-to-hdr-upgrade" className="card bg-gradient-to-br from-pink-500/10 to-red-600/10 border-2 border-pink-500/30 hover:border-pink-500 transition-all">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <h3 className="card-title text-lg">SDR to HDR Upgrade</h3>
                    <div className="badge badge-accent badge-sm">NEW</div>
                  </div>
                  <p className="text-xs opacity-80">Upgrade ANY video to 16-bit HDR. Only platform with this feature!</p>
                  <div className="flex gap-2 mt-2">
                    <div className="badge badge-sm">100-200 credits</div>
                    <div className="badge badge-sm">3-5 min</div>
                  </div>
                  <div className="card-actions justify-end mt-2">
                    <span className="text-xs font-bold text-pink-500">View Details →</span>
                  </div>
                </div>
              </Link>

              {/* VFX Magic */}
              <Link href="/help/workflows/vfx-magic" className="card bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border-2 border-cyan-500/30 hover:border-cyan-500 transition-all">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <h3 className="card-title text-lg">VFX Magic</h3>
                    <div className="badge badge-accent badge-sm">NEW</div>
                  </div>
                  <p className="text-xs opacity-80">Add rain, fire, magic, powers to existing videos. Hollywood VFX instantly.</p>
                  <div className="flex gap-2 mt-2">
                    <div className="badge badge-sm">100-150 credits</div>
                    <div className="badge badge-sm">2-4 min</div>
                  </div>
                  <div className="card-actions justify-end mt-2">
                    <span className="text-xs font-bold text-cyan-500">View Details →</span>
                  </div>
                </div>
              </Link>

              {/* Fantasy Epic */}
              <Link href="/help/workflows/fantasy-epic" className="card bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 border-2 border-indigo-500/30 hover:border-indigo-500 transition-all">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <h3 className="card-title text-lg">Fantasy Epic</h3>
                    <div className="badge badge-sm">⭐ 93</div>
                  </div>
                  <p className="text-xs opacity-80">Dragons, monsters, magical beings with VFX. Multiple angles and action sequences.</p>
                  <div className="flex gap-2 mt-2">
                    <div className="badge badge-sm">200-500 credits</div>
                    <div className="badge badge-sm">4-8 min</div>
                  </div>
                  <div className="card-actions justify-end mt-2">
                    <span className="text-xs font-bold text-indigo-500">View Details →</span>
                  </div>
                </div>
              </Link>

              {/* Podcast to Video */}
              <Link href="/help/workflows/podcast-to-video" className="card bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-2 border-purple-500/30 hover:border-purple-500 transition-all">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <h3 className="card-title text-lg">Podcast to Video</h3>
                    <div className="badge badge-accent badge-sm">NEW</div>
                  </div>
                  <p className="text-xs opacity-80">Audio + host photo = YouTube video. Auto-splits long episodes for social.</p>
                  <div className="flex gap-2 mt-2">
                    <div className="badge badge-sm">100-500 credits</div>
                    <div className="badge badge-sm">2-15 min</div>
                  </div>
                  <div className="card-actions justify-end mt-2">
                    <span className="text-xs font-bold text-purple-500">View Details →</span>
                  </div>
                </div>
              </Link>

              {/* Image to Speech */}
              <Link href="/help/workflows/image-to-speech" className="card bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-2 border-purple-500/30 hover:border-purple-500 transition-all">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <h3 className="card-title text-lg">Image to Speech</h3>
                    <div className="badge badge-accent badge-sm">NEW</div>
                  </div>
                  <p className="text-xs opacity-80">Make ANY image talk! Paintings, cartoons, mascots with lip-synced audio.</p>
                  <div className="flex gap-2 mt-2">
                    <div className="badge badge-sm">100 credits</div>
                    <div className="badge badge-sm">2-3 min</div>
                  </div>
                  <div className="card-actions justify-end mt-2">
                    <span className="text-xs font-bold text-purple-500">View Details →</span>
                  </div>
                </div>
              </Link>

              {/* Anime Performance Capture */}
              <Link href="/help/workflows/anime-performance-capture" className="card bg-gradient-to-br from-pink-500/10 to-pink-600/10 border-2 border-pink-500/30 hover:border-pink-500 transition-all">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <h3 className="card-title text-lg">Anime Performance Capture</h3>
                    <div className="badge badge-accent badge-sm">NEW</div>
                  </div>
                  <p className="text-xs opacity-80">BE your anime character! Your performance transfers to anime with expressions.</p>
                  <div className="flex gap-2 mt-2">
                    <div className="badge badge-sm">185 credits</div>
                    <div className="badge badge-sm">6-10 min</div>
                  </div>
                  <div className="card-actions justify-end mt-2">
                    <span className="text-xs font-bold text-pink-500">View Details →</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* NEW: Tier 4: Post-Production & HDR */}
          <div className="card bg-gradient-to-br from-pink-500/10 to-red-500/10 border-2 border-pink-500/30 my-8 not-prose">
            <div className="card-body">
              <h3 className="card-title text-2xl">
                <span className="text-pink-500">🎨 Post-Production & HDR (7 workflows)</span>
                <span className="badge badge-accent badge-sm ml-2">Cinema-Grade!</span>
              </h3>
              <p className="text-sm opacity-90 mb-4">
                <strong>Professional HDR finishing and cinema mastering.</strong> Transform any footage into premium quality with 7 post-production workflows. Convert SDR to HDR, apply cinema-grade color grading, and export in professional formats.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-base-100 rounded-lg p-4">
                  <div className="font-bold text-sm mb-2 text-pink-500">HDR Workflows:</div>
                  <ul className="text-xs space-y-1">
                    <li>✨ <strong>Native HDR Generation</strong> - Generate videos in HDR from the start</li>
                    <li>🔄 <strong>SDR to HDR Upgrade</strong> - Convert ANY video to HDR (even iPhone footage!)</li>
                    <li>🎬 <strong>Cinema HDR Master</strong> - Professional cinema-grade finishing</li>
                    <li>🌐 <strong>Hybrid 4K HDR Pipeline</strong> - Combine sources into HDR</li>
                  </ul>
                </div>
                <div className="bg-base-100 rounded-lg p-4">
                  <div className="font-bold text-sm mb-2 text-pink-500">Export & Delivery:</div>
                  <ul className="text-xs space-y-1">
                    <li>📤 <strong>Multi-Format HDR Delivery</strong> - Export for all platforms</li>
                    <li>🎯 <strong>Draft to HDR Master</strong> - Upgrade rough cuts to cinema quality</li>
                    <li>💎 <strong>EXR Export Professional</strong> - 16-bit EXR for VFX pipelines</li>
                  </ul>
                </div>
              </div>
              
              <div className="alert alert-info mt-4 not-prose">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <div>
                  <div className="font-bold">💡 The HDR Advantage</div>
                  <div className="text-sm">Mix footage from different sources → Apply HDR upgrade → All clips match perfectly with cinema-grade quality! Perfect for film festivals, client work, and premium deliverables.</div>
                </div>
              </div>
            </div>
          </div>

          {/* NEW FEATURES CALLOUT */}
          <div className="card bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/30 my-8 not-prose">
            <div className="card-body">
              <h3 className="card-title text-xl">
                <span className="text-cyan-500">✨ NEW WORKFLOWS ADDED!</span>
                <span className="badge badge-accent badge-sm ml-2">Just Shipped!</span>
              </h3>
              <p className="text-sm opacity-90 mb-4">
                <strong>4 powerful new workflows for voice cloning, multilingual content, and talking avatars!</strong>
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-base-100 rounded-lg p-4">
                  <div className="font-bold text-sm mb-2 text-cyan-500">🎯 AI Avatar (Voice Cloning)</div>
                  <p className="text-xs opacity-80">Clone ANY voice + create realistic talking avatars. Upload audio → AI creates avatar speaking in that voice!</p>
                </div>
                <div className="bg-base-100 rounded-lg p-4">
                  <div className="font-bold text-sm mb-2 text-cyan-500">🎨 Image-to-Speech</div>
                  <p className="text-xs opacity-80">Make ANY image speak! Upload a photo → Add text/audio → AI animates lips perfectly synced!</p>
                </div>
                <div className="bg-base-100 rounded-lg p-4">
                  <div className="font-bold text-sm mb-2 text-cyan-500">🎙️ Podcast-to-Video</div>
                  <p className="text-xs opacity-80">Turn audio podcasts into engaging video! Upload podcast → AI generates animated avatars → Export for YouTube!</p>
                </div>
                <div className="bg-base-100 rounded-lg p-4">
                  <div className="font-bold text-sm mb-2 text-cyan-500">🌍 Multilingual Dubbing</div>
                  <p className="text-xs opacity-80">Translate ANY video into any language with lip-sync! Perfect for international content!</p>
                </div>
              </div>
              
              <div className="text-xs text-center mt-4 opacity-70">
                These workflows are in the <strong>Hybrid</strong> category and support optional character images for consistency!
              </div>
            </div>
          </div>
          
          <h2>🎭 Understanding Character Consistency (35+ Workflows)</h2>
          <p>Character consistency means keeping your characters looking the same across multiple scenes. <strong>Over 35 out of 58 workflows</strong> support character consistency—but they work differently!</p>

          <div className="alert alert-info my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <div className="font-bold">Image Requirements for Character Consistency</div>
              <div className="text-sm">Workflows that support character consistency use <strong>1-2 reference images</strong> to maintain your character&apos;s appearance across multiple scenes.</div>
            </div>
          </div>

          {/* Optional vs Required */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose my-8">
            {/* Optional */}
            <div className="card bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-2 border-blue-500/30">
              <div className="card-body">
                <h3 className="card-title text-lg">
                  <span className="text-2xl mr-2">💡</span>
                  <span>Optional (18 workflows)</span>
                </h3>
                <div className="divider my-1"></div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-bold text-blue-500 mb-1">HOW IT WORKS:</div>
                    <ul className="text-sm space-y-1">
                      <li>✅ <strong>First use:</strong> Text only → Generate video</li>
                      <li>✅ <strong>Later use:</strong> Text + 1-2 images → Consistent character</li>
                      <li>✅ <strong>Result:</strong> Same character across multiple videos</li>
                    </ul>
                  </div>
                  <div className="bg-base-100 rounded p-3">
                    <div className="text-xs font-bold mb-1">EXAMPLE WORKFLOW:</div>
                    <div className="text-xs opacity-80">
                      <strong>Speed Demon:</strong><br/>
                      Day 1: &quot;Warrior in forest&quot; → Get video<br/>
                      Day 2: Add Character Bank images → &quot;Same warrior in castle&quot; → Consistent look!
                    </div>
                  </div>
                  <div className="badge badge-info badge-sm">Perfect for testing & iteration</div>
                </div>
              </div>
            </div>

            {/* Required */}
            <div className="card bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-2 border-amber-500/30">
              <div className="card-body">
                <h3 className="card-title text-lg">
                  <span className="text-2xl mr-2">⚠️</span>
                  <span>Required (14 workflows)</span>
                </h3>
                <div className="divider my-1"></div>
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-bold text-amber-500 mb-1">HOW IT WORKS:</div>
                    <ul className="text-sm space-y-1">
                      <li>⚠️ <strong>Must have:</strong> 1-2 character images before starting</li>
                      <li>⚠️ <strong>No images:</strong> Workflow won&apos;t work</li>
                      <li>✅ <strong>Result:</strong> Guaranteed consistency from the start</li>
                    </ul>
                  </div>
                  <div className="bg-base-100 rounded p-3">
                    <div className="text-xs font-bold mb-1">EXAMPLE WORKFLOW:</div>
                    <div className="text-xs opacity-80">
                      <strong>Coverage Master:</strong><br/>
                      Upload 1-2 character images first<br/>
                      Then: &quot;Action scene&quot; → Get 7 shots with same character in all
                    </div>
                  </div>
                  <div className="badge badge-warning badge-sm">Perfect for series & recurring characters</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Reference Table */}
          <div className="overflow-x-auto my-8">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Count</th>
                  <th>Badge</th>
                  <th>Images Required?</th>
                  <th>Best For</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Optional</strong></td>
                  <td>18</td>
                  <td><span className="badge badge-info badge-sm">💡 Optional</span></td>
                  <td>No (add later)</td>
                  <td>Testing, beginners, one-offs</td>
                </tr>
                <tr>
                  <td><strong>Required</strong></td>
                  <td>14</td>
                  <td><span className="badge badge-warning badge-sm">⚠️ Required</span></td>
                  <td>Yes (1-2 images)</td>
                  <td>Series, recurring characters</td>
                </tr>
                <tr>
                  <td><strong>No Support</strong></td>
                  <td>15</td>
                  <td>—</td>
                  <td>N/A</td>
                  <td>Video transforms, post-production</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>Why Use Workflows?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose my-8">
            <div className="card bg-error text-error-content">
              <div className="card-body">
                <h3 className="card-title text-base">❌ Manual:</h3>
                <ol className="text-sm list-decimal list-inside space-y-1">
                  <li>Generate establishing shot</li>
                  <li>Generate medium shot</li>
                  <li>Generate close-up</li>
                  <li>Hope they all match</li>
                </ol>
              </div>
            </div>
            <div className="card bg-success text-success-content">
              <div className="card-body">
                <h3 className="card-title text-base">✅ Workflow:</h3>
                <ol className="text-sm list-decimal list-inside space-y-1">
                  <li>Select &quot;Complete Scene&quot; workflow</li>
                  <li>Enter scene description</li>
                  <li>Get 7 matching shots automatically</li>
                </ol>
              </div>
            </div>
          </div>

          <h3>Benefits:</h3>
          <ul>
            <li>✅ Character consistency guaranteed</li>
            <li>✅ Lighting/mood stays consistent</li>
            <li>✅ Saves time (one click vs. multiple)</li>
            <li>✅ Professional structure</li>
            <li>✅ Often costs fewer credits (optimized)</li>
          </ul>

          <h2>🚀 Quick Start: Finding Your Perfect Workflow</h2>
          <p>Not sure where to start? Use these simple filters to find the right workflow for your needs:</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 not-prose my-8">
            {/* Beginner */}
            <div className="card bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border-2 border-emerald-500">
              <div className="card-body">
                <h3 className="card-title text-lg">
                  <span className="text-3xl mr-2">🟢</span>
                  <span>Beginner-Friendly</span>
                </h3>
                <div className="divider my-1"></div>
                <p className="text-sm opacity-90 mb-3">Quick, simple, low credit cost</p>
                <ul className="text-sm space-y-2">
                  <li><strong>• Speed Demon</strong> (15-25 credits) - Ultra-fast, text-only</li>
                  <li><strong>• Budget Photorealistic</strong> (60-100 credits) - Great quality, affordable</li>
                  <li><strong>• Perfect Loop Generator</strong> (75-100 credits) - Seamless loops for social media</li>
                  <li><strong>• Product Reshoot</strong> (75-100 credits) - Transform product photos</li>
                </ul>
                <div className="mt-4">
                  <Link href="/features" className="btn btn-sm btn-success w-full">
                    Browse Beginner Workflows
                  </Link>
                </div>
              </div>
            </div>

            {/* Fast & Budget */}
            <div className="card bg-gradient-to-br from-amber-500/20 to-amber-600/20 border-2 border-amber-500">
              <div className="card-body">
                <h3 className="card-title text-lg">
                  <span className="text-3xl mr-2">⚡</span>
                  <span>Fast & Budget</span>
                </h3>
                <div className="divider my-1"></div>
                <p className="text-sm opacity-90 mb-3">Speed and cost-efficiency first</p>
                <ul className="text-sm space-y-2">
                  <li><strong>• Speed Demon</strong> - Under 2 minutes</li>
                  <li><strong>• Micro Action Loop</strong> - 2-4 second clips</li>
                  <li><strong>• Budget Loop 2</strong> - Lowest cost loops</li>
                  <li><strong>• Speed Loop V2</strong> - Alternative fast option</li>
                </ul>
                <div className="mt-4">
                  <Link href="/features" className="btn btn-sm btn-warning w-full">
                    Browse Fast Workflows
                  </Link>
                </div>
              </div>
            </div>

            {/* Character Consistency */}
            <div className="card bg-gradient-to-br from-violet-500/20 to-violet-600/20 border-2 border-violet-500">
              <div className="card-body">
                <h3 className="card-title text-lg">
                  <span className="text-3xl mr-2">🎭</span>
                  <span>Character Consistency</span>
                </h3>
                <div className="divider my-1"></div>
                <p className="text-sm opacity-90 mb-3">Keep characters consistent across scenes</p>
                <ul className="text-sm space-y-2">
                  <li><strong>💡 18 Optional</strong> - Add images later for consistency</li>
                  <li><strong>⚠️ 14 Required</strong> - Must have 1-2 images from start</li>
                  <li><strong>32 total</strong> workflows support this feature</li>
                </ul>
                <div className="mt-4">
                  <Link href="/features" className="btn btn-sm btn-secondary w-full">
                    Browse Character Workflows
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <h2>How to Use a Workflow</h2>
          <div className="steps steps-vertical my-8">
            <div className="step step-primary">
              <div className="text-left">
                <div className="font-bold">Step 1: Choose Workflow</div>
                <div className="text-sm opacity-70">Click &quot;Workflows&quot; in dashboard, browse by category, check credit cost</div>
              </div>
            </div>
            <div className="step step-primary">
              <div className="text-left">
                <div className="font-bold">Step 2: Follow Prompts</div>
                <div className="text-sm opacity-70">Enter scene description, character references, style preferences</div>
              </div>
            </div>
            <div className="step step-primary">
              <div className="text-left">
                <div className="font-bold">Step 3: Generate</div>
                <div className="text-sm opacity-70">Click &quot;Start Workflow&quot; and wait 2-10 minutes</div>
              </div>
            </div>
            <div className="step step-primary">
              <div className="text-left">
                <div className="font-bold">Step 4: Review & Edit</div>
                <div className="text-sm opacity-70">Download shots or open in timeline editor</div>
              </div>
            </div>
          </div>

          <h2>Workflow vs. Manual Generation</h2>
          <div className="overflow-x-auto my-8">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Aspect</th>
                  <th>Workflow</th>
                  <th>Manual</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Character Consistency</strong></td>
                  <td>✅ Guaranteed</td>
                  <td>❌ Hit or miss</td>
                </tr>
                <tr>
                  <td><strong>Speed</strong></td>
                  <td>✅ Automated</td>
                  <td>❌ Multiple steps</td>
                </tr>
                <tr>
                  <td><strong>Quality</strong></td>
                  <td>✅ Optimized</td>
                  <td>⚠️ Varies</td>
                </tr>
                <tr>
                  <td><strong>Credit Cost</strong></td>
                  <td>✅ Often cheaper</td>
                  <td>❌ Can waste credits</td>
                </tr>
                <tr>
                  <td><strong>Learning Curve</strong></td>
                  <td>✅ Guided</td>
                  <td>❌ Trial and error</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="alert alert-info my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <div className="font-bold">Bottom Line:</div>
              <div className="text-sm">Use workflows for complex multi-shot scenes. Use manual for single shots.</div>
            </div>
          </div>

          {/* COMPLETE WORKFLOW DIRECTORY - ALL 58! */}
          <h2 className="text-3xl font-bold mt-16 mb-4">📚 Complete Workflow Directory (All 58)</h2>
          <p className="text-sm opacity-70 mb-8">Browse all workflows organized by category and popularity. Click any workflow to see full details.</p>

          {/* Photorealistic (6) - Sorted by popularity */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
              <span className="text-blue-500">🎬 Photorealistic</span>
              <span className="badge badge-sm">6 workflows</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Link href="/help/workflows/hollywood-standard" className="btn btn-outline btn-sm justify-start">Hollywood Standard ⭐ 95</Link>
              <Link href="/help/workflows/cinematic-camera-suite" className="btn btn-outline btn-sm justify-start">Cinematic Camera Suite ⭐ 90</Link>
              <Link href="/help/workflows/budget-photorealistic" className="btn btn-outline btn-sm justify-start">Budget Photorealistic ⭐ 85</Link>
              <Link href="/help/workflows/multi-platform-hero" className="btn btn-outline btn-sm justify-start">Multi-Platform Hero ⭐ 80</Link>
              <Link href="/help/workflows/scene-composer" className="btn btn-outline btn-sm justify-start">Scene Composer ⭐ 75</Link>
              <Link href="/help/workflows/precision-poser" className="btn btn-outline btn-sm justify-start">Precision Poser ⭐ 70</Link>
            </div>
          </div>

          {/* Animated (3) */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
              <span className="text-pink-500">🎨 Animated</span>
              <span className="badge badge-sm">3 workflows</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Link href="/help/workflows/anime-master" className="btn btn-outline btn-sm justify-start">Anime Master ⭐ 88</Link>
              <Link href="/help/workflows/3d-character" className="btn btn-outline btn-sm justify-start">3D Character Animation ⭐ 85</Link>
              <Link href="/help/workflows/cartoon-classic" className="btn btn-outline btn-sm justify-start">Cartoon Classic ⭐ 82</Link>
            </div>
          </div>

          {/* Hybrid & Transform (11) */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
              <span className="text-purple-500">🔄 Hybrid & Transform</span>
              <span className="badge badge-sm badge-accent">11 workflows</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Link href="/help/workflows/multilingual-dubbing" className="btn btn-outline btn-sm justify-start"><span className="badge badge-accent badge-xs mr-1">NEW</span>Multilingual Dubbing ⭐ 98</Link>
              <Link href="/help/workflows/ai-avatar" className="btn btn-outline btn-sm justify-start"><span className="badge badge-accent badge-xs mr-1">NEW</span>AI Avatar ⭐ 95</Link>
              <Link href="/help/workflows/podcast-to-video" className="btn btn-outline btn-sm justify-start"><span className="badge badge-accent badge-xs mr-1">NEW</span>Podcast to Video ⭐ 92</Link>
              <Link href="/help/workflows/image-to-speech" className="btn btn-outline btn-sm justify-start"><span className="badge badge-accent badge-xs mr-1">NEW</span>Image to Speech ⭐ 90</Link>
              <Link href="/help/workflows/production-pipeline" className="btn btn-outline btn-sm justify-start">Production Pipeline ⭐ 88</Link>
              <Link href="/help/workflows/reality-to-toon" className="btn btn-outline btn-sm justify-start">Reality to Toon ⭐ 85</Link>
              <Link href="/help/workflows/action-director" className="btn btn-outline btn-sm justify-start">Action Director ⭐ 78</Link>
              <Link href="/help/workflows/style-chameleon" className="btn btn-outline btn-sm justify-start">Style Chameleon ⭐ 75</Link>
              <Link href="/help/workflows/voice-actor-match" className="btn btn-outline btn-sm justify-start">Voice Actor Match ⭐ 72</Link>
              <Link href="/help/workflows/reverse-action-builder" className="btn btn-outline btn-sm justify-start">Reverse Action Builder ⭐ 68</Link>
              <Link href="/help/workflows/bidirectional-storytelling" className="btn btn-outline btn-sm justify-start">Bidirectional Storytelling ⭐ 65</Link>
            </div>
          </div>

          {/* Budget / Speed (5) */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
              <span className="text-yellow-500">⚡ Budget / Speed</span>
              <span className="badge badge-sm">5 workflows</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Link href="/help/workflows/speed-demon" className="btn btn-outline btn-sm justify-start">Speed Demon ⭐ 80</Link>
              <Link href="/help/workflows/perfect-loop-generator" className="btn btn-outline btn-sm justify-start">Perfect Loop Generator ⭐ 78</Link>
              <Link href="/help/workflows/multi-platform-loop" className="btn btn-outline btn-sm justify-start">Multi-Platform Loop ⭐ 75</Link>
              <Link href="/help/workflows/micro-action-loop" className="btn btn-outline btn-sm justify-start">Micro Action Loop ⭐ 70</Link>
              <Link href="/help/workflows/loop-variations" className="btn btn-outline btn-sm justify-start">Loop Variations ⭐ 65</Link>
            </div>
          </div>

          {/* Fantasy & VFX (2) */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
              <span className="text-indigo-500">🐉 Fantasy & VFX</span>
              <span className="badge badge-sm">2 workflows</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Link href="/help/workflows/fantasy-epic" className="btn btn-outline btn-sm justify-start">Fantasy Epic ⭐ 93</Link>
              <Link href="/help/workflows/superhero-transform" className="btn btn-outline btn-sm justify-start">Superhero Transform ⭐ 82</Link>
            </div>
          </div>

          {/* Animals & Creatures (2) */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
              <span className="text-green-500">🦁 Animals & Creatures</span>
              <span className="badge badge-sm">2 workflows</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Link href="/help/workflows/animal-kingdom" className="btn btn-outline btn-sm justify-start">Animal Kingdom ⭐ 76</Link>
              <Link href="/help/workflows/anthro-character" className="btn btn-outline btn-sm justify-start">Anthropomorphic Character ⭐ 74</Link>
            </div>
          </div>

          {/* Production Tools (9) */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
              <span className="text-orange-500">🛠️ Production Tools</span>
              <span className="badge badge-sm">9 workflows</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Link href="/help/workflows/complete-scene" className="btn btn-outline btn-sm justify-start">Complete Scene ⭐ 100</Link>
              <Link href="/help/workflows/broll-master" className="btn btn-outline btn-sm justify-start">B-Roll Master ⭐ 87</Link>
              <Link href="/help/workflows/stock-footage-replacement" className="btn btn-outline btn-sm justify-start">Stock Footage Replacement ⭐ 85</Link>
              <Link href="/help/workflows/video-chain-builder" className="btn btn-outline btn-sm justify-start">Video Chain Builder ⭐ 78</Link>
              <Link href="/help/workflows/shot-type-variants" className="btn btn-outline btn-sm justify-start">Shot Type Variants ⭐ 75</Link>
              <Link href="/help/workflows/vfx-elements" className="btn btn-outline btn-sm justify-start">VFX Elements ⭐ 73</Link>
              <Link href="/help/workflows/scene-bridge" className="btn btn-outline btn-sm justify-start">Scene Bridge ⭐ 72</Link>
              <Link href="/help/workflows/genre-camera-variants" className="btn btn-outline btn-sm justify-start">Genre Camera Variants ⭐ 70</Link>
              <Link href="/help/workflows/location-previs" className="btn btn-outline btn-sm justify-start">Location Previsualization ⭐ 68</Link>
            </div>
          </div>

          {/* Performance Capture (8) */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
              <span className="text-red-500">🎭 Performance Capture</span>
              <span className="badge badge-sm badge-accent">8 workflows</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Link href="/help/workflows/anime-performance-capture" className="btn btn-outline btn-sm justify-start"><span className="badge badge-accent badge-xs mr-1">NEW</span>Anime Performance Capture ⭐ 88</Link>
              <Link href="/help/workflows/3d-performance-capture" className="btn btn-outline btn-sm justify-start"><span className="badge badge-accent badge-xs mr-1">NEW</span>3D Performance Capture ⭐ 85</Link>
              <Link href="/help/workflows/cartoon-performance-capture" className="btn btn-outline btn-sm justify-start"><span className="badge badge-accent badge-xs mr-1">NEW</span>Cartoon Performance Capture ⭐ 80</Link>
              <Link href="/help/workflows/action-director-performance-capture" className="btn btn-outline btn-sm justify-start"><span className="badge badge-accent badge-xs mr-1">NEW</span>Action Director Performance ⭐ 78</Link>
              <Link href="/help/workflows/complete-scene-performance-capture" className="btn btn-outline btn-sm justify-start"><span className="badge badge-accent badge-xs mr-1">NEW</span>Complete Scene Performance ⭐ 77</Link>
              <Link href="/help/workflows/anthro-performance-capture" className="btn btn-outline btn-sm justify-start"><span className="badge badge-accent badge-xs mr-1">NEW</span>Anthro Performance Capture ⭐ 75</Link>
              <Link href="/help/workflows/reality-to-toon-performance-capture" className="btn btn-outline btn-sm justify-start"><span className="badge badge-accent badge-xs mr-1">NEW</span>Reality to Toon Performance ⭐ 73</Link>
              <Link href="/help/workflows/production-pipeline-performance-capture" className="btn btn-outline btn-sm justify-start"><span className="badge badge-accent badge-xs mr-1">NEW</span>Production Pipeline Performance ⭐ 70</Link>
            </div>
          </div>

          {/* Post-Production & HDR (7) */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
              <span className="text-pink-500">🎨 Post-Production & HDR</span>
              <span className="badge badge-sm badge-accent">7 workflows</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Link href="/help/workflows/sdr-to-hdr-upgrade" className="btn btn-outline btn-sm justify-start"><span className="badge badge-accent badge-xs mr-1">NEW</span>SDR to HDR Upgrade ⭐ 95</Link>
              <Link href="/help/workflows/cinema-hdr-master" className="btn btn-outline btn-sm justify-start"><span className="badge badge-accent badge-xs mr-1">NEW</span>Cinema HDR Master ⭐ 92</Link>
              <Link href="/help/workflows/native-hdr-generation" className="btn btn-outline btn-sm justify-start"><span className="badge badge-accent badge-xs mr-1">NEW</span>Native HDR Generation ⭐ 90</Link>
              <Link href="/help/workflows/hybrid-4k-hdr-pipeline" className="btn btn-outline btn-sm justify-start"><span className="badge badge-accent badge-xs mr-1">NEW</span>Hybrid 4K HDR Pipeline ⭐ 80</Link>
              <Link href="/help/workflows/multi-format-hdr-delivery" className="btn btn-outline btn-sm justify-start"><span className="badge badge-accent badge-xs mr-1">NEW</span>Multi-Format HDR Delivery ⭐ 78</Link>
              <Link href="/help/workflows/draft-to-hdr-master" className="btn btn-outline btn-sm justify-start"><span className="badge badge-accent badge-xs mr-1">NEW</span>Draft to HDR Master ⭐ 75</Link>
              <Link href="/help/workflows/exr-export-professional" className="btn btn-outline btn-sm justify-start"><span className="badge badge-accent badge-xs mr-1">NEW</span>EXR Export Professional ⭐ 70</Link>
            </div>
          </div>

          {/* Video Enhancement (5) */}
          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-3 flex items-center gap-2">
              <span className="text-cyan-500">✨ Video Enhancement</span>
              <span className="badge badge-sm badge-accent">5 workflows</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Link href="/help/workflows/vfx-magic" className="btn btn-outline btn-sm justify-start"><span className="badge badge-accent badge-xs mr-1">NEW</span>VFX Magic ⭐ 95</Link>
              <Link href="/help/workflows/scene-transformer" className="btn btn-outline btn-sm justify-start"><span className="badge badge-accent badge-xs mr-1">NEW</span>Scene Transformer ⭐ 82</Link>
              <Link href="/help/workflows/element-eraser" className="btn btn-outline btn-sm justify-start"><span className="badge badge-accent badge-xs mr-1">NEW</span>Element Eraser ⭐ 80</Link>
              <Link href="/help/workflows/product-reshoot" className="btn btn-outline btn-sm justify-start"><span className="badge badge-accent badge-xs mr-1">NEW</span>Product Reshoot ⭐ 78</Link>
              <Link href="/help/workflows/still-photo-performer" className="btn btn-outline btn-sm justify-start"><span className="badge badge-accent badge-xs mr-1">NEW</span>Still Photo Performer ⭐ 76</Link>
            </div>
          </div>

          <h2>What&apos;s Next?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 not-prose my-8">
            <Link href="/features" className="card bg-primary text-primary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Browse Workflows</h3>
                <p className="text-sm">Explore all 58 workflows</p>
              </div>
            </Link>
            <Link href="/help/advanced/character-consistency" className="card bg-secondary text-secondary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Character Consistency</h3>
                <p className="text-sm">Keep characters the same</p>
              </div>
            </Link>
            <Link href="/help/advanced/timeline-mastery" className="card bg-accent text-accent-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Timeline Editor</h3>
                <p className="text-sm">Edit workflow outputs</p>
              </div>
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}

