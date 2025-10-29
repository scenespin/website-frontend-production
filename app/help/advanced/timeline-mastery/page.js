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
          <p className="lead">Professional 8-track timeline editor with keyframe precision, real-time preview, and Hollywood transitions.</p>

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
          </div>

          <h2>Basic Operations</h2>

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
                  <li>ProRes (4K, lossless)</li>
                  <li>Social Media (optimized)</li>
                </ul>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-sm">Format Options</h3>
                <ul className="text-xs list-disc list-inside space-y-1">
                  <li>MP4 (H.264)</li>
                  <li>MOV (ProRes)</li>
                  <li>WebM</li>
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

