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
              
              {/* Post-Production */}
              <div className="bg-base-100 rounded-lg p-4 mb-3">
                <div className="font-bold text-sm mb-2">🎨 Post-Production (7 workflows)</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs opacity-70 mb-1">Enhance existing footage:</div>
                    <ul className="text-xs space-y-1">
                      <li>• Scene Bridge (connect clips)</li>
                      <li>• Video Chain Builder</li>
                      <li>• VFX Magic (add effects)</li>
                      <li>• Scene Transformer (change environment)</li>
                    </ul>
                  </div>
                  <div>
                    <ul className="text-xs space-y-1">
                      <li>• Element Eraser (remove objects)</li>
                      <li>• Product Reshoot (transform products)</li>
                      <li>• Still Photo Performer (animate photos)</li>
                    </ul>
                  </div>
                </div>
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

