import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Why Fountain Format? | ${config.appName}`,
  description: "Learn why Fountain screenplay format gives you better AI results, paste-and-go imports, and professional PDF exports - all FREE compared to Final Draft's $250/year.",
  canonicalUrlRelative: "/help/fountain-format",
});

export default function FountainFormatHelp() {
  return (
    <>
      {/* Header */}
      <header className="bg-base-200 border-b border-base-300">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/help" className="text-sm breadcrumbs">
            <ul>
              <li><Link href="/help">Help Center</Link></li>
              <li>Why Fountain Format?</li>
            </ul>
          </Link>
          <Link href="/dashboard" className="btn btn-sm btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <span>🎬</span>
            <span>Industry Standard</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Why Fountain Format?
          </h1>
          <p className="text-xl opacity-80 max-w-2xl mx-auto">
            Fountain is the industry-standard screenplay format that powers better AI results, instant imports, and professional exports.
          </p>
        </div>

        {/* Quick Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <div className="card bg-success/10 border-2 border-success/30">
            <div className="card-body">
              <h3 className="card-title text-success">🚀 Better AI Results</h3>
              <p className="text-sm">AI reads your screenplay structure - knows WHO, WHERE, and WHAT in every scene</p>
            </div>
          </div>
          <div className="card bg-primary/10 border-2 border-primary/30">
            <div className="card-body">
              <h3 className="card-title text-primary">⚡ 3-Second Import</h3>
              <p className="text-sm">Paste screenplay → Auto-extract 40+ characters, 60+ locations, 120+ scenes</p>
            </div>
          </div>
          <div className="card bg-warning/10 border-2 border-warning/30">
            <div className="card-body">
              <h3 className="card-title text-warning">💼 Professional PDFs</h3>
              <p className="text-sm">Export WGA/Academy-standard PDFs with scene bookmarks</p>
            </div>
          </div>
          <div className="card bg-info/10 border-2 border-info/30">
            <div className="card-body">
              <h3 className="card-title text-info">🆓 $0 vs $250/year</h3>
              <p className="text-sm">Final Draft charges $250/year. We give you the same for FREE.</p>
            </div>
          </div>
        </div>

        {/* What is Fountain? */}
        <section className="prose prose-lg max-w-none mb-12">
          <h2>What is Fountain?</h2>
          <p>
            Fountain is a plain-text markup language for screenwriting. Think of it like <strong>Markdown for screenplays</strong>. 
            It&apos;s become the industry standard for modern screenwriting because it&apos;s:
          </p>
          <ul>
            <li><strong>Simple:</strong> Write in any text editor</li>
            <li><strong>Universal:</strong> Compatible with Final Draft, Fade In, Highland, Writer Duet</li>
            <li><strong>Version-control friendly:</strong> Works perfectly with Git/GitHub</li>
            <li><strong>No vendor lock-in:</strong> Plain text files you own forever</li>
          </ul>
        </section>

        {/* Why We Use Fountain */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Why We Use Fountain</h2>
          
          <div className="space-y-8">
            {/* 1. Contextual AI */}
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-2xl">
                  <span className="text-4xl mr-3">🧠</span>
                  1. Contextual AI Integration (The Game-Changer)
                </h3>
                <p className="text-base-content/80 mb-4">
                  Our AI doesn&apos;t just read text - it <strong>understands screenplay structure</strong>:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-base-300 rounded-lg p-4">
                    <div className="font-mono text-sm mb-2 text-primary">Scene Headings</div>
                    <pre className="text-xs bg-base-100 p-3 rounded overflow-x-auto"><code>INT. COFFEE SHOP - DAY</code></pre>
                    <div className="text-xs opacity-70 mt-2">
                      → AI knows: Interior, coffee shop, daytime lighting
                    </div>
                  </div>

                  <div className="bg-base-300 rounded-lg p-4">
                    <div className="font-mono text-sm mb-2 text-primary">Character Names</div>
                    <pre className="text-xs bg-base-100 p-3 rounded overflow-x-auto"><code>{`SARAH
I need to finish this script.`}</code></pre>
                    <div className="text-xs opacity-70 mt-2">
                      → AI knows: SARAH speaking, tracks across scenes
                    </div>
                  </div>

                  <div className="bg-base-300 rounded-lg p-4">
                    <div className="font-mono text-sm mb-2 text-primary">Action Lines</div>
                    <pre className="text-xs bg-base-100 p-3 rounded overflow-x-auto"><code>{`The door SLAMS open.
