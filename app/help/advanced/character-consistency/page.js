import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Character Consistency Guide | ${config.appName}`,
  description: "Keep characters looking the same across multiple shots with reference images and consistency techniques.",
  canonicalUrlRelative: "/help/advanced/character-consistency",
});

export default function CharacterConsistencyPage() {
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
            <li className="font-semibold">Character Consistency</li>
          </ul>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Character Consistency Guide 🎭</h1>
          <p className="lead">Keep characters looking the same across multiple shots using reference images and smart techniques.</p>

          <h2>The Challenge</h2>
          <p>AI video generation creates each shot independently. Without proper techniques, the same character can look different in each shot - different face, hair, clothes, or proportions.</p>

          <h2>The Solution: Reference Images</h2>
          <div className="alert alert-success my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <div className="font-bold">Upload 1-2 reference images of your character</div>
              <div className="text-sm">The AI will use these to keep the character consistent across all generations.</div>
            </div>
          </div>

          <h3>Best Practices for Reference Images:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 not-prose my-6">
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="card-title text-sm">Image 1: Front View</h4>
                <p className="text-xs">Clear, well-lit face shot looking at camera</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="card-title text-sm">Image 2: Side View</h4>
                <p className="text-xs">Profile shot showing character&apos;s silhouette</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="card-title text-sm">Image 3: Action/Full Body</h4>
                <p className="text-xs">Character in motion or full-body pose</p>
              </div>
            </div>
          </div>

          <h2>Techniques for Consistency</h2>

          <h3>1. Use Video-to-Video References</h3>
          <ol>
            <li>Generate your first shot with reference images</li>
            <li>Download that video</li>
            <li>Use it as a reference for your next shot</li>
            <li>Character stays consistent</li>
          </ol>

          <h3>2. Generate All Shots in One Session</h3>
          <p>The AI maintains better consistency when generating multiple shots in the same session. Don&apos;t close your browser between shots.</p>

          <h3>3. Be Specific in Prompts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-6">
            <div className="card bg-error text-error-content">
              <div className="card-body p-4">
                <h4 className="font-bold text-sm">❌ Vague:</h4>
                <p className="text-sm">&quot;A woman&quot;</p>
              </div>
            </div>
            <div className="card bg-success text-success-content">
              <div className="card-body p-4">
                <h4 className="font-bold text-sm">✅ Specific:</h4>
                <p className="text-sm">&quot;30-year-old woman with long brown hair, blue eyes, wearing red jacket&quot;</p>
              </div>
            </div>
          </div>

          <h2>🎨 Character Pose Packages (NEW!)</h2>
          <p>For ultimate character consistency, generate complete pose packages with multiple pre-defined poses and angles in a single workflow.</p>

          <div className="alert alert-info my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <div className="font-bold">🆕 Automated Pose Generation</div>
              <div className="text-sm">Generate 6-30 poses automatically from a single character reference - perfect for complex productions requiring multiple character angles.</div>
            </div>
          </div>

          <h3>Available Pose Packages:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 not-prose my-6">
            <div className="card bg-base-200 border-2 border-base-300">
              <div className="card-body p-4">
                <h4 className="card-title text-sm">📦 Standard (6 poses)</h4>
                <p className="text-xs mb-2">Front, Side, 3/4, Back, Close-up, Full Body</p>
                <div className="badge badge-sm">120 credits</div>
              </div>
            </div>
            <div className="card bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50">
              <div className="card-body p-4">
                <h4 className="card-title text-sm">⭐ Premium (12 poses)</h4>
                <p className="text-xs mb-2">+ Expressions, emotions, poses</p>
                <div className="badge badge-sm badge-primary">220 credits</div>
                <div className="badge badge-sm badge-secondary mt-1">RECOMMENDED</div>
              </div>
            </div>
            <div className="card bg-base-200 border-2 border-base-300">
              <div className="card-body p-4">
                <h4 className="card-title text-sm">🎬 Cinematic (20 poses)</h4>
                <p className="text-xs mb-2">+ Action poses, complex movements</p>
                <div className="badge badge-sm">360 credits</div>
              </div>
            </div>
          </div>

          <h3>When to Use Pose Packages:</h3>
          <ul>
            <li>✅ <strong>Multi-scene productions</strong> - Character appears in 5+ scenes</li>
            <li>✅ <strong>Complex character movement</strong> - Need multiple angles and poses</li>
            <li>✅ <strong>Professional series</strong> - Recurring characters across episodes</li>
            <li>✅ <strong>Time-saving</strong> - Generate all poses once instead of one-by-one</li>
            <li>✅ <strong>Maximum consistency</strong> - All poses generated together for perfect matching</li>
          </ul>

          <h3>How to Generate a Pose Package:</h3>
          <ol>
            <li>Go to Production → <strong>Characters</strong> tab</li>
            <li>Select an existing character or create a new one</li>
            <li>Click <strong>&quot;Generate Pose Package&quot;</strong></li>
            <li>Choose package tier (Standard/Premium/Cinematic)</li>
            <li>AI generates all poses automatically in 3-5 minutes</li>
            <li>Review and use poses in Scene Builder or workflows</li>
          </ol>

          <div className="alert alert-success my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <div className="font-bold">💡 Pro Workflow</div>
              <div className="text-sm">Start with Standard package (6 poses) to test. If you like the results and need more variety, upgrade to Premium or Cinematic. Each tier builds on the previous one.</div>
            </div>
          </div>

          <h3>What&apos;s Included in Each Tier:</h3>
          <div className="overflow-x-auto my-6">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Pose Type</th>
                  <th>Standard</th>
                  <th>Premium</th>
                  <th>Cinematic</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Camera Angles</td>
                  <td>4 angles</td>
                  <td>4 angles</td>
                  <td>6 angles</td>
                </tr>
                <tr>
                  <td>Expressions</td>
                  <td>Neutral only</td>
                  <td>5 emotions</td>
                  <td>8 emotions</td>
                </tr>
                <tr>
                  <td>Body Poses</td>
                  <td>2 basic</td>
                  <td>3 poses</td>
                  <td>6 complex poses</td>
                </tr>
                <tr>
                  <td>Generation Time</td>
                  <td>2-3 min</td>
                  <td>4-5 min</td>
                  <td>6-8 min</td>
                </tr>
                <tr>
                  <td>Best For</td>
                  <td>Testing</td>
                  <td>Most projects</td>
                  <td>Action scenes</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>4. Use Character Bank</h3>
          <p>Save your character references in the Character Bank. This allows you to:</p>
          <ul>
            <li>Reuse the same character across projects</li>
            <li>Track consistency scores</li>
            <li>Manage multiple characters</li>
            <li>Share characters with team members</li>
          </ul>

          <h3>5. Use Workflows</h3>
          <p>Many workflows have built-in character consistency. They use the same reference images across all shots automatically.</p>

          <h2>Pro Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Quality Matters</h3>
                <p className="text-sm">High-quality reference images = better consistency. Use 1080p+ images.</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Consistent Lighting</h3>
                <p className="text-sm">Describe lighting the same way in all prompts: &quot;soft natural lighting&quot;</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Same Clothing</h3>
                <p className="text-sm">Keep clothing consistent unless the scene requires a change.</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Test with Professional Tier</h3>
                <p className="text-sm">Test consistency with Professional (50cr) before committing to Ultra (150cr).</p>
              </div>
            </div>
          </div>

          <h2>Troubleshooting</h2>
          <div className="space-y-4 not-prose my-8">
            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                Character still looks different
              </div>
              <div className="collapse-content text-sm"> 
                <ul className="list-disc list-inside space-y-1">
                  <li>Add more reference images (use 3 instead of 1)</li>
                  <li>Be more specific in your prompts</li>
                  <li>Use the same lighting description</li>
                  <li>Try a different quality tier</li>
                </ul>
              </div>
            </div>
            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                Face changes between shots
              </div>
              <div className="collapse-content text-sm"> 
                <ul className="list-disc list-inside space-y-1">
                  <li>Upload a clear close-up of the face</li>
                  <li>Use video-to-video reference</li>
                  <li>Generate shots in the same session</li>
                </ul>
              </div>
            </div>
            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                Clothing changes unexpectedly
              </div>
              <div className="collapse-content text-sm"> 
                <ul className="list-disc list-inside space-y-1">
                  <li>Explicitly describe clothing in every prompt</li>
                  <li>Use reference image showing the outfit clearly</li>
                  <li>Consider using a workflow with built-in consistency</li>
                </ul>
              </div>
            </div>
          </div>

          <h2>What&apos;s Next?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <Link href="/help/advanced/multi-shot-scenes" className="card bg-primary text-primary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Multi-Shot Scene Building</h3>
                <p className="text-sm">Create complex scenes</p>
              </div>
            </Link>
            <Link href="/help/workflows" className="card bg-secondary text-secondary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Try Workflows</h3>
                <p className="text-sm">Built-in consistency</p>
              </div>
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}

