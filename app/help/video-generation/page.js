import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `AI Video Generation Guide | ${config.appName}`,
  description: "Master AI video generation with text-to-video, image-to-video, and character consistency. Learn prompt writing, quality tiers, and pro workflows.",
  canonicalUrlRelative: "/help/video-generation",
});

export default function VideoGenerationPage() {
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
            <li className="font-semibold">Video Generation</li>
          </ul>
        </div>

        {/* Article */}
        <article className="prose prose-lg max-w-none">
          <h1>AI Video Generation Guide 🎬</h1>

          <h2>Generation Methods</h2>

          {/* Method 1: Text-to-Video */}
          <div className="card bg-base-200 my-8 not-prose">
            <div className="card-body">
              <h3 className="card-title text-xl">1. Text-to-Video</h3>
              <div className="grid grid-cols-2 gap-4 text-sm my-4">
                <div><strong>What:</strong> Generate video from written description</div>
                <div><strong>Credits:</strong> 50-150 per 5sec (tier dependent)</div>
                <div><strong>Best For:</strong> Creating new scenes from scratch</div>
                <div><strong>Speed:</strong> 60-180 seconds</div>
              </div>
              <h4 className="font-bold">How It Works:</h4>
              <ol className="text-sm list-decimal list-inside space-y-1">
                <li>Write descriptive prompt</li>
                <li>Choose quality tier</li>
                <li>Select aspect ratio</li>
                <li>Generate (60-180 seconds)</li>
              </ol>
              <h4 className="font-bold mt-4">Example Prompts:</h4>
              <div className="mockup-code text-xs mt-2">
                <pre><code>&quot;Detective walking through rain-soaked alley at night,</code></pre>
                <pre><code>neon signs reflecting in puddles&quot;</code></pre>
                <pre><code></code></pre>
                <pre><code>&quot;Aerial drone shot flying over mountain range at sunset,</code></pre>
                <pre><code>cinematic&quot;</code></pre>
                <pre><code></code></pre>
                <pre><code>&quot;Close-up of woman&apos;s face, tears falling, emotional,</code></pre>
                <pre><code>soft lighting&quot;</code></pre>
              </div>
            </div>
          </div>

          {/* Method 2: Image-to-Video */}
          <div className="card bg-base-200 my-8 not-prose">
            <div className="card-body">
              <h3 className="card-title text-xl">2. Image-to-Video</h3>
              <div className="grid grid-cols-2 gap-4 text-sm my-4">
                <div><strong>What:</strong> Animate a still image</div>
                <div><strong>Credits:</strong> Same as text-to-video</div>
                <div><strong>Best For:</strong> Bringing storyboards/concept art to life</div>
              </div>
              <h4 className="font-bold">How It Works:</h4>
              <ol className="text-sm list-decimal list-inside space-y-1">
                <li>Upload image (reference/first frame)</li>
                <li>Write what should happen</li>
                <li>Choose quality tier</li>
                <li>Generate</li>
              </ol>
              <h4 className="font-bold mt-4">Example Use Cases:</h4>
              <ul className="text-sm list-disc list-inside space-y-1">
                <li>Animate character design</li>
                <li>Bring storyboard panel to life</li>
                <li>Add motion to product photo</li>
                <li>Create parallax effect</li>
              </ul>
            </div>
          </div>

          {/* Method 3: Character Consistency */}
          <div className="card bg-base-200 my-8 not-prose">
            <div className="card-body">
              <h3 className="card-title text-xl">3. Character Consistency (1-3 References)</h3>
              <div className="grid grid-cols-2 gap-4 text-sm my-4">
                <div><strong>What:</strong> Keep characters looking the same across multiple shots</div>
                <div><strong>Credits:</strong> Same as standard generation</div>
                <div><strong>Best For:</strong> Multi-shot scenes, series content</div>
              </div>
              <h4 className="font-bold">How It Works:</h4>
              <ol className="text-sm list-decimal list-inside space-y-1">
                <li>Upload 1-3 reference images of character</li>
                <li>Generate first video</li>
                <li>Use that video as reference for next shots</li>
                <li>Character stays consistent</li>
              </ol>
              <div className="alert alert-info mt-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <div className="text-sm">
                  <strong>Pro Tip:</strong> Use 3 references (front, side, action) for best consistency. Professional tier works great for this.
                </div>
              </div>
            </div>
          </div>

          <h2>Aspect Ratios Explained</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <h3 className="card-title text-base">16:9 - Landscape</h3>
                <p className="text-xs opacity-70 mb-2">Most Common</p>
                <p className="text-sm"><strong>Platforms:</strong> YouTube, Vimeo, web, TV</p>
                <p className="text-sm"><strong>Resolution:</strong> 1920×1080 (Pro), 3840×2160 (Premium/Ultra)</p>
                <p className="text-sm"><strong>Best For:</strong> Traditional video content</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <h3 className="card-title text-base">9:16 - Vertical</h3>
                <p className="text-xs opacity-70 mb-2">Mobile-First</p>
                <p className="text-sm"><strong>Platforms:</strong> TikTok, Instagram Reels, YouTube Shorts</p>
                <p className="text-sm"><strong>Resolution:</strong> 1080×1920 (Pro), 2160×3840 (Premium/Ultra)</p>
                <p className="text-sm"><strong>Best For:</strong> Mobile-first content</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <h3 className="card-title text-base">1:1 - Square</h3>
                <p className="text-xs opacity-70 mb-2">Social Feed</p>
                <p className="text-sm"><strong>Platforms:</strong> Instagram Feed, Facebook, Twitter</p>
                <p className="text-sm"><strong>Resolution:</strong> 1080×1080 (Pro), 2160×2160 (Premium/Ultra)</p>
                <p className="text-sm"><strong>Best For:</strong> Social feeds</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <h3 className="card-title text-base">4:3 - Classic/Retro</h3>
                <p className="text-xs opacity-70 mb-2">Nostalgic</p>
                <p className="text-sm"><strong>Platforms:</strong> Facebook, nostalgic content</p>
                <p className="text-sm"><strong>Resolution:</strong> 1440×1080 (Pro), 2880×2160 (Premium/Ultra)</p>
                <p className="text-sm"><strong>Best For:</strong> Retro aesthetic</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body p-4">
                <h3 className="card-title text-base">21:9 - Cinema Widescreen</h3>
                <p className="text-xs opacity-70 mb-2">+15 credits premium</p>
                <p className="text-sm"><strong>Platforms:</strong> Film festivals, trailers</p>
                <p className="text-sm"><strong>Resolution:</strong> 2560×1080 (Pro), 5120×2160 (Premium/Ultra)</p>
                <p className="text-sm"><strong>Best For:</strong> Cinematic content</p>
              </div>
            </div>
          </div>

          <h2>Multi-Format Export</h2>
          <div className="alert alert-success my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <div className="font-bold text-lg">Social Bundle (120 credits)</div>
              <div className="text-sm mt-2">
                <strong>What You Get:</strong> 16:9 (landscape) + 9:16 (vertical) + 1:1 (square)
              </div>
              <div className="text-sm"><strong>Savings:</strong> 30 credits vs. generating separately</div>
              <div className="text-sm mt-2">
                <strong>How It Works:</strong> Generate once in 16:9, AI reframes to 9:16 and 1:1. Keeps focus on important elements. All 3 formats in ~2 minutes.
              </div>
            </div>
          </div>

          <h2>Writing Better Prompts</h2>
          <div className="alert alert-info my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <div className="font-bold">Prompt Structure:</div>
              <div className="text-sm mt-2">[Subject] [Action] [Setting] [Style/Mood] [Camera]</div>
              <div className="text-sm mt-2 italic">
                Example: &quot;Young woman running through cyberpunk city at night, neon lights, rain falling, cinematic wide shot&quot;
              </div>
            </div>
          </div>

          <h3>Be Specific</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-6">
            <div className="card bg-error text-error-content">
              <div className="card-body p-4">
                <h4 className="font-bold text-sm">❌ Too Vague:</h4>
                <p className="text-sm">&quot;A person walking&quot;</p>
              </div>
            </div>
            <div className="card bg-success text-success-content">
              <div className="card-body p-4">
                <h4 className="font-bold text-sm">✅ Specific:</h4>
                <p className="text-sm">&quot;Middle-aged detective in trench coat walking slowly through foggy alley, noir style&quot;</p>
              </div>
            </div>
          </div>

          <h3>Include Lighting</h3>
          <ul>
            <li>&quot;Soft morning light&quot;</li>
            <li>&quot;Dramatic side lighting&quot;</li>
            <li>&quot;Neon glow&quot;</li>
            <li>&quot;Golden hour sunset&quot;</li>
          </ul>

          <h3>Mention Camera</h3>
          <ul>
            <li>&quot;Wide establishing shot&quot;</li>
            <li>&quot;Close-up&quot;</li>
            <li>&quot;Aerial drone view&quot;</li>
            <li>&quot;Tracking shot following subject&quot;</li>
          </ul>

          <h3>Add Mood/Style</h3>
          <ul>
            <li>&quot;Cinematic&quot;</li>
            <li>&quot;Documentary style&quot;</li>
            <li>&quot;Anime style&quot;</li>
            <li>&quot;Film noir&quot;</li>
            <li>&quot;Dreamlike&quot;</li>
          </ul>

          <h2>Advanced Techniques</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">1. Shot Progression</h3>
                <p className="text-sm mb-2">Generate a sequence:</p>
                <ol className="text-sm list-decimal list-inside space-y-1">
                  <li>Wide establishing shot</li>
                  <li>Medium shot of character</li>
                  <li>Close-up of face</li>
                  <li>Insert (detail)</li>
                </ol>
                <p className="text-xs italic mt-2">Use previous video as reference for consistency.</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">2. Camera Movement</h3>
                <p className="text-sm mb-2">Specify in prompt:</p>
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>&quot;Camera slowly pushes in&quot;</li>
                  <li>&quot;Dolly shot circling around subject&quot;</li>
                  <li>&quot;Crane shot rising up&quot;</li>
                  <li>&quot;Handheld documentary style&quot;</li>
                </ul>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">3. Time of Day</h3>
                <p className="text-sm mb-2">Very important for consistency:</p>
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>&quot;Dawn, soft pink light&quot;</li>
                  <li>&quot;Midday harsh sunlight&quot;</li>
                  <li>&quot;Golden hour sunset&quot;</li>
                  <li>&quot;Night, street lights&quot;</li>
                </ul>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">4. Weather/Atmosphere</h3>
                <p className="text-sm mb-2">Adds mood:</p>
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>&quot;Heavy rain&quot;</li>
                  <li>&quot;Light fog&quot;</li>
                  <li>&quot;Dust particles in air&quot;</li>
                  <li>&quot;Snow falling&quot;</li>
                </ul>
              </div>
            </div>
          </div>

          <h2>Common Issues & Solutions</h2>
          <div className="space-y-4 not-prose my-8">
            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                Character looks different each time
              </div>
              <div className="collapse-content"> 
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>Use 3 reference images</li>
                  <li>Generate all shots in one session</li>
                  <li>Use previous video as reference for next shot</li>
                  <li>Be very specific about character details in prompt</li>
                </ul>
              </div>
            </div>
            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                Video doesn&apos;t match prompt
              </div>
              <div className="collapse-content"> 
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>Be more specific</li>
                  <li>Break complex prompts into simpler ones</li>
                  <li>Try different quality tier</li>
                  <li>Regenerate (sometimes AI needs a second try)</li>
                </ul>
              </div>
            </div>
            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                Quality not good enough
              </div>
              <div className="collapse-content"> 
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>Upgrade to Premium or Ultra tier</li>
                  <li>Use more descriptive prompts</li>
                  <li>Add lighting/camera details</li>
                  <li>Check reference images are high quality</li>
                </ul>
              </div>
            </div>
            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                Generation failed
              </div>
              <div className="collapse-content"> 
                <ul className="text-sm list-disc list-inside space-y-1">
                  <li>Credits auto-refunded</li>
                  <li>Check prompt for policy violations</li>
                  <li>Simplify prompt</li>
                  <li>Try again</li>
                </ul>
              </div>
            </div>
          </div>

          <h2>Pro Workflows</h2>
          <div className="grid grid-cols-1 gap-6 not-prose my-8">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title">Workflow 1: Social Media Content Creator</h3>
                <ol className="text-sm list-decimal list-inside space-y-1">
                  <li>Generate Professional 16:9 (50cr)</li>
                  <li>Use Social Bundle to get all formats (120cr total)</li>
                  <li>Download all 3 formats</li>
                  <li>Post across platforms</li>
                </ol>
                <div className="alert alert-success mt-4">
                  <span className="text-sm"><strong>Result:</strong> Maximum reach, 120 credits</span>
                </div>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title">Workflow 2: Client Commercial</h3>
                <ol className="text-sm list-decimal list-inside space-y-1">
                  <li>Test prompt with Professional (50cr)</li>
                  <li>Refine based on result</li>
                  <li>Generate final with Ultra (150cr)</li>
                  <li>Add music and graphics in timeline</li>
                  <li>Export 4K ProRes</li>
                </ol>
                <div className="alert alert-success mt-4">
                  <span className="text-sm"><strong>Result:</strong> Cinema-quality, 200 credits</span>
                </div>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title">Workflow 3: Film Festival Short</h3>
                <ol className="text-sm list-decimal list-inside space-y-1">
                  <li>Generate all shots with Ultra (150cr × 10 shots = 1,500cr)</li>
                  <li>Use character references for consistency</li>
                  <li>Edit in timeline</li>
                  <li>Color grade</li>
                  <li>Export 4K DCI</li>
                </ol>
                <div className="alert alert-success mt-4">
                  <span className="text-sm"><strong>Result:</strong> Festival-ready, 1,500 credits</span>
                </div>
              </div>
            </div>
          </div>

          <h2>What&apos;s Next?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 not-prose my-8">
            <Link href="/help/advanced/character-consistency" className="card bg-primary text-primary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Character Consistency</h3>
                <p className="text-sm">Keep characters the same</p>
              </div>
            </Link>
            <Link href="/help/workflows" className="card bg-secondary text-secondary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Try Workflows</h3>
                <p className="text-sm">Guided templates</p>
              </div>
            </Link>
            <Link href="/help/advanced/timeline-mastery" className="card bg-accent text-accent-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Master Timeline</h3>
                <p className="text-sm">Edit like a pro</p>
              </div>
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}

