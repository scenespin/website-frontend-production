import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Quick Start Guide | ${config.appName}`,
  description: "Create your first AI video in 5 minutes with our step-by-step quick start guide.",
  canonicalUrlRelative: "/help/quick-start",
});

export default function QuickStartPage() {
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
            <li>Getting Started</li>
            <li className="font-semibold">Quick Start</li>
          </ul>
        </div>

        {/* Quick Info */}
        <div className="alert alert-success mb-8">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <div>
            <div className="font-bold">Time Required: 5 minutes</div>
            <div className="text-sm">Credits Needed: 50 credits (you have this on signup!)</div>
          </div>
        </div>

        {/* Article */}
        <article className="prose prose-lg max-w-none">
          <h1>Quick Start: Your First Video 🎬</h1>

          <h2>Step 1: Sign Up (30 seconds)</h2>
          <ol>
            <li>Go to <Link href="/sign-up">wryda.ai/sign-up</Link></li>
            <li>Enter email and password</li>
            <li>Verify email</li>
            <li>You now have 50 credits!</li>
          </ol>

          <h2>Step 2: Choose Your Content Type (30 seconds)</h2>
          <p>From your dashboard, click &quot;Create New&quot;:</p>
          <ul>
            <li><strong>Text-to-Video</strong> - Generate from description</li>
            <li><strong>Image-to-Video</strong> - Animate an image</li>
            <li><strong>Workflow</strong> - Use guided templates</li>
          </ul>
          <p>Let&apos;s start with <strong>Text-to-Video</strong>.</p>

          <h2>Step 3: Write Your Prompt (2 minutes)</h2>
          <div className="alert alert-info my-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <h3 className="font-bold">Good Prompts Include:</h3>
              <ul className="text-sm list-disc list-inside">
                <li>Subject (what/who)</li>
                <li>Action (what&apos;s happening)</li>
                <li>Setting (where)</li>
                <li>Style (mood/tone)</li>
              </ul>
            </div>
          </div>

          <div className="mockup-code my-6">
            <pre data-prefix="$"><code>Example Prompt:</code></pre>
            <pre data-prefix=">" className="text-success"><code>&quot;A detective in a dark alley, rain falling,</code></pre>
            <pre data-prefix=">" className="text-success"><code>neon lights reflecting on puddles,</code></pre>
            <pre data-prefix=">" className="text-success"><code>cinematic noir style&quot;</code></pre>
          </div>

          <h3>Tips:</h3>
          <ul>
            <li>Be specific but concise (1-3 sentences)</li>
            <li>Include lighting/mood for better results</li>
            <li>Mention camera movement if desired</li>
          </ul>

          <h2>Step 4: Select Quality Tier (30 seconds)</h2>
          <div className="overflow-x-auto my-8">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Tier</th>
                  <th>Resolution</th>
                  <th>Credits</th>
                  <th>Best For</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-primary/20">
                  <td><strong>Professional</strong></td>
                  <td>1080p</td>
                  <td>50</td>
                  <td>Social media, YouTube</td>
                </tr>
                <tr>
                  <td><strong>Premium</strong></td>
                  <td>4K</td>
                  <td>75</td>
                  <td>Client work, ads</td>
                </tr>
                <tr>
                  <td><strong>Ultra</strong></td>
                  <td>4K Native</td>
                  <td>150</td>
                  <td>Film festivals, cinema</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p><strong>For your first video, choose Professional (50 credits).</strong></p>

          <h2>Step 5: Choose Aspect Ratio (15 seconds)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 not-prose my-6">
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <h3 className="font-bold text-sm">16:9 - Landscape</h3>
                <p className="text-xs opacity-70">YouTube, web</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <h3 className="font-bold text-sm">9:16 - Vertical</h3>
                <p className="text-xs opacity-70">TikTok, Reels</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <h3 className="font-bold text-sm">1:1 - Square</h3>
                <p className="text-xs opacity-70">Instagram Feed</p>
              </div>
            </div>
          </div>
          <p><strong>Choose 16:9 for now.</strong></p>

          <h2>Step 6: Generate! (1-2 minutes)</h2>
          <ol>
            <li>Click &quot;Generate Video&quot;</li>
            <li>Wait 60-120 seconds</li>
            <li>Your video is ready!</li>
          </ol>

          <h2>Step 7: Download or Edit (30 seconds)</h2>
          <p><strong>Download:</strong></p>
          <ul>
            <li>Click &quot;Download&quot; to save MP4</li>
          </ul>
          <p><strong>Edit Further:</strong></p>
          <ul>
            <li>Click &quot;Open in Timeline&quot; to add music, transitions, effects</li>
            <li>Export when done</li>
          </ul>

          <div className="alert alert-success my-8">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <h3 className="font-bold">🎉 Congratulations!</h3>
              <div className="text-sm">You just created your first AI video!</div>
            </div>
          </div>

          <h2>Pro Tips for Better Results</h2>
          <div className="grid grid-cols-1 gap-4 not-prose my-6">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">1. Be Specific</h3>
                <p className="text-sm">❌ &quot;Woman walking&quot;</p>
                <p className="text-sm">✅ &quot;Young woman in red dress walking confidently down city street at sunset&quot;</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">2. Use References</h3>
                <p className="text-sm">Upload 1-2 character images for consistency</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">3. Try Different Qualities</h3>
                <p className="text-sm">Professional for social, Ultra for clients</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">4. Save Credits</h3>
                <p className="text-sm">Use Professional tier for testing, Ultra for final</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">5. Use Workflows</h3>
                <p className="text-sm">Pre-made templates save time and credits</p>
              </div>
            </div>
          </div>

          <h2>What&apos;s Next?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <Link href="/help/quality-tiers" className="card bg-primary text-primary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Try Different Quality Tiers</h3>
                <p className="text-sm">Compare results</p>
              </div>
            </Link>
            <Link href="/help/video-generation" className="card bg-secondary text-secondary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Use Multi-Format Export</h3>
                <p className="text-sm">Create for all platforms</p>
              </div>
            </Link>
            <Link href="/help/workflows" className="card bg-accent text-accent-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Explore Workflows</h3>
                <p className="text-sm">Guided templates for complex scenes</p>
              </div>
            </Link>
            <Link href="/help/advanced/character-consistency" className="card bg-base-200 hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Learn Character Consistency</h3>
                <p className="text-sm">Keep characters looking the same</p>
              </div>
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}

