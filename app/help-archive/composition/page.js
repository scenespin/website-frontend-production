import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Composition Studio Guide | ${config.appName}`,
  description: "Master the Composition Studio - create split-screens, picture-in-picture, grids, and animated layouts with professional pacing and effects.",
  canonicalUrlRelative: "/help/composition",
});

export default function CompositionStudioGuide() {
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
            <li className="font-semibold">Composition Studio</li>
          </ul>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>🎨 Composition Studio - Complete Guide</h1>
          <p className="lead">Create professional multi-clip compositions with split-screens, picture-in-picture, grids, and animated layouts. Control pacing, add background music, and apply cinematic effects. **NEW: Full support for video, audio, and image files!**</p>

          <div className="alert alert-success my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <div className="font-bold">🎬 What Is Composition?</div>
              <div className="text-sm">Combine multiple media files (video, audio, images) into ONE professional video with layouts, pacing, and effects. Works with AI-generated content, user uploads, and cloud storage files!</div>
            </div>
          </div>

          <div className="alert alert-info my-6 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <div className="font-bold">✨ NEW: Universal Media Support!</div>
              <div className="text-sm">
                <strong>📹 Video:</strong> MP4, MOV, WebM, MKV (up to 100MB) •
                <strong>🎵 Audio:</strong> MP3, WAV, AAC, OGG (up to 10MB) •
                <strong>🖼️ Images:</strong> JPG, PNG, GIF, WebP (up to 10MB)
              </div>
            </div>
          </div>

          <h2>🎯 When to Use Composition Studio</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-6">
            <div className="card bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-2 border-blue-500/30">
              <div className="card-body">
                <h3 className="font-bold text-base mb-2">✅ Perfect For:</h3>
                <ul className="text-sm space-y-1">
                  <li>• <strong>Dialogue scenes</strong> - 2+ characters talking</li>
                  <li>• <strong>Phone calls</strong> - Split-screen conversations</li>
                  <li>• <strong>Reactions</strong> - Show multiple perspectives</li>
                  <li>• <strong>Tutorials</strong> - Picture-in-picture demos</li>
                  <li>• <strong>Before/After</strong> - Side-by-side comparisons</li>
                  <li>• <strong>Multi-angle coverage</strong> - Same scene, different angles</li>
                </ul>
              </div>
            </div>
            <div className="card bg-gradient-to-br from-red-500/10 to-red-600/10 border-2 border-red-500/30">
              <div className="card-body">
                <h3 className="font-bold text-base mb-2">❌ NOT For:</h3>
                <ul className="text-sm space-y-1">
                  <li>• <strong>Sequential editing</strong> - Use Timeline instead</li>
                  <li>• <strong>Single clips</strong> - No composition needed</li>
                  <li>• <strong>Complex transitions</strong> - Use Timeline</li>
                  <li>• <strong>Adding music throughout</strong> - Use Timeline</li>
                  <li>• <strong>Color grading</strong> - Use Timeline</li>
                  <li>• <strong>Multi-scene projects</strong> - Use Timeline</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="alert alert-info my-6 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <div className="font-bold">💡 Think of It This Way:</div>
              <div className="text-sm"><strong>Composition Studio</strong> = Combine multiple clips into ONE composed video with a layout. <strong>Timeline Editor</strong> = Arrange multiple videos/audio sequentially with transitions and effects. Use them together for complete projects!</div>
            </div>
          </div>

          <h2>📂 Universal Media Support: All File Types Welcome!</h2>
          <p>Composition Studio works with **ALL media types** - not just AI-generated videos. Mix and match any combination!</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 not-prose my-6">
            <div className="card bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-2 border-blue-500/30">
              <div className="card-body">
                <h3 className="font-bold text-base mb-2">📹 VIDEO FILES</h3>
                <ul className="text-sm space-y-1">
                  <li>✅ MP4 (H.264, H.265)</li>
                  <li>✅ MOV (H.264, various codecs)</li>
                  <li>✅ WebM (VP8, VP9)</li>
                  <li>✅ MKV (Any codec)</li>
                  <li className="pt-2 text-xs opacity-70">Max: 100MB per file</li>
                  <li className="text-xs opacity-70">Any resolution (4K, 8K supported!)</li>
                </ul>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-2 border-purple-500/30">
              <div className="card-body">
                <h3 className="font-bold text-base mb-2">🎵 AUDIO FILES</h3>
                <ul className="text-sm space-y-1">
                  <li>✅ MP3</li>
                  <li>✅ WAV (Uncompressed)</li>
                  <li>✅ AAC (Apple Audio)</li>
                  <li>✅ OGG Vorbis</li>
                  <li className="pt-2 text-xs opacity-70">Max: 10MB per file</li>
                  <li className="text-xs opacity-70">Any sample rate (48kHz, 96kHz, etc.)</li>
                </ul>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-500/10 to-green-600/10 border-2 border-green-500/30">
              <div className="card-body">
                <h3 className="font-bold text-base mb-2">🖼️ IMAGE FILES</h3>
                <ul className="text-sm space-y-1">
                  <li>✅ JPG / JPEG</li>
                  <li>✅ PNG (with transparency)</li>
                  <li>✅ GIF (animated supported)</li>
                  <li>✅ WebP</li>
                  <li className="pt-2 text-xs opacity-70">Max: 10MB per file</li>
                  <li className="text-xs opacity-70">Any resolution (up to 8K)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-orange-500/10 to-red-500/10 border-2 border-orange-500/30 my-6 not-prose">
            <div className="card-body">
              <h4 className="font-bold text-base mb-2">🎬 Mix & Match Media Types!</h4>
              <div className="text-sm space-y-2">
                <p><strong>Example 1:</strong> Split-screen with 2 videos + logo image overlay + background music = Professional branded video!</p>
                <p><strong>Example 2:</strong> Paced sequence with videos + images + sound effects = Dynamic slideshow with audio!</p>
                <p><strong>Example 3:</strong> Picture-in-picture with screen recording + webcam + logo + voice-over = Complete tutorial!</p>
                <p className="pt-2 font-semibold">✨ FFmpeg automatically handles all format conversions behind the scenes!</p>
              </div>
            </div>
          </div>

          <h2>🎨 The 3 Types of Compositions</h2>

          <h3>1. Static Layouts (Most Common)</h3>
          <p>Fixed layouts where all clips stay in their positions throughout. No movement, just clean professional composition.</p>

          <div className="card bg-base-200 my-6 not-prose">
            <div className="card-body">
              <h4 className="font-bold text-sm mb-3">📐 Available Static Layouts:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-semibold text-blue-600 mb-1">📱 Phone Call Layouts</p>
                  <ul className="text-xs space-y-1 ml-4">
                    <li>• 2-way phone call (split-screen)</li>
                    <li>• 3-way conference call (triple split)</li>
                    <li>• Vertical phone calls (for social media)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-purple-600 mb-1">⚡ Split-Screen Layouts</p>
                  <ul className="text-xs space-y-1 ml-4">
                    <li>• 50/50 side-by-side</li>
                    <li>• 70/30 (main + secondary)</li>
                    <li>• Triple split (3 clips)</li>
                    <li>• Quad split (4 clips)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-green-600 mb-1">📺 Picture-in-Picture (PIP)</p>
                  <ul className="text-xs space-y-1 ml-4">
                    <li>• Main video + small overlay</li>
                    <li>• Tutorial style (demo + face)</li>
                    <li>• Commentary style</li>
                    <li>• Multi-PIP (2+ overlays)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-orange-600 mb-1">⬜ Grid Layouts</p>
                  <ul className="text-xs space-y-1 ml-4">
                    <li>• 2×2 grid (4 clips)</li>
                    <li>• 3×3 grid (9 clips)</li>
                    <li>• Brady Bunch style</li>
                    <li>• Security camera grid</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/30 my-6 not-prose">
            <div className="card-body">
              <h4 className="font-bold text-base mb-2">💡 When to Use Static Layouts:</h4>
              <ul className="text-sm space-y-2">
                <li>✅ <strong>Dialogue scenes</strong> - Show both characters talking at once</li>
                <li>✅ <strong>Interviews</strong> - Host + guest split-screen</li>
                <li>✅ <strong>Tutorials</strong> - Screen recording + your face in corner</li>
                <li>✅ <strong>Product comparisons</strong> - Side-by-side Before/After</li>
                <li>✅ <strong>Reaction videos</strong> - Original video + your reaction</li>
              </ul>
            </div>
          </div>

          <h3>2. Paced Compositions (Emotional Rhythm)</h3>
          <p>Control HOW LONG each clip shows and in what ORDER. Create psychological impact through timing. Clips appear sequentially, not simultaneously.</p>

          <div className="card bg-base-200 my-6 not-prose">
            <div className="card-body">
              <h4 className="font-bold text-sm mb-3">⚡ Pacing Options:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-semibold text-blue-600 mb-1">🐢 Slow Pacing (Low Intensity)</p>
                  <ul className="text-xs space-y-1 ml-4">
                    <li>• Clips: 7-10 seconds each</li>
                    <li>• <strong>Psychological Effect:</strong> Calm, contemplative, emotional depth</li>
                    <li>• <strong>Best For:</strong> Drama, documentaries, emotional scenes, storytelling</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-green-600 mb-1">🚶 Medium Pacing</p>
                  <ul className="text-xs space-y-1 ml-4">
                    <li>• Clips: 4-6 seconds each</li>
                    <li>• <strong>Psychological Effect:</strong> Natural rhythm, comfortable viewing</li>
                    <li>• <strong>Best For:</strong> General content, tutorials, vlogs, most use cases</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-amber-600 mb-1">🏃 Fast Pacing (High Intensity)</p>
                  <ul className="text-xs space-y-1 ml-4">
                    <li>• Clips: 2-3 seconds each</li>
                    <li>• <strong>Psychological Effect:</strong> Exciting, engaging, energetic</li>
                    <li>• <strong>Best For:</strong> Action sequences, montages, social media, highlights</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-red-600 mb-1">⚡ Extreme Pacing</p>
                  <ul className="text-xs space-y-1 ml-4">
                    <li>• Clips: 0.5-1 seconds each</li>
                    <li>• <strong>Psychological Effect:</strong> Intense, overwhelming, adrenaline</li>
                    <li>• <strong>Best For:</strong> TikTok/Reels, hype videos, music videos, trailers</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 my-6 not-prose">
            <div className="card-body">
              <h4 className="font-bold text-base mb-2">💡 Pro Tip: Pacing Creates Emotion</h4>
              <div className="text-sm space-y-2">
                <p><strong>Slow pacing</strong> makes viewers feel emotions deeply. Use for dramatic moments, character development, emotional beats.</p>
                <p><strong>Fast pacing</strong> creates excitement and energy. Use for action, reveals, climactic moments, viral content.</p>
                <p><strong>Variable pacing</strong> (mixing speeds) keeps viewers engaged. Start slow, build to fast climax, slow resolution = professional storytelling!</p>
              </div>
            </div>
          </div>

          <h3>3. Animated Compositions (Motion Graphics)</h3>
          <p>Clips move, zoom, rotate, or transition with motion graphics effects. Most cinematic and eye-catching option!</p>

          <div className="card bg-base-200 my-6 not-prose">
            <div className="card-body">
              <h4 className="font-bold text-sm mb-3">✨ Animation Styles:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-semibold text-green-600 mb-1">🟢 Simple Animations</p>
                  <ul className="text-xs space-y-1 ml-4">
                    <li>• Fade in/out</li>
                    <li>• Slide transitions</li>
                    <li>• Zoom in/out</li>
                    <li>• <strong>Best For:</strong> Clean, professional look</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-yellow-600 mb-1">🟡 Moderate Animations</p>
                  <ul className="text-xs space-y-1 ml-4">
                    <li>• Rotation effects</li>
                    <li>• Multi-axis motion</li>
                    <li>• Split reveals</li>
                    <li>• <strong>Best For:</strong> Eye-catching content, social media</li>
                  </ul>
                </div>
                <div className="md:col-span-2">
                  <p className="font-semibold text-red-600 mb-1">🔴 Complex Animations</p>
                  <ul className="text-xs space-y-1 ml-4">
                    <li>• 3D transforms • Particles & glows • Kinetic typography • Multiple simultaneous effects</li>
                    <li>• <strong>Best For:</strong> Music videos, high-end commercials, title sequences, wow-factor content</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="alert alert-warning my-6 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <div>
              <div className="font-bold">⚠️ Animation Rendering Time</div>
              <div className="text-sm">Simple animations: ~5 minutes. Complex animations: ~15 minutes. Plan accordingly! Start with simple animations to test, then go complex for final version.</div>
            </div>
          </div>

          <h2>🎵 Background Music & Audio</h2>
          <p>Add background music to your compositions for professional polish!</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-6">
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold text-sm mb-2">🎼 AI Music Generator</h4>
                <p className="text-xs mb-2">Generate custom background music that matches your composition&apos;s mood.</p>
                <ul className="text-xs space-y-1">
                  <li>• Describe mood/genre</li>
                  <li>• AI generates matching track</li>
                  <li>• Auto-fits to composition length</li>
                  <li>• Adjustable volume</li>
                </ul>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold text-sm mb-2">📚 Music Library</h4>
                <p className="text-xs mb-2">Browse royalty-free music tracks organized by mood and genre.</p>
                <ul className="text-xs space-y-1">
                  <li>• 100+ professional tracks</li>
                  <li>• Filter by mood/genre/tempo</li>
                  <li>• Preview before adding</li>
                  <li>• Fully licensed for commercial use</li>
                </ul>
              </div>
            </div>
          </div>

          <h2>📋 Step-by-Step: Creating Your First Composition</h2>

          <div className="card bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-2 border-indigo-500/30 my-6 not-prose">
            <div className="card-body">
              <h3 className="font-bold text-lg mb-4">🎬 Complete Workflow Example:</h3>
              <div className="space-y-4 text-sm">
                <div className="flex gap-3">
                  <div className="badge badge-primary badge-lg">1</div>
                  <div>
                    <p className="font-semibold mb-1">Upload/Add Your Clips</p>
                    <p className="text-xs">Click &quot;Upload Videos&quot; or come from Production page with preloaded clips. Need 2+ clips for composition. Supports MP4, MOV, WEBM up to 100MB each.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="badge badge-secondary badge-lg">2</div>
                  <div>
                    <p className="font-semibold mb-1">Choose Composition Type</p>
                    <p className="text-xs">Click the tab: <strong>Static</strong> (layouts), <strong>Paced</strong> (emotional timing), or <strong>Animated</strong> (motion graphics).</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="badge badge-accent badge-lg">3</div>
                  <div>
                    <p className="font-semibold mb-1">Select Layout/Pacing/Animation</p>
                    <p className="text-xs">Browse options with visual previews. Each shows what it&apos;s best for and example use cases. Click to select.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="badge badge-info badge-lg">4</div>
                  <div>
                    <p className="font-semibold mb-1">Add Background Music (Optional)</p>
                    <p className="text-xs">Click music tab → Generate AI music OR browse library → Select track → Adjust volume slider.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="badge badge-success badge-lg">5</div>
                  <div>
                    <p className="font-semibold mb-1">Preview & Render</p>
                    <p className="text-xs">Preview shows rough layout. Click <strong>&quot;Render Composition&quot;</strong> → Processing takes 5-15 minutes → Download OR send to Timeline for further editing!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <h2>💡 Composition Best Practices</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-6">
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold text-sm mb-2">✅ DO This:</h4>
                <ul className="text-xs space-y-1">
                  <li>• Match composition type to content (dialogue = split-screen)</li>
                  <li>• Use pacing to create emotional impact</li>
                  <li>• Keep similar aspect ratios for clips</li>
                  <li>• Add subtle background music</li>
                  <li>• Test with simple layouts first</li>
                  <li>• Send to Timeline after for polish</li>
                </ul>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold text-sm mb-2">❌ DON&apos;T Do This:</h4>
                <ul className="text-xs space-y-1">
                  <li>• Mix drastically different video qualities</li>
                  <li>• Use complex animations for everything</li>
                  <li>• Ignore the &quot;best for&quot; recommendations</li>
                  <li>• Make music too loud (max 50-60% volume)</li>
                  <li>• Expect instant results (rendering takes time)</li>
                  <li>• Skip the preview step</li>
                </ul>
              </div>
            </div>
          </div>

          <h2>🎯 Common Composition Use Cases</h2>

          <div className="space-y-4 not-prose my-6">
            <div className="collapse collapse-arrow bg-base-200">
              <input type="radio" name="use-case" defaultChecked />
              <div className="collapse-title font-semibold">
                🎭 Use Case 1: Dialogue Scene (2 Characters Talking)
              </div>
              <div className="collapse-content">
                <div className="text-sm space-y-2 pt-2">
                  <p><strong>Goal:</strong> Show both characters on screen while they talk</p>
                  <p><strong>Best Composition:</strong> Static Layout → &quot;50/50 Split-Screen&quot;</p>
                  <p><strong>Why:</strong> Viewers see both characters&apos; reactions simultaneously</p>
                  <p><strong>Pro Tip:</strong> If it&apos;s a phone call, use &quot;2-Way Phone Call&quot; layout for the phone UI aesthetic!</p>
                </div>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-200">
              <input type="radio" name="use-case" />
              <div className="collapse-title font-semibold">
                🎮 Use Case 2: Tutorial with Face Cam
              </div>
              <div className="collapse-content">
                <div className="text-sm space-y-2 pt-2">
                  <p><strong>Goal:</strong> Screen recording as main video, your face in corner</p>
                  <p><strong>Best Composition:</strong> Static Layout → &quot;Picture-in-Picture (Bottom Right)&quot;</p>
                  <p><strong>Why:</strong> Main focus on tutorial, personality in corner builds trust</p>
                  <p><strong>Pro Tip:</strong> Position face cam where it doesn&apos;t cover important UI elements!</p>
                </div>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-200">
              <input type="radio" name="use-case" />
              <div className="collapse-title font-semibold">
                🎵 Use Case 3: Music Video Montage
              </div>
              <div className="collapse-content">
                <div className="text-sm space-y-2 pt-2">
                  <p><strong>Goal:</strong> Multiple quick cuts synced to music</p>
                  <p><strong>Best Composition:</strong> Paced Composition → &quot;Fast&quot; or &quot;Extreme&quot; pacing</p>
                  <p><strong>Why:</strong> Rapid clip changes create energy and excitement</p>
                  <p><strong>Pro Tip:</strong> Match pacing to beat drop moments in the music!</p>
                </div>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-200">
              <input type="radio" name="use-case" />
              <div className="collapse-title font-semibold">
                📊 Use Case 4: Product Comparison
              </div>
              <div className="collapse-content">
                <div className="text-sm space-y-2 pt-2">
                  <p><strong>Goal:</strong> Show two products side-by-side for direct comparison</p>
                  <p><strong>Best Composition:</strong> Static Layout → &quot;Side-by-Side 50/50&quot;</p>
                  <p><strong>Why:</strong> Equal weight to both products, easy visual comparison</p>
                  <p><strong>Pro Tip:</strong> Use animated layout with slow zoom for premium feel!</p>
                </div>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-200">
              <input type="radio" name="use-case" />
              <div className="collapse-title font-semibold">
                🎬 Use Case 5: Multi-Angle Action Scene
              </div>
              <div className="collapse-content">
                <div className="text-sm space-y-2 pt-2">
                  <p><strong>Goal:</strong> Show same action from 4 different camera angles</p>
                  <p><strong>Best Composition:</strong> Static Layout → &quot;2×2 Grid&quot; OR Paced → &quot;Medium Pacing&quot;</p>
                  <p><strong>Why:</strong> Grid shows all angles at once. Pacing shows sequentially with rhythm.</p>
                  <p><strong>Pro Tip:</strong> Grid for comparison, Pacing for storytelling!</p>
                </div>
              </div>
            </div>
          </div>

          <h2>🔄 Round-Trip Editing with Timeline</h2>
          <p>Composition Studio works seamlessly with the Timeline Editor for complete projects!</p>

          <div className="alert alert-success my-6 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <div className="font-bold">💡 The Power Combo:</div>
              <div className="text-sm space-y-1">
                <p><strong>Composition:</strong> Combine multiple clips into ONE composed video</p>
                <p><strong>Timeline:</strong> Arrange multiple composed videos sequentially, add transitions, music, color grading</p>
                <p><strong>Result:</strong> Professional multi-scene project with complex layouts!</p>
              </div>
            </div>
          </div>

          <h3>Example Workflow:</h3>
          <div className="card bg-base-200 my-6 not-prose">
            <div className="card-body">
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li><strong>Scene 1:</strong> Composition Studio → Create split-screen dialogue (2 clips) → Render</li>
                <li><strong>Scene 2:</strong> Composition Studio → Create action montage (5 clips, fast pacing) → Render</li>
                <li><strong>Scene 3:</strong> Composition Studio → Create tutorial (PIP layout, 2 clips) → Render</li>
                <li><strong>Timeline Editor:</strong> Arrange all 3 composed scenes sequentially</li>
                <li><strong>Timeline Editor:</strong> Add transitions between scenes, background music throughout, color grade</li>
                <li><strong>Export:</strong> Final professional video with complex layouts and polish!</li>
              </ol>
            </div>
          </div>

          <h2>💎 Pro Tips for Great Compositions</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-6">
            <div className="card bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-2 border-blue-500/30">
              <div className="card-body">
                <h4 className="font-bold text-sm mb-2">🎨 Visual Balance</h4>
                <p className="text-xs">Keep similar lighting/color between clips. Drastically different brightness looks unprofessional. Consider matching color grading BEFORE composing.</p>
              </div>
            </div>
            <div className="card bg-gradient-to-br from-green-500/10 to-green-600/10 border-2 border-green-500/30">
              <div className="card-body">
                <h4 className="font-bold text-sm mb-2">🎵 Music Volume</h4>
                <p className="text-xs">Background music should be BACKGROUND. If clips have dialogue, keep music at 30-40% max. Instrumental works better than vocals.</p>
              </div>
            </div>
            <div className="card bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-2 border-purple-500/30">
              <div className="card-body">
                <h4 className="font-bold text-sm mb-2">⚡ Pacing Psychology</h4>
                <p className="text-xs">Fast pacing = excitement but exhausting. Slow pacing = emotional but boring if overused. Mix pacing speeds for professional rhythm!</p>
              </div>
            </div>
            <div className="card bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-2 border-orange-500/30">
              <div className="card-body">
                <h4 className="font-bold text-sm mb-2">🎯 Layout Purpose</h4>
                <p className="text-xs">Every layout has a purpose. Don&apos;t use split-screen just because it looks cool - use it when showing BOTH things simultaneously matters!</p>
              </div>
            </div>
          </div>

          <h2>What&apos;s Next?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 not-prose my-8">
            <Link href="/help/advanced/timeline-mastery" className="card bg-primary text-primary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Timeline Editing</h3>
                <p className="text-sm">Professional editing after composition</p>
              </div>
            </Link>
            <Link href="/help/production" className="card bg-secondary text-secondary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Production Page</h3>
                <p className="text-sm">Generate videos for composition</p>
              </div>
            </Link>
            <Link href="/help/advanced/multi-shot-scenes" className="card bg-accent text-accent-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Multi-Shot Scenes</h3>
                <p className="text-sm">Advanced scene composition</p>
              </div>
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}