John enters, out of breath.`}</code></pre>
                    <div className="text-xs opacity-70 mt-2">
                      → AI understands: Action, sound, entrance, urgency
                    </div>
                  </div>

                  <div className="bg-base-300 rounded-lg p-4">
                    <div className="font-mono text-sm mb-2 text-primary">Character Relationships</div>
                    <pre className="text-xs bg-base-100 p-3 rounded overflow-x-auto"><code>{`SARAH and MARCUS argue.`}</code></pre>
                    <div className="text-xs opacity-70 mt-2">
                      → AI tracks: Who&apos;s in scene, relationship dynamics
                    </div>
                  </div>
                </div>

                <div className="alert alert-success mt-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span><strong>Result:</strong> Better AI-generated videos because the AI has narrative context, not just isolated prompts.</span>
                </div>
              </div>
            </div>

            {/* 2. Paste-and-Go */}
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-2xl">
                  <span className="text-4xl mr-3">⚡</span>
                  2. Paste-and-Go Import (The Magic Feature)
                </h3>
                <p className="text-base-content/80 mb-4">
                  Copy ANY screenplay. Paste into {config.appName}. <strong>3 seconds later:</strong>
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-success/20 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-success mb-1">40+</div>
                    <div className="text-sm">Characters Extracted</div>
                  </div>
                  <div className="bg-primary/20 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-primary mb-1">60+</div>
                    <div className="text-sm">Locations Created</div>
                  </div>
                  <div className="bg-warning/20 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-warning mb-1">120+</div>
                    <div className="text-sm">Scenes Organized</div>
                  </div>
                </div>

                <div className="mockup-code text-xs">
                  <pre data-prefix="1"><code>User pastes 120-page screenplay</code></pre>
                  <pre data-prefix="2" className="text-warning"><code>AI analyzes Fountain structure...</code></pre>
                  <pre data-prefix="3" className="text-success"><code>✓ Extracted all characters with descriptions</code></pre>
                  <pre data-prefix="4" className="text-success"><code>✓ Created location library</code></pre>
                  <pre data-prefix="5" className="text-success"><code>✓ Built scene breakdown</code></pre>
                  <pre data-prefix="6" className="text-primary"><code>Ready to generate videos!</code></pre>
                </div>

                <div className="alert alert-info mt-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span><strong>Competitor Equivalent:</strong> None. Manual data entry only.</span>
                </div>
              </div>
            </div>

            {/* 3. Professional PDF Export */}
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-2xl">
                  <span className="text-4xl mr-3">📄</span>
                  3. Professional PDF Export
                </h3>
                <p className="text-base-content/80 mb-4">
                  Export broadcast-ready PDFs that meet industry standards:
                </p>

                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-success shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong>WGA/Academy formatting standards</strong> - Courier 12pt, proper margins</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-success shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong>Scene heading bookmarks</strong> - Navigate your PDF like a pro</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-success shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong>Smart page breaks</strong> - No orphaned scenes or dialogue</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-success shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong>Professional pagination</strong> - Ready for agents, producers, festivals</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 4. No Vendor Lock-In */}
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-2xl">
                  <span className="text-4xl mr-3">🔓</span>
                  4. No Vendor Lock-In
                </h3>
                <p className="text-base-content/80 mb-4">
                  Plain text = freedom. Your screenplay works with:
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-base-300 rounded p-3 text-center text-sm">Final Draft</div>
                  <div className="bg-base-300 rounded p-3 text-center text-sm">Fade In</div>
                  <div className="bg-base-300 rounded p-3 text-center text-sm">Highland</div>
                  <div className="bg-base-300 rounded p-3 text-center text-sm">Writer Duet</div>
                  <div className="bg-base-300 rounded p-3 text-center text-sm">VS Code</div>
                  <div className="bg-base-300 rounded p-3 text-center text-sm">GitHub</div>
                  <div className="bg-base-300 rounded p-3 text-center text-sm">Git</div>
                  <div className="bg-base-300 rounded p-3 text-center text-sm">Any Text Editor</div>
                </div>

                <div className="alert mt-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-info shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span>Your screenplay is a plain <code>.fountain</code> text file. You own it. Forever.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Competitive Comparison */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Fountain vs Competitors</h2>
          
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th className="text-success">{config.appName} (Fountain)</th>
                  <th>Adobe Premiere</th>
                  <th>CapCut</th>
                  <th>Final Draft</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-semibold">Screenplay Editor</td>
                  <td className="text-success">✅ FREE</td>
                  <td>❌</td>
                  <td>❌</td>
                  <td>✅ $250/yr</td>
                </tr>
                <tr>
                  <td className="font-semibold">Video Production</td>
                  <td className="text-success">✅ FREE</td>
                  <td>✅ $55/mo</td>
                  <td>✅ $20/mo</td>
                  <td>❌</td>
                </tr>
                <tr>
                  <td className="font-semibold">AI Integration</td>
                  <td className="text-success">✅ Contextual</td>
                  <td>❌</td>
                  <td>⚠️ Basic</td>
                  <td>❌</td>
                </tr>
                <tr>
                  <td className="font-semibold">Auto-Import</td>
                  <td className="text-success">✅ Paste-and-go</td>
                  <td>❌</td>
                  <td>❌</td>
                  <td>❌</td>
                </tr>
                <tr>
                  <td className="font-semibold">PDF Export</td>
                  <td className="text-success">✅ WGA standard</td>
                  <td>❌</td>
                  <td>❌</td>
                  <td>✅</td>
                </tr>
                <tr>
                  <td className="font-semibold">No Vendor Lock-In</td>
                  <td className="text-success">✅ Plain text</td>
                  <td>❌</td>
                  <td>❌</td>
                  <td>❌</td>
                </tr>
                <tr className="font-bold bg-base-300">
                  <td>Total Cost</td>
                  <td className="text-2xl text-success">$0/month</td>
                  <td className="text-error">$55/month</td>
                  <td className="text-error">$20/month</td>
                  <td className="text-error">$250/year</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick Start */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6">Quick Start: Basic Fountain Syntax</h2>
          
          <div className="space-y-4">
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold mb-2">Scene Headings</h4>
                <pre className="bg-base-300 p-4 rounded text-sm overflow-x-auto"><code>{`INT. BEDROOM - NIGHT
