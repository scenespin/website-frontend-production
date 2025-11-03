import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Timeline Editing Mastery | ${config.appName}`,
  description: "Master the 8-track timeline editor with professional multi-track editing, keyframe precision, and Hollywood transitions.",
  canonicalUrlRelative: "/help/advanced/timeline-mastery",
});

export default function TimelineMasteryPage() {
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
            <li>Advanced</li>
            <li className="font-semibold">Timeline Mastery</li>
          </ul>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Timeline Editing Mastery ⏱️</h1>
          <p className="lead">Professional 8-track timeline editor with round-trip editing, edge trimming, HDR finishing, and seamless composition workflow. Rivals Premiere Pro & DaVinci Resolve - 100% FREE forever.</p>

          <div className="alert alert-success my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <div className="font-bold">🚀 Wryda&apos;s Complete Video Production Pipeline</div>
              <div className="text-sm">Professional timeline editing combined with AI video generation and HDR finishing. Generate, edit, enhance, and export - all in one platform.</div>
            </div>
          </div>

          <h2>🔥 Professional Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 not-prose my-8">
            <div className="card bg-purple-500/10 border-2 border-purple-500/30">
              <div className="card-body">
                <h3 className="card-title text-sm text-purple-400">🔄 Round-Trip Editing</h3>
                <p className="text-xs">Move seamlessly between Timeline and Composition Studio infinitely. Non-destructive workflow with metadata preservation.</p>
              </div>
            </div>
            <div className="card bg-blue-500/10 border-2 border-blue-500/30">
              <div className="card-body">
                <h3 className="card-title text-sm text-blue-400">✂️ Edge Trimming</h3>
                <p className="text-xs">Frame-accurate clip trimming with drag handles. 30fps precision snapping, split at playhead, non-destructive editing.</p>
              </div>
            </div>
            <div className="card bg-pink-500/10 border-2 border-pink-500/30">
              <div className="card-body">
                <h3 className="card-title text-sm text-pink-400">🌐 HDR Video Upgrade</h3>
                <p className="text-xs">Upload any standard video and upgrade it to professional 16-bit HDR. Consistent cinema-grade color across all clips.</p>
              </div>
            </div>
          </div>

          <h2>Timeline Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-sm">8 Video Tracks</h3>
                <p className="text-xs">Layer videos, images, effects</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-sm">8 Audio Tracks</h3>
                <p className="text-xs">Music, dialogue, sound effects</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-sm">Keyframe Animation</h3>
                <p className="text-xs">Position, scale, rotation, opacity</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-sm">Real-time Preview</h3>
                <p className="text-xs">See changes instantly</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-sm">30 Hollywood Transitions</h3>
                <p className="text-xs">Professional effects</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-sm">65 Compositions</h3>
                <p className="text-xs">Split-screen, PIP, grids</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-sm">120 Color Grades (LUTs)</h3>
                <p className="text-xs">Professional color grading</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-sm">Speed Control & Reverse</h3>
                <p className="text-xs">0.25x-4x, reverse playback</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-sm">Text & Title Overlays</h3>
                <p className="text-xs">12 templates with animations</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-sm">Visual Effects & Filters</h3>
                <p className="text-xs">Blur, glow, vignette, grain</p>
              </div>
            </div>
          </div>

          <h2>Basic Operations</h2>

          <h3>🔄 Round-Trip Editing (Killer Feature!)</h3>
          <div className="alert alert-info my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <div className="font-bold">Seamless Timeline ↔ Composition Workflow</div>
              <div className="text-sm">Move back and forth between Timeline and Composition Studio infinitely. Originals always preserved, metadata tracked throughout.</div>
            </div>
          </div>

          <h4>How Round-Trip Editing Works:</h4>
          <ol>
            <li><strong>Timeline → Composition:</strong>
              <ul>
                <li>Select multiple clips on timeline (Cmd/Ctrl + Click)</li>
                <li>Click purple &quot;Re-compose&quot; button (sparkles icon)</li>
                <li>Composition Studio opens with clips preloaded</li>
                <li>Apply layouts (split-screen, PIP, grids)</li>
                <li>Render composition</li>
              </ul>
            </li>
            <li><strong>Composition → Timeline:</strong>
              <ul>
                <li>Click &quot;Return to Timeline&quot; button</li>
                <li>Composed video automatically replaces original clips</li>
                <li>Original clips hidden (not deleted)</li>
                <li>Timeline position preserved</li>
              </ul>
            </li>
            <li><strong>Re-edit Anytime:</strong>
              <ul>
                <li>Right-click composed clip → &quot;Re-edit Composition&quot;</li>
                <li>Returns to Composition Studio with original settings</li>
                <li>Make changes, re-render</li>
                <li>Timeline updates automatically</li>
              </ul>
            </li>
          </ol>

          <div className="card bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 my-8 not-prose">
            <div className="card-body">
              <h4 className="font-bold text-lg">💡 Pro Workflow Example</h4>
              <div className="text-sm space-y-2">
                <p><strong>Scenario:</strong> You generated 3 dialogue clips and want them as split-screen</p>
                <ol className="list-decimal list-inside space-y-1 mt-2 ml-4">
                  <li>Production Page → Generate 3 clips → Send to Timeline</li>
                  <li>Timeline → Select all 3 clips → Click &quot;Re-compose&quot;</li>
                  <li>Composition Studio → Apply &quot;Triple Split&quot; layout → Render</li>
                  <li>Composed video returns to Timeline automatically</li>
                  <li>Add music, titles, export → Done!</li>
                </ol>
                <p className="mt-3"><strong>Result:</strong> Professional split-screen edit in under 2 minutes. No manual alignment, no guesswork!</p>
              </div>
            </div>
          </div>

          <h3>✂️ Edge Trimming & Frame-Accurate Editing</h3>
          <p>Professional trimming tools with 30fps precision snapping:</p>
          <ul>
            <li><strong>Drag Trim Handles:</strong> Hover over clip edges → Drag left/right to trim non-destructively</li>
            <li><strong>Frame Snapping:</strong> Clips automatically snap to frame boundaries (30fps grid)</li>
            <li><strong>Split at Playhead:</strong> Position playhead → Press S (or scissors icon) → Clip splits into two</li>
            <li><strong>Ripple Delete:</strong> Shift + Delete removes clip AND closes gap</li>
            <li><strong>Duplicate:</strong> Alt/Option + Drag creates copy with 0.5s gap</li>
          </ul>

          <div className="alert alert-warning my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <div>
              <div className="font-bold">Non-Destructive Editing</div>
              <div className="text-sm">Trimming never deletes original media. The full clip is always preserved in cloud storage. Trim marks just hide portions during playback/export.</div>
            </div>
          </div>

          <h3>Adding Clips</h3>
          <ol>
            <li>Click &quot;+&quot; button or drag from media library</li>
            <li>Clip appears on timeline</li>
            <li>Drag to position</li>
            <li>Resize by dragging edges</li>
          </ol>

          <h3>Trimming & Cutting</h3>
          <ul>
            <li><strong>Trim:</strong> Drag clip edges to shorten/lengthen</li>
            <li><strong>Split:</strong> Position playhead, click scissors icon (or press S)</li>
            <li><strong>Delete:</strong> Select clip, press Delete</li>
            <li><strong>Ripple Delete:</strong> Shift + Delete (removes gap)</li>
          </ul>

          <h3>Moving & Arranging</h3>
          <ul>
            <li><strong>Move:</strong> Drag clip to new position</li>
            <li><strong>Copy:</strong> Alt + Drag (Windows) or Option + Drag (Mac)</li>
            <li><strong>Snap:</strong> Clips snap to other clips and markers (toggle with N)</li>
          </ul>

          <h2>Advanced Editing</h2>

          <h3>⚡ Speed Control & Reverse</h3>
          <p>Adjust playback speed or reverse footage for dramatic effects:</p>
          <ul>
            <li><strong>Speed Options:</strong> 0.25x (slow motion), 0.5x, 1x (normal), 2x, 4x (fast forward)</li>
            <li><strong>Reverse:</strong> Play clip backwards (great for reveals, rewinding effects)</li>
            <li><strong>Live Preview Mode:</strong> Toggle browser-native speed preview before rendering</li>
            <li><strong>How to Use:</strong> Select clip → Click "Speed" button → Choose speed or enable reverse</li>
          </ul>
          <div className="alert alert-info my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <div className="font-bold">Preview Mode</div>
              <div className="text-sm">Toggle "Preview Mode" to see speed changes in browser before final render. Final export applies changes with full quality.</div>
            </div>
          </div>

          <h3>✂️ Split & Ripple Editing</h3>
          <p>Professional editing tools for precise cutting:</p>
          <ul>
            <li><strong>Split at Playhead:</strong> Press S or click scissors icon to split clip at current position</li>
            <li><strong>Ripple Mode:</strong> When enabled, deleting clips automatically closes gaps</li>
            <li><strong>Copy/Paste:</strong> Ctrl+C to copy, Ctrl+V to paste selected clips</li>
            <li><strong>Keyboard Shortcuts:</strong> Work faster with keyboard-driven editing</li>
          </ul>

          <h3>🎨 120 Professional Color Grades</h3>
          <p>Industry-standard LUT (Look-Up Table) color grading:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold text-sm">Cinematic (30 LUTs)</h4>
                <p className="text-xs">Hollywood blockbuster looks - moody tones, rich colors</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold text-sm">Film Emulation (30 LUTs)</h4>
                <p className="text-xs">Vintage film stocks - Kodak, Fuji, retro aesthetics</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold text-sm">Modern Creative (30 LUTs)</h4>
                <p className="text-xs">Social media trends - vibrant, stylized, influencer looks</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold text-sm">Professional (30 LUTs)</h4>
                <p className="text-xs">Broadcast & commercial - clean, natural, professional</p>
              </div>
            </div>
          </div>
          <p><strong>How to Use:</strong> Select clip → Click "Color Grade" button → Browse 120 presets → Apply instantly (FREE!)</p>

          <h3>📝 Text & Title Overlays (12 Animated Templates)</h3>
          <p>Add professional text overlays with built-in animations:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 not-prose my-8">
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold text-sm">12 Built-in Templates</h4>
                <p className="text-xs">Lower thirds, titles, subtitles, callouts</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold text-sm">3 Animation Types</h4>
                <p className="text-xs">Fade In/Out, Slide In/Out, Scale In/Out</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold text-sm">Full Customization</h4>
                <p className="text-xs">Fonts, colors, position, outline, shadow</p>
              </div>
            </div>
          </div>
          <p><strong>Features:</strong></p>
          <ul>
            <li><strong>9 Position Presets:</strong> Top-left, top-center, top-right, center-left, center, center-right, bottom-left, bottom-center, bottom-right</li>
            <li><strong>Text Styling:</strong> Font family, size (12-200px), weight, style, color</li>
            <li><strong>Effects:</strong> Background color, opacity, outline, drop shadow</li>
            <li><strong>Animations:</strong> Fade (0.1-5s), Slide (from any direction), Scale (0-2x)</li>
            <li><strong>100% FREE:</strong> All templates and customization included</li>
          </ul>
          <p><strong>How to Use:</strong> Click "Add Text" → Choose template or start blank → Customize → Position on timeline</p>

          <h3>✨ Visual Effects & Filters</h3>
          <p>Apply professional video effects to enhance your footage:</p>
          <ul>
            <li><strong>Blur:</strong> Gaussian blur for depth of field effects (0-50px)</li>
            <li><strong>Glow:</strong> Luminous glow for highlights and dreamy looks</li>
            <li><strong>Vignette:</strong> Darken edges for cinematic focus</li>
            <li><strong>Film Grain:</strong> Add texture for vintage or cinematic feel</li>
            <li><strong>Combine Effects:</strong> Stack multiple effects on a single clip</li>
          </ul>
          <p><strong>How to Use:</strong> Select clip → Click "Effects" button → Choose effects → Adjust intensity</p>

          <h3>Keyframe Animation</h3>
          <div className="card bg-base-200 my-8 not-prose">
            <div className="card-body">
              <h4 className="font-bold">Animatable Properties:</h4>
              <ul className="text-sm list-disc list-inside space-y-1 mt-2">
                <li><strong>Position:</strong> Move clip across screen</li>
                <li><strong>Scale:</strong> Zoom in/out</li>
                <li><strong>Rotation:</strong> Spin clip</li>
                <li><strong>Opacity:</strong> Fade in/out</li>
              </ul>
              <div className="mt-4 text-sm">
                <strong>How to Add Keyframes:</strong>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>Select clip</li>
                  <li>Move playhead to start position</li>
                  <li>Click diamond icon next to property</li>
                  <li>Move playhead to end position</li>
                  <li>Change property value</li>
                  <li>Keyframe automatically created</li>
                </ol>
              </div>
            </div>
          </div>

          <h3>Multi-Track Editing</h3>
          <div className="alert alert-info my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <div className="font-bold">Track Priority:</div>
              <div className="text-sm">Upper tracks render on top of lower tracks. Use for overlays, titles, effects.</div>
            </div>
          </div>

          <h3>Transitions</h3>
          <p>30 Hollywood-style transitions available:</p>
          <ul>
            <li><strong>Cuts:</strong> Instant cut (default)</li>
            <li><strong>Crossfades:</strong> Smooth dissolve</li>
            <li><strong>Wipes:</strong> Directional transitions</li>
            <li><strong>Whip Pans:</strong> Fast camera swipes</li>
            <li><strong>Glitch:</strong> Digital effects</li>
            <li><strong>Film Burns:</strong> Vintage effects</li>
          </ul>

          <h3>Compositions</h3>
          <p>65 pre-built layouts:</p>
          <ul>
            <li><strong>Split Screen:</strong> 50/50, 70/30, triple split</li>
            <li><strong>Picture-in-Picture:</strong> Multiple sizes & positions</li>
            <li><strong>Grids:</strong> 2×2, 3×3, custom grids</li>
            <li><strong>Animated:</strong> Motion graphics templates</li>
          </ul>

          <h2>🌐 HDR Video Upgrade (Professional Finishing)</h2>
          <div className="alert alert-success my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <div className="font-bold">Professional HDR Finishing</div>
              <div className="text-sm">Upgrade any standard video to cinema-grade 16-bit HDR with consistent color grading across your entire timeline.</div>
            </div>
          </div>

          <h3>What is HDR Upgrade?</h3>
          <p>Transform standard 8-bit video into professional 16-bit HDR with enhanced dynamic range and vivid, accurate colors - the same quality used in cinema and streaming productions.</p>

          <h4>How It Works:</h4>
          <ol>
            <li>Upload any standard video (from any source)</li>
            <li>Select &quot;Upgrade to HDR&quot; in Production workflows</li>
            <li>AI analyzes and enhances dynamic range</li>
            <li>Output: Professional 16-bit HDR video</li>
            <li>All clips now have consistent, cinema-grade look</li>
          </ol>

          <h4>Why This Matters:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <div className="card bg-base-200">
              <div className="card-body">
                <h5 className="font-bold text-sm">🎬 Professional Finishing</h5>
                <p className="text-xs">Mix footage from different sources → HDR upgrade → All clips match perfectly with cinema-grade quality!</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h5 className="font-bold text-sm">📱 iPhone to Cinema</h5>
                <p className="text-xs">Shoot on iPhone (standard video) → Upload to Wryda → HDR upgrade → Professional cinema-grade footage!</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h5 className="font-bold text-sm">💰 Stock Enhancement</h5>
                <p className="text-xs">Download affordable stock footage → HDR upgrade → Premium HDR asset worth much more!</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h5 className="font-bold text-sm">🔄 Retroactive Upgrade</h5>
                <p className="text-xs">Old videos from any source → HDR upgrade → Modern cinema-grade quality!</p>
              </div>
            </div>
          </div>

          <h4>Pricing:</h4>
          <ul>
            <li><strong>Cost:</strong> 100-200 credits per video (~$1-2)</li>
            <li><strong>Time:</strong> 3-5 minutes processing</li>
            <li><strong>Output:</strong> Professional 16-bit HDR video</li>
            <li><strong>Value:</strong> Turn any footage into cinema-grade HDR</li>
          </ul>

          <div className="card bg-gradient-to-br from-pink-500/10 to-red-500/10 border-2 border-pink-500/30 my-8 not-prose">
            <div className="card-body">
              <h4 className="font-bold text-lg">💎 Complete Production Pipeline</h4>
              <div className="text-sm space-y-2">
                <p><strong>The Wryda Advantage:</strong> Generate videos with AI → Edit professionally on timeline → Apply HDR finishing → Export in any format</p>
                <p className="mt-3"><strong>Result:</strong> Mix clips from any source, apply HDR upgrade for consistency, get cinema-grade results across your entire timeline. Complete production pipeline in one platform!</p>
              </div>
            </div>
          </div>

          <h2>Audio Editing</h2>

          <h3>Audio Tracks</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 not-prose my-8">
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold text-sm">Track 1-2: Dialogue</h4>
                <p className="text-xs">Primary character audio</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold text-sm">Track 3-5: Music</h4>
                <p className="text-xs">Background music</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold text-sm">Track 6-8: SFX</h4>
                <p className="text-xs">Sound effects</p>
              </div>
            </div>
          </div>

          <h3>Audio Controls</h3>
          <ul>
            <li><strong>Volume:</strong> Adjust clip volume (0-200%)</li>
            <li><strong>Fade In/Out:</strong> Smooth audio transitions</li>
            <li><strong>Ducking:</strong> Auto-lower music when dialogue plays</li>
            <li><strong>Mute/Solo:</strong> Isolate tracks</li>
          </ul>

          <h2>Keyboard Shortcuts</h2>
          <div className="overflow-x-auto my-8">
            <table className="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Shortcut</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Play/Pause</td><td><kbd className="kbd kbd-sm">Space</kbd></td></tr>
                <tr><td>Split Clip</td><td><kbd className="kbd kbd-sm">S</kbd></td></tr>
                <tr><td>Delete</td><td><kbd className="kbd kbd-sm">Del</kbd></td></tr>
                <tr><td>Ripple Delete</td><td><kbd className="kbd kbd-sm">Shift</kbd> + <kbd className="kbd kbd-sm">Del</kbd></td></tr>
                <tr><td>Copy Clips</td><td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">C</kbd></td></tr>
                <tr><td>Paste Clips</td><td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">V</kbd></td></tr>
                <tr><td>Toggle Snap</td><td><kbd className="kbd kbd-sm">N</kbd></td></tr>
                <tr><td>Zoom In</td><td><kbd className="kbd kbd-sm">+</kbd></td></tr>
                <tr><td>Zoom Out</td><td><kbd className="kbd kbd-sm">-</kbd></td></tr>
                <tr><td>Undo</td><td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">Z</kbd></td></tr>
                <tr><td>Redo</td><td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">Y</kbd></td></tr>
              </tbody>
            </table>
          </div>

          <h2>Export Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-sm">Quality Presets</h3>
                <ul className="text-xs list-disc list-inside space-y-1">
                  <li>Web (1080p)</li>
                  <li>High Quality (4K)</li>
                  <li>16-bit EXR HDR (Professional Studio)</li>
                  <li>Social Media (optimized)</li>
                </ul>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-sm">Format Options</h3>
                <ul className="text-xs list-disc list-inside space-y-1">
                  <li>MP4 (H.264) - Universal compatibility</li>
                  <li>16-bit EXR HDR - Professional color grading</li>
                  <li>WebM - Web optimized</li>
                  <li>GIF (short clips)</li>
                </ul>
              </div>
            </div>
          </div>

          <h2>Pro Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Color-Code Clips</h3>
                <p className="text-sm">Right-click → Set Color. Organize by scene, character, or type.</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Use Markers</h3>
                <p className="text-sm">Press M to add markers. Great for beats, dialogue cues, edits.</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Save Versions</h3>
                <p className="text-sm">File → Save As Version. Keep multiple edit versions.</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Preview Quality</h3>
                <p className="text-sm">Lower preview quality for smoother playback during editing.</p>
              </div>
            </div>
          </div>

          <h2>What&apos;s Next?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <Link href="/help/reference/shortcuts" className="card bg-primary text-primary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Full Shortcut List</h3>
                <p className="text-sm">All keyboard shortcuts</p>
              </div>
            </Link>
            <Link href="/help/reference/formats" className="card bg-secondary text-secondary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Export Formats Guide</h3>
                <p className="text-sm">Choose the right format</p>
              </div>
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}

