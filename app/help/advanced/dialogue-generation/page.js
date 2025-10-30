import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Dialogue Generation Guide | ${config.appName}`,
  description: "Create realistic character conversations with perfect lip-sync, facial animation, and emotion support.",
  canonicalUrlRelative: "/help/advanced/dialogue-generation",
});

export default function DialogueGenerationPage() {
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
            <li className="font-semibold">Dialogue Generation</li>
          </ul>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Dialogue Generation Guide 🗣️</h1>
          <p className="lead">Create realistic character conversations with AI-generated video, voice, and perfect lip-sync.</p>

          <h2>What is Dialogue Generation?</h2>
          <p>Dialogue Generation creates a complete package:</p>
          <ul>
            <li>✅ Video of character speaking</li>
            <li>✅ AI-generated voice (or your cloned voice)</li>
            <li>✅ Perfect lip-sync animation</li>
            <li>✅ Facial expressions and emotions</li>
          </ul>

          <div className="alert alert-warning my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <div>
              <div className="font-bold">Higher Cost:</div>
              <div className="text-sm">Dialogue generation costs 400-700 credits per clip (vs. 50-150 for regular video) due to advanced lip-sync technology.</div>
            </div>
          </div>

          <h2>Pricing</h2>
          <div className="overflow-x-auto my-8">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Duration</th>
                  <th>Credits</th>
                  <th>USD</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Standard</strong></td>
                  <td>≤8 sec</td>
                  <td>400</td>
                  <td>$4.00</td>
                </tr>
                <tr>
                  <td><strong>Extended</strong></td>
                  <td>9-12 sec</td>
                  <td>700</td>
                  <td>$7.00</td>
                </tr>
                <tr>
                  <td><strong>Cinema (+21:9)</strong></td>
                  <td>+8 sec</td>
                  <td>+50</td>
                  <td>+$0.50</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>How to Generate Dialogue</h2>

          <h3>Step 1: Write Your Script</h3>
          <div className="mockup-code text-xs my-6">
            <pre><code>JOHN</code></pre>
            <pre><code>I&apos;ve been waiting for you.</code></pre>
            <pre><code></code></pre>
            <pre><code>SARAH</code></pre>
            <pre><code>(nervous)</code></pre>
            <pre><code>I&apos;m sorry I&apos;m late. Traffic was terrible.</code></pre>
          </div>

          <h3>Step 2: Set Up Characters</h3>
          <ul>
            <li>Upload 1-2 reference images of each character</li>
            <li>Or use characters from your Character Bank</li>
            <li>Assign voice to each character (AI or cloned)</li>
          </ul>

          <h3>Step 3: Choose Settings</h3>
          <ul>
            <li><strong>Duration:</strong> ≤8 sec or 9-12 sec</li>
            <li><strong>Aspect Ratio:</strong> 16:9, 9:16, 1:1, 4:3, 21:9</li>
            <li><strong>Emotion:</strong> Neutral, happy, sad, angry, surprised</li>
            <li><strong>Environment:</strong> Where conversation takes place</li>
          </ul>

          <h3>Step 4: Generate</h3>
          <ol>
            <li>Click &quot;Generate Dialogue&quot;</li>
            <li>Wait 2-4 minutes</li>
            <li>Review result</li>
            <li>Regenerate if needed (credits refunded)</li>
          </ol>

          <h2>Voice Options</h2>

          <h3>AI Voices</h3>
          <ul>
            <li>50+ professional AI voices</li>
            <li>Male, female, various ages</li>
            <li>Multiple accents and languages</li>
            <li>Emotion support</li>
          </ul>

          <h3>Cloned Voices (External Service)</h3>
          <div className="alert alert-info my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <div className="font-bold">FREE to connect your voice cloning service!</div>
              <div className="text-sm">You only pay for your voice cloning subscription, not extra in Wryda.ai</div>
            </div>
          </div>
          <ul>
            <li>Clone your own voice using external service</li>
            <li>Perfect for narration, characters</li>
            <li>Maintains voice consistency</li>
            <li>Emotion and intonation support</li>
          </ul>

          <h2>Best Practices</h2>

          <h3>Writing for Dialogue Generation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <div className="card bg-success text-success-content">
              <div className="card-body">
                <h4 className="font-bold text-sm">✅ Good:</h4>
                <ul className="text-xs list-disc list-inside space-y-1">
                  <li>Short sentences (≤15 words)</li>
                  <li>Natural speech patterns</li>
                  <li>Clear emotion indicators</li>
                  <li>Avoid complex words</li>
                </ul>
              </div>
            </div>
            <div className="card bg-error text-error-content">
              <div className="card-body">
                <h4 className="font-bold text-sm">❌ Avoid:</h4>
                <ul className="text-xs list-disc list-inside space-y-1">
                  <li>Long, complex sentences</li>
                  <li>Technical jargon</li>
                  <li>Unclear emotion</li>
                  <li>Exceeding time limit</li>
                </ul>
              </div>
            </div>
          </div>

          <h3>Emotion Control</h3>
          <p>Add emotion indicators in your script:</p>
          <div className="mockup-code text-xs my-6">
            <pre><code>JOHN</code></pre>
            <pre><code>(angry)</code></pre>
            <pre><code>Where have you been?!</code></pre>
            <pre><code></code></pre>
            <pre><code>SARAH</code></pre>
            <pre><code>(defensive)</code></pre>
            <pre><code>It&apos;s none of your business!</code></pre>
          </div>

          <h3>Timing Tips</h3>
          <ul>
            <li><strong>Standard (≤8 sec):</strong> 12-20 words max</li>
            <li><strong>Extended (9-12 sec):</strong> 20-35 words max</li>
            <li>Shorter = better lip-sync accuracy</li>
            <li>Break long dialogue into multiple clips</li>
          </ul>

          <h2>Common Issues</h2>
          <div className="space-y-4 not-prose my-8">
            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                Lip-sync not matching
              </div>
              <div className="collapse-content text-sm"> 
                <ul className="list-disc list-inside space-y-1">
                  <li>Shorten the dialogue</li>
                  <li>Use clearer pronunciation</li>
                  <li>Try different voice</li>
                  <li>Regenerate (sometimes needs a second try)</li>
                </ul>
              </div>
            </div>
            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                Emotion doesn&apos;t match voice
              </div>
              <div className="collapse-content text-sm"> 
                <ul className="list-disc list-inside space-y-1">
                  <li>Add emotion indicator in parentheses</li>
                  <li>Choose voice that supports emotion</li>
                  <li>Use punctuation (! for excitement, ... for trailing off)</li>
                </ul>
              </div>
            </div>
            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" /> 
              <div className="collapse-title font-medium">
                Dialogue too long
              </div>
              <div className="collapse-content text-sm"> 
                <ul className="list-disc list-inside space-y-1">
                  <li>Break into 2-3 shorter clips</li>
                  <li>Use Extended tier (9-12 sec) if needed</li>
                  <li>Edit clips together in timeline</li>
                </ul>
              </div>
            </div>
          </div>

          <h2>Pro Workflow</h2>
          <div className="card bg-base-200 my-8 not-prose">
            <div className="card-body">
              <h3 className="card-title">Conversation Scene</h3>
              <ol className="text-sm list-decimal list-inside space-y-1 mt-2">
                <li>Generate Character A dialogue (400cr)</li>
                <li>Generate Character B dialogue (400cr)</li>
                <li>Generate wide shot of both (50cr)</li>
                <li>Import all to timeline</li>
                <li>Arrange as shot-reverse-shot</li>
                <li>Add transitions</li>
                <li>Export final scene</li>
              </ol>
              <div className="badge badge-primary mt-4">Total: 850 credits</div>
            </div>
          </div>

          <h2>What&apos;s Next?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <Link href="/help/advanced/character-consistency" className="card bg-primary text-primary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Character Consistency</h3>
                <p className="text-sm">Keep characters the same</p>
              </div>
            </Link>
            <Link href="/help/advanced/multi-shot-scenes" className="card bg-secondary text-secondary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Multi-Shot Scenes</h3>
                <p className="text-sm">Build complete conversations</p>
              </div>
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}