EXT. PARK - DAY
INT./EXT. CAR - DAWN`}</code></pre>
              </div>
            </div>

            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold mb-2">Character Dialogue</h4>
                <pre className="bg-base-300 p-4 rounded text-sm overflow-x-auto"><code>{`SARAH
I can't believe this is happening.

JOHN
(nervous)
We need to go. Now.`}</code></pre>
              </div>
            </div>

            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="font-bold mb-2">Action</h4>
                <pre className="bg-base-300 p-4 rounded text-sm overflow-x-auto"><code>{`Sarah runs to the window. Rain POUNDS the glass.

The door BURSTS open. Marcus enters, gun drawn.`}</code></pre>
              </div>
            </div>
          </div>

          <div className="alert alert-success mt-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span><strong>That&apos;s it!</strong> Write naturally. The AI understands the structure and generates better results.</span>
          </div>
        </section>

        {/* Learn More Links */}
        <section className="bg-base-200 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold mb-6">Ready to Try Fountain?</h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/editor" className="btn btn-primary btn-lg">
              Open Screenplay Editor
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z" clipRule="evenodd" />
              </svg>
            </Link>
            <Link href="/help/screenplay-editor" className="btn btn-outline btn-lg">
              Screenplay Editor Guide
            </Link>
          </div>

          <div className="divider my-8">More Resources</div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <Link href="/help/reference/formats" className="card bg-base-100 hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h4 className="font-semibold">📖 Fountain Syntax Reference</h4>
                <p className="text-sm opacity-70">Complete guide to Fountain formatting</p>
              </div>
            </Link>
            <Link href="/help/screenplay-editor" className="card bg-base-100 hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h4 className="font-semibold">📝 Import/Export Guide</h4>
                <p className="text-sm opacity-70">How to import scripts and export PDFs</p>
              </div>
            </Link>
            <Link href="/help/quick-start" className="card bg-base-100 hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h4 className="font-semibold">🚀 Quick Start Tutorial</h4>
                <p className="text-sm opacity-70">Get started in 5 minutes</p>
              </div>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
