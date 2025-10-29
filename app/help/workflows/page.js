import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `AI Workflows Guide | ${config.appName}`,
  description: "Use 42 pre-built professional workflows for instant content creation. Character consistency guaranteed, saves time and credits.",
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
          <p>Pre-configured, multi-step processes that guide you through complex video production tasks.</p>

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

          <h2>Workflow Categories (42 Total)</h2>

          {/* Category 1: Photorealistic */}
          <div className="card bg-base-200 my-8 not-prose">
            <div className="card-body">
              <h3 className="card-title">1. Photorealistic Production (6 workflows)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="card bg-base-100">
                  <div className="card-body p-4">
                    <h4 className="font-bold text-sm">Hollywood Standard</h4>
                    <p className="text-xs mb-2">Premium 5-star quality</p>
                    <ul className="text-xs list-disc list-inside space-y-1">
                      <li>Multiple angles of same scene</li>
                      <li>Character consistency built-in</li>
                    </ul>
                    <div className="badge badge-primary mt-2">139 credits</div>
                  </div>
                </div>
                <div className="card bg-base-100">
                  <div className="card-body p-4">
                    <h4 className="font-bold text-sm">Multi-Platform Hero</h4>
                    <p className="text-xs mb-2">Generate once, get all formats</p>
                    <ul className="text-xs list-disc list-inside space-y-1">
                      <li>16:9, 9:16, 1:1 automatically</li>
                      <li>Smart reframing</li>
                    </ul>
                    <div className="badge badge-primary mt-2">50-120 credits</div>
                  </div>
                </div>
                <div className="card bg-base-100">
                  <div className="card-body p-4">
                    <h4 className="font-bold text-sm">Budget Photorealistic</h4>
                    <p className="text-xs mb-2">Fast & affordable</p>
                    <ul className="text-xs list-disc list-inside space-y-1">
                      <li>Still great quality</li>
                      <li>Optimized workflow</li>
                    </ul>
                    <div className="badge badge-primary mt-2">85 credits</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category 2: Animated */}
          <div className="card bg-base-200 my-8 not-prose">
            <div className="card-body">
              <h3 className="card-title">2. Animated Content (3 workflows)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="card bg-base-100">
                  <div className="card-body p-4">
                    <h4 className="font-bold text-sm">Anime Master</h4>
                    <p className="text-xs mb-2">Anime art style</p>
                    <div className="badge badge-primary mt-2">173 credits</div>
                  </div>
                </div>
                <div className="card bg-base-100">
                  <div className="card-body p-4">
                    <h4 className="font-bold text-sm">Cartoon Classic</h4>
                    <p className="text-xs mb-2">Western cartoon style</p>
                    <div className="badge badge-primary mt-2">160 credits</div>
                  </div>
                </div>
                <div className="card bg-base-100">
                  <div className="card-body p-4">
                    <h4 className="font-bold text-sm">3D Character</h4>
                    <p className="text-xs mb-2">Pixar-style 3D</p>
                    <div className="badge badge-primary mt-2">165 credits</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category 3: Action & VFX */}
          <div className="card bg-base-200 my-8 not-prose">
            <div className="card-body">
              <h3 className="card-title">3. Action & VFX (6 workflows)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="card bg-base-100">
                  <div className="card-body p-4">
                    <h4 className="font-bold text-sm">Action Director</h4>
                    <p className="text-xs mb-2">Multi-angle action sequences</p>
                    <div className="badge badge-primary mt-2">155 credits</div>
                  </div>
                </div>
                <div className="card bg-base-100">
                  <div className="card-body p-4">
                    <h4 className="font-bold text-sm">Superhero Transform</h4>
                    <p className="text-xs mb-2">Transformation & power effects</p>
                    <div className="badge badge-primary mt-2">180 credits</div>
                  </div>
                </div>
                <div className="card bg-base-100">
                  <div className="card-body p-4">
                    <h4 className="font-bold text-sm">Fantasy Epic</h4>
                    <p className="text-xs mb-2">Fantasy worlds with magic</p>
                    <div className="badge badge-primary mt-2">195 credits</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category 4: Professional Production */}
          <div className="card bg-base-200 my-8 not-prose">
            <div className="card-body">
              <h3 className="card-title">4. Professional Production (9 workflows)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="card bg-base-100">
                  <div className="card-body p-4">
                    <h4 className="font-bold text-sm">B-Roll Master</h4>
                    <p className="text-xs mb-2">Professional B-roll shots</p>
                    <div className="badge badge-primary mt-2">75-150 credits</div>
                  </div>
                </div>
                <div className="card bg-base-100">
                  <div className="card-body p-4">
                    <h4 className="font-bold text-sm">Location Previs</h4>
                    <p className="text-xs mb-2">Multiple location angles</p>
                    <div className="badge badge-primary mt-2">120 credits</div>
                  </div>
                </div>
                <div className="card bg-base-100">
                  <div className="card-body p-4">
                    <h4 className="font-bold text-sm">VFX Elements</h4>
                    <p className="text-xs mb-2">Fire, smoke, particles</p>
                    <div className="badge badge-primary mt-2">Varies</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category 5: Budget-Friendly */}
          <div className="card bg-base-200 my-8 not-prose">
            <div className="card-body">
              <h3 className="card-title">5. Budget-Friendly (6 workflows)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="card bg-base-100">
                  <div className="card-body p-4">
                    <h4 className="font-bold text-sm">Speed Demon</h4>
                    <p className="text-xs mb-2">Ultra-fast generation</p>
                    <div className="badge badge-primary mt-2">40 credits</div>
                  </div>
                </div>
                <div className="card bg-base-100">
                  <div className="card-body p-4">
                    <h4 className="font-bold text-sm">Loop Variations</h4>
                    <p className="text-xs mb-2">Seamless looping videos</p>
                    <div className="badge badge-primary mt-2">110 credits</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category 6: Character Animation */}
          <div className="card bg-base-200 my-8 not-prose">
            <div className="card-body">
              <h3 className="card-title">6. Character Animation (12 workflows)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="card bg-base-100">
                  <div className="card-body p-4">
                    <h4 className="font-bold text-sm">Performance Capture</h4>
                    <p className="text-xs mb-2">Facial animation & emotion tracking</p>
                    <div className="badge badge-primary mt-2">200+ credits</div>
                  </div>
                </div>
                <div className="card bg-base-100">
                  <div className="card-body p-4">
                    <h4 className="font-bold text-sm">Lip Sync Master</h4>
                    <p className="text-xs mb-2">Perfect dialogue animation</p>
                    <div className="badge badge-primary mt-2">185 credits</div>
                  </div>
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
            <Link href="/dashboard" className="card bg-primary text-primary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Browse Workflows</h3>
                <p className="text-sm">Explore all 42 options</p>
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

