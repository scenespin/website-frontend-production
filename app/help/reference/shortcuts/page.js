import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Keyboard Shortcuts | ${config.appName}`,
  description: "Complete keyboard shortcuts reference for Wryda.ai - speed up your workflow with these essential shortcuts.",
  canonicalUrlRelative: "/help/reference/shortcuts",
});

export default function ShortcutsPage() {
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
            <li>Reference</li>
            <li className="font-semibold">Shortcuts</li>
          </ul>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Keyboard Shortcuts ⌨️</h1>

          <h2>Screenplay Editor</h2>
          <div className="overflow-x-auto my-8">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Shortcut</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Force character name</td><td><kbd className="kbd kbd-sm">Tab</kbd></td></tr>
                <tr><td>Force scene heading</td><td><kbd className="kbd kbd-sm">Shift</kbd> + <kbd className="kbd kbd-sm">Tab</kbd></td></tr>
                <tr><td>New scene heading</td><td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">Enter</kbd></td></tr>
                <tr><td>Italics (toggle)</td><td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">I</kbd></td></tr>
                <tr><td>Find/replace</td><td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">F</kbd></td></tr>
                <tr><td>Save</td><td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">S</kbd></td></tr>
                <tr><td>Toggle scene navigator</td><td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">E</kbd></td></tr>
                <tr><td>Export PDF</td><td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">P</kbd></td></tr>
                <tr><td>Undo</td><td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">Z</kbd></td></tr>
                <tr><td>Redo</td><td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">Shift</kbd> + <kbd className="kbd kbd-sm">Z</kbd></td></tr>
              </tbody>
            </table>
          </div>

          <h2>Timeline Editor</h2>
          <div className="overflow-x-auto my-8">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Shortcut</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Play/Pause</td><td><kbd className="kbd kbd-sm">Space</kbd></td></tr>
                <tr><td>Split clip at playhead</td><td><kbd className="kbd kbd-sm">S</kbd></td></tr>
                <tr><td>Delete selected clip</td><td><kbd className="kbd kbd-sm">Del</kbd></td></tr>
                <tr><td>Ripple delete (remove gap)</td><td><kbd className="kbd kbd-sm">Shift</kbd> + <kbd className="kbd kbd-sm">Del</kbd></td></tr>
                <tr><td>Toggle snap</td><td><kbd className="kbd kbd-sm">N</kbd></td></tr>
                <tr><td>Zoom in timeline</td><td><kbd className="kbd kbd-sm">+</kbd></td></tr>
                <tr><td>Zoom out timeline</td><td><kbd className="kbd kbd-sm">-</kbd></td></tr>
                <tr><td>Fit timeline to window</td><td><kbd className="kbd kbd-sm">Shift</kbd> + <kbd className="kbd kbd-sm">Z</kbd></td></tr>
                <tr><td>Add marker</td><td><kbd className="kbd kbd-sm">M</kbd></td></tr>
                <tr><td>Copy clip</td><td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">C</kbd></td></tr>
                <tr><td>Paste clip</td><td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">V</kbd></td></tr>
                <tr><td>Duplicate clip</td><td><kbd className="kbd kbd-sm">Alt</kbd> + Drag</td></tr>
                <tr><td>Undo</td><td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">Z</kbd></td></tr>
                <tr><td>Redo</td><td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">Y</kbd></td></tr>
                <tr><td>Select all</td><td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">A</kbd></td></tr>
                <tr><td>Deselect all</td><td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">D</kbd></td></tr>
              </tbody>
            </table>
          </div>

          <h2>Playback Controls</h2>
          <div className="overflow-x-auto my-8">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Shortcut</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Play/Pause</td><td><kbd className="kbd kbd-sm">Space</kbd></td></tr>
                <tr><td>Play from beginning</td><td><kbd className="kbd kbd-sm">Home</kbd></td></tr>
                <tr><td>Go to end</td><td><kbd className="kbd kbd-sm">End</kbd></td></tr>
                <tr><td>Next frame</td><td><kbd className="kbd kbd-sm">→</kbd></td></tr>
                <tr><td>Previous frame</td><td><kbd className="kbd kbd-sm">←</kbd></td></tr>
                <tr><td>Jump forward (5 sec)</td><td><kbd className="kbd kbd-sm">Shift</kbd> + <kbd className="kbd kbd-sm">→</kbd></td></tr>
                <tr><td>Jump backward (5 sec)</td><td><kbd className="kbd kbd-sm">Shift</kbd> + <kbd className="kbd kbd-sm">←</kbd></td></tr>
              </tbody>
            </table>
          </div>

          <h2>General Navigation</h2>
          <div className="overflow-x-auto my-8">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Shortcut</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Open command palette</td><td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">K</kbd></td></tr>
                <tr><td>New project</td><td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">N</kbd></td></tr>
                <tr><td>Open project</td><td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">O</kbd></td></tr>
                <tr><td>Save project</td><td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">S</kbd></td></tr>
                <tr><td>Save as</td><td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">Shift</kbd> + <kbd className="kbd kbd-sm">S</kbd></td></tr>
                <tr><td>Export</td><td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">E</kbd></td></tr>
                <tr><td>Toggle fullscreen</td><td><kbd className="kbd kbd-sm">F11</kbd></td></tr>
                <tr><td>Toggle sidebar</td><td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">B</kbd></td></tr>
              </tbody>
            </table>
          </div>

          <h2>Pro Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Learn Gradually</h3>
                <p className="text-sm">Master 3-5 shortcuts per week. Start with Play/Pause, Split, Delete.</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Custom Shortcuts</h3>
                <p className="text-sm">Settings → Keyboard → Customize shortcuts to your preference.</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Cheat Sheet</h3>
                <p className="text-sm">Press <kbd className="kbd kbd-sm">?</kbd> in any editor to see contextual shortcuts.</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Mac Users</h3>
                <p className="text-sm">Replace <kbd className="kbd kbd-sm">Ctrl</kbd> with <kbd className="kbd kbd-sm">Cmd</kbd> on Mac.</p>
              </div>
            </div>
          </div>

          <h2>What&apos;s Next?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <Link href="/help/advanced/timeline-mastery" className="card bg-primary text-primary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Timeline Mastery</h3>
                <p className="text-sm">Master the timeline editor</p>
              </div>
            </Link>
            <Link href="/help/screenplay-editor" className="card bg-secondary text-secondary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Screenplay Editor Guide</h3>
                <p className="text-sm">Learn the screenplay editor</p>
              </div>
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}

