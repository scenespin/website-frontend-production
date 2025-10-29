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
              <div className="font-bold">Upload 1-3 reference images of your character</div>
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

