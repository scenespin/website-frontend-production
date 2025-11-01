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
          <h1>✍️ Write Page: Your AI-Powered Screenplay Editor</h1>
          <p className="lead">Professional Fountain-format screenplay editor with 3 specialized AI writing agents. Write naturally, get instant help, and let the AI handle the heavy lifting while you focus on storytelling.</p>

          <div className="alert alert-success my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <div className="font-bold">🚀 What Makes This Different?</div>
              <div className="text-sm">Industry-standard Fountain format • 3 AI writing agents • Context-aware assistance • Auto-saves every 2 seconds • Always FREE</div>
            </div>
          </div>

          <div className="alert alert-info my-6 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <div className="font-bold">💡 The Killer Feature:</div>
              <div className="text-sm">Contextual AI assistance! Our AI agents know what scene you're in, which characters are present, and where you are in your story. Get relevant help exactly when you need it.</div>
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

          <h2>🤖 The 3 AI Writing Agents</h2>
          <p>Your personal writing team, available 24/7. Each agent specializes in different aspects of screenwriting.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 not-prose my-8">
            <div className="card bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-2 border-purple-500/30">
              <div className="card-body">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  🎬 Screenwriter Agent
                </h3>
                <p className="text-sm opacity-80 mb-3">Your brainstorming partner for story development and structure</p>
                <div className="text-xs space-y-2">
                  <div><strong>Best For:</strong></div>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Story ideation & concept development</li>
                    <li>Plot structure & act breakdowns</li>
                    <li>Character backstories & motivations</li>
                    <li>Solving plot holes</li>
                    <li>"I'm stuck - what happens next?"</li>
                  </ul>
                  <div className="pt-2"><strong>Example Prompts:</strong></div>
                  <ul className="list-disc list-inside space-y-1 opacity-70">
                    <li>"Help me structure a three-act thriller"</li>
                    <li>"What are 5 ways this scene could end?"</li>
                    <li>"Is my protagonist's motivation clear?"</li>
                  </ul>
                </div>
                <div className="badge badge-sm badge-primary mt-3">0.1-2 credits per use</div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-pink-500/10 to-pink-600/10 border-2 border-pink-500/30">
              <div className="card-body">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  🎭 Director Agent
                </h3>
                <p className="text-sm opacity-80 mb-3">Generates complete scenes with dialogue and visual direction</p>
                <div className="text-xs space-y-2">
                  <div><strong>Best For:</strong></div>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Writing entire scenes from scratch</li>
                    <li>Character-specific dialogue</li>
                    <li>Action sequences & blocking</li>
                    <li>Visual storytelling direction</li>
                    <li>Emotional beats & subtext</li>
                  </ul>
                  <div className="pt-2"><strong>Example Prompts:</strong></div>
                  <ul className="list-disc list-inside space-y-1 opacity-70">
                    <li>"Write a tense confrontation between Sarah and her boss"</li>
                    <li>"Create an action scene: car chase"</li>
                    <li>"Generate dialogue for a breakup scene"</li>
                  </ul>
                </div>
                <div className="badge badge-sm badge-secondary mt-3">0.5-2 credits per scene</div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-cinema-gold/10 to-cinema-gold/20 border-2 border-cinema-gold/30">
              <div className="card-body">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  ✨ Polish Agent
                </h3>
                <p className="text-sm opacity-80 mb-3">Refines dialogue, tightens prose, fixes formatting</p>
                <div className="text-xs space-y-2">
                  <div><strong>Best For:</strong></div>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Making dialogue sound natural</li>
                    <li>Tightening scene descriptions</li>
                    <li>Grammar & formatting fixes</li>
                    <li>Adding subtext to dialogue</li>
                    <li>Quick rewrites & improvements</li>
                  </ul>
                  <div className="pt-2"><strong>How to Use:</strong></div>
                  <ul className="list-disc list-inside space-y-1 opacity-70">
                    <li><strong>Mobile:</strong> Select text → Tap ✨ FAB button</li>
                    <li><strong>Desktop:</strong> Place cursor → Ctrl+/ → Ask for polish</li>
                    <li>Works on selected text only!</li>
                  </ul>
                </div>
                <div className="badge badge-sm badge-accent mt-3">0.1-1 credit per edit</div>
              </div>
            </div>
          </div>

          <div className="alert alert-warning my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <div>
              <div className="font-bold">💎 AI Agents are Nearly FREE!</div>
              <div className="text-sm">
                <strong>Cost Comparison:</strong> AI Agents (0.1-2 cr) vs Video Generation (25-30 cr) = <strong>25-75x cheaper!</strong><br/>
                <strong>Translation:</strong> FREE users (10 cr/month) get 5-100 agent conversations. Pro users get essentially UNLIMITED!
              </div>
            </div>
          </div>

          <h2>📝 How to Access AI Agents</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose my-8">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">💻 Desktop</h3>
                <ol className="text-sm list-decimal list-inside space-y-2">
                  <li>Press <kbd className="kbd kbd-sm">Ctrl+/</kbd> (or ⌘+/ on Mac)</li>
                  <li>AI panel slides out from right</li>
                  <li>Select agent from dropdown (Screenwriter or Director)</li>
                  <li>Type your request</li>
                  <li>Copy AI's response into your script</li>
                </ol>
                <div className="divider text-xs opacity-50">OR</div>
                <p className="text-sm"><strong>For Polish Agent:</strong></p>
                <ol className="text-sm list-decimal list-inside space-y-2">
                  <li>Place cursor where you want to edit</li>
                  <li>Press <kbd className="kbd kbd-sm">Ctrl+/</kbd></li>
                  <li>Ask: "Make this dialogue more natural"</li>
                  <li>AI rewrites based on cursor context!</li>
                </ol>
              </div>
            </div>

            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">📱 Mobile</h3>
                <ol className="text-sm list-decimal list-inside space-y-2">
                  <li>Tap ✨ button in header</li>
                  <li>AI panel slides up from bottom</li>
                  <li>Select agent (Screenwriter or Director)</li>
                  <li>Type your request</li>
                  <li>Copy AI's response into script</li>
                </ol>
                <div className="divider text-xs opacity-50">Polish Agent (Mobile Only)</div>
                <p className="text-sm"><strong>Quick Rewrite Feature:</strong></p>
                <ol className="text-sm list-decimal list-inside space-y-2">
                  <li>Select text you want to improve</li>
                  <li>Floating ✨ button appears</li>
                  <li>Tap it</li>
                  <li>AI automatically loads selected text</li>
                  <li>Ask: "Make this better"</li>
                  <li>Copy improved version back!</li>
                </ol>
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

          <h2>🧭 Contextual Navigation (Cross-Page Awareness)</h2>
          <p>Wryda tracks where you are in your screenplay and makes all pages contextually aware. No more manual searching!</p>

          <div className="card bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30 my-8 not-prose">
            <div className="card-body">
              <h3 className="font-bold text-lg mb-3">🎯 How It Works</h3>
              <div className="text-sm space-y-3">
                <p><strong>Scenario:</strong> You're writing Scene 15 in the editor (INT. APARTMENT - NIGHT, SARAH and JOHN arguing)</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="badge badge-sm badge-primary flex-shrink-0">1</span>
                    <div>
                      <strong>Switch to Story Beats →</strong> Page automatically scrolls to the beat containing Scene 15 (e.g., "Midpoint Crisis")
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="badge badge-sm badge-secondary flex-shrink-0">2</span>
                    <div>
                      <strong>Switch to Characters →</strong> SARAH and JOHN appear at the top of the list (they're in your current scene!)
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="badge badge-sm badge-accent flex-shrink-0">3</span>
                    <div>
                      <strong>Switch to Production →</strong> Scene 15 is already loaded in Scene Builder, ready to generate videos!
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="badge badge-sm badge-info flex-shrink-0">4</span>
                    <div>
                      <strong>Switch to Timeline →</strong> Scrolls to clips from Scene 15 (if any exist), all highlighted and ready to edit
                    </div>
                  </div>
                </div>
                <p className="pt-3 font-semibold">✨ <strong>Everywhere you go, the context follows you!</strong> No manual searching for scenes, characters, or beats.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose my-8">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">📍 Bidirectional Navigation</h3>
                <div className="text-sm space-y-2">
                  <p><strong>From Editor → Other Pages:</strong></p>
                  <ul className="list-disc list-inside space-y-1 opacity-80">
                    <li>Context automatically flows to all pages</li>
                    <li>Pages open at relevant position</li>
                    <li>Current scene/beat/character highlighted</li>
                  </ul>
                  <p className="pt-2"><strong>From Other Pages → Editor:</strong></p>
                  <ul className="list-disc list-inside space-y-1 opacity-80">
                    <li>Click any scene in Story Beats → Editor jumps to that scene</li>
                    <li>Click a scene in Character list → Editor jumps there</li>
                    <li>Click a location scene → Editor opens at that scene</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">💾 Remembers Your Position</h3>
                <div className="text-sm space-y-2">
                  <p><strong>Close and Reopen:</strong></p>
                  <ul className="list-disc list-inside space-y-1 opacity-80">
                    <li>Close app at Scene 15</li>
                    <li>Open next day</li>
                    <li>Automatically returns to Scene 15!</li>
                    <li>All pages ready for Scene 15 work</li>
                  </ul>
                  <p className="pt-2"><strong>Smart Suggestions:</strong></p>
                  <ul className="list-disc list-inside space-y-1 opacity-80">
                    <li>App detects: "Scene 8 has dialogue but no videos"</li>
                    <li>Shows banner: "Generate videos for Scene 8?"</li>
                    <li>Click → Production opens with Scene 8 loaded!</li>
                  </ul>
                </div>
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

