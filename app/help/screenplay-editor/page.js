import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Screenplay Editor Guide | ${config.appName}`,
  description: "Professional Fountain format screenplay editor with real-time formatting, GitHub integration, and AI writing agents. Always free, unlimited use.",
  canonicalUrlRelative: "/help/screenplay-editor",
});

export default function ScreenplayEditorPage() {
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

      <main className="max-w-4xl mx-auto px-8 py-16">
        {/* Breadcrumb */}
        <div className="text-sm breadcrumbs mb-6">
          <ul>
            <li><Link href="/help">Help Center</Link></li>
            <li>Core Features</li>
            <li className="font-semibold">Screenplay Editor</li>
          </ul>
        </div>

        {/* Article */}
        <article className="prose prose-lg max-w-none">
          <h1>Screenplay Editor Guide ✍️</h1>

          <div className="alert alert-success my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <div className="font-bold">Industry-standard Fountain format editor</div>
              <div className="text-sm">Real-time auto-formatting • Always free • Unlimited use</div>
            </div>
          </div>

          <h2>Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <h3 className="font-bold text-sm">✅ Real-time Fountain formatting</h3>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <h3 className="font-bold text-sm">✅ Scene navigator</h3>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <h3 className="font-bold text-sm">✅ Character tracking</h3>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <h3 className="font-bold text-sm">✅ @mention navigation</h3>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <h3 className="font-bold text-sm">✅ GitHub version control</h3>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <h3 className="font-bold text-sm">✅ Export to PDF, FDX, DOC</h3>
              </div>
            </div>
          </div>

          <h2>Fountain Format Basics</h2>
          <p>Fountain is a plain-text screenplay format. Just type naturally, and Wryda auto-formats.</p>

          <h3>Scene Headings</h3>
          <div className="mockup-code my-6">
            <pre><code>INT. COFFEE SHOP - DAY</code></pre>
            <pre><code></code></pre>
            <pre><code>EXT. CITY STREET - NIGHT</code></pre>
            <pre><code></code></pre>
            <pre><code>INT./EXT. CAR (MOVING) - DUSK</code></pre>
          </div>
          <p><strong>Rules:</strong> Start with INT, EXT, or INT./EXT • ALL CAPS • Separate location from time with dash</p>

          <h3>Action/Description</h3>
          <div className="mockup-code my-6">
            <pre><code>John enters the coffee shop. Rain drips from his coat.</code></pre>
            <pre><code></code></pre>
            <pre><code>He scans the room, searching for someone.</code></pre>
          </div>
          <p><strong>Rules:</strong> Regular text • New paragraph = new action block</p>

          <h3>Character Names & Dialogue</h3>
          <div className="mockup-code my-6">
            <pre><code>JOHN</code></pre>
            <pre><code>I&apos;ve been waiting for you.</code></pre>
            <pre><code></code></pre>
            <pre><code>SARAH</code></pre>
            <pre><code>(nervous)</code></pre>
            <pre><code>I&apos;m sorry I&apos;m late.</code></pre>
          </div>
          <p><strong>Rules:</strong> Character name in ALL CAPS • Dialogue indented automatically • Parentheticals in (parentheses)</p>

          <h3>Transitions</h3>
          <div className="mockup-code my-6">
            <pre><code>CUT TO:</code></pre>
            <pre><code></code></pre>
            <pre><code>FADE IN:</code></pre>
            <pre><code></code></pre>
            <pre><code>DISSOLVE TO:</code></pre>
          </div>
          <p><strong>Rules:</strong> ALL CAPS • Ends with colon • Right-aligned automatically</p>

          <h2>Editor Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose my-8">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Scene Navigator</h3>
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>Click scene icon (left sidebar)</li>
                  <li>Jump to any scene instantly</li>
                  <li>See scene count</li>
                  <li>Filter by INT/EXT</li>
                </ul>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Character Tracker</h3>
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>Automatically tracks all characters</li>
                  <li>See character list</li>
                  <li>Jump to character&apos;s scenes</li>
                  <li>Track dialogue count</li>
                </ul>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">@Mention Navigation</h3>
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>Type @ to see list</li>
                  <li>@John - Jump to character&apos;s scenes</li>
                  <li>@INT - Jump to interior scenes</li>
                  <li>@ACT - Jump to act breaks</li>
                </ul>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Focus Mode</h3>
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>Hide sidebar/tools</li>
                  <li>Distraction-free writing</li>
                  <li>Just you and the page</li>
                  <li>Toggle in settings</li>
                </ul>
              </div>
            </div>
          </div>

          <h2>Keyboard Shortcuts</h2>
          <div className="overflow-x-auto my-8">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Shortcut</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Force character name</td>
                  <td><kbd className="kbd kbd-sm">Tab</kbd></td>
                </tr>
                <tr>
                  <td>Force action</td>
                  <td><kbd className="kbd kbd-sm">Shift</kbd> + <kbd className="kbd kbd-sm">Tab</kbd></td>
                </tr>
                <tr>
                  <td>New scene heading</td>
                  <td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">Enter</kbd></td>
                </tr>
                <tr>
                  <td>Find/replace</td>
                  <td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">F</kbd></td>
                </tr>
                <tr>
                  <td>Go to scene</td>
                  <td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">G</kbd></td>
                </tr>
                <tr>
                  <td>Next scene</td>
                  <td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">]</kbd></td>
                </tr>
                <tr>
                  <td>Previous scene</td>
                  <td><kbd className="kbd kbd-sm">Ctrl</kbd> + <kbd className="kbd kbd-sm">[</kbd></td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>Export Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">PDF (Screenplay)</h3>
                <p className="text-sm">Industry-standard format • Perfect for sharing • Locked layout</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Final Draft (FDX)</h3>
                <p className="text-sm">Import into Final Draft • Professional format • Maintains all formatting</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Microsoft Word (DOC)</h3>
                <p className="text-sm">Edit in Word • Share with non-screenwriters • Flexible layout</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Plain Text (Fountain)</h3>
                <p className="text-sm">Portable format • Version control friendly • Universal compatibility</p>
              </div>
            </div>
          </div>

          <h2>Version Control (GitHub)</h2>
          <div className="alert alert-info my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <div className="font-bold">Why Use GitHub?</div>
              <ul className="text-sm list-disc list-inside mt-2">
                <li>Track every change</li>
                <li>Collaborate with co-writers</li>
                <li>Revert to previous versions</li>
                <li>Industry standard</li>
              </ul>
            </div>
          </div>

          <h3>Setup:</h3>
          <ol>
            <li>Connect GitHub account</li>
            <li>Create repository</li>
            <li>Enable auto-commit</li>
            <li>Write normally</li>
          </ol>

          <h3>Features:</h3>
          <ul>
            <li>Auto-commit every save</li>
            <li>See full history</li>
            <li>Revert any change</li>
            <li>Collaborate with pull requests</li>
          </ul>

          <h2>AI Integration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 not-prose my-8">
            <div className="card bg-primary text-primary-content">
              <div className="card-body">
                <h3 className="card-title text-base">Generate from Scene</h3>
                <p className="text-sm">Highlight scene → Generate Video → AI creates visual</p>
              </div>
            </div>
            <div className="card bg-secondary text-secondary-content">
              <div className="card-body">
                <h3 className="card-title text-base">Director Agent</h3>
                <p className="text-sm">Structure and pacing feedback</p>
              </div>
            </div>
            <div className="card bg-accent text-accent-content">
              <div className="card-body">
                <h3 className="card-title text-base">Chat Agent</h3>
                <p className="text-sm">Brainstorming and dialogue polish</p>
              </div>
            </div>
          </div>

          <h2>Pro Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">1. Write in Scenes</h3>
                <p className="text-sm">Don&apos;t try to format manually - Wryda does it automatically.</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">2. Use Character Tracker</h3>
                <p className="text-sm">See which characters have the most dialogue/scenes.</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">3. Export Early, Export Often</h3>
                <p className="text-sm">Export PDF backups regularly.</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">4. GitHub for Versioning</h3>
                <p className="text-sm">Best backup and collaboration tool.</p>
              </div>
            </div>
          </div>

          <h2>Fountain Quick Reference</h2>
          <div className="overflow-x-auto my-8">
            <table className="table table-zebra table-sm">
              <thead>
                <tr>
                  <th>Element</th>
                  <th>Format</th>
                  <th>Example</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Scene Heading</td>
                  <td>INT/EXT. LOCATION - TIME</td>
                  <td>INT. OFFICE - DAY</td>
                </tr>
                <tr>
                  <td>Character</td>
                  <td>ALL CAPS</td>
                  <td>JOHN</td>
                </tr>
                <tr>
                  <td>Dialogue</td>
                  <td>Under character</td>
                  <td>Regular text</td>
                </tr>
                <tr>
                  <td>Parenthetical</td>
                  <td>(text)</td>
                  <td>(angry)</td>
                </tr>
                <tr>
                  <td>Action</td>
                  <td>Regular text</td>
                  <td>John stands up.</td>
                </tr>
                <tr>
                  <td>Transition</td>
                  <td>ALL CAPS:</td>
                  <td>CUT TO:</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>What&apos;s Next?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <Link href="/help/video-generation" className="card bg-primary text-primary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Generate Videos from Scenes</h3>
                <p className="text-sm">Visualize your screenplay</p>
              </div>
            </Link>
            <Link href="/dashboard" className="card bg-secondary text-secondary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Start Writing Now</h3>
                <p className="text-sm">Go to Dashboard</p>
              </div>
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}

