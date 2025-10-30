import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Multi-Shot Scene Building | ${config.appName}`,
  description: "Learn how to create complex scenes with multiple camera angles, shot types, and consistent characters.",
  canonicalUrlRelative: "/help/advanced/multi-shot-scenes",
});

export default function MultiShotScenesPage() {
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
            <li className="font-semibold">Multi-Shot Scenes</li>
          </ul>
        </div>

        <article className="prose prose-lg max-w-none">
          <h1>Multi-Shot Scene Building 🎬</h1>
          <p className="lead">Create professional scenes with multiple camera angles, shot types, and seamless transitions.</p>

          <h2>The Hollywood Formula</h2>
          <p>Professional scenes use multiple shot types to tell a story effectively:</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">1. Establishing Shot</h3>
                <p className="text-sm">Wide shot showing the location and context</p>
                <p className="text-xs opacity-70">Example: Wide view of interrogation room</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">2. Master Shot</h3>
                <p className="text-sm">Medium shot showing all characters</p>
                <p className="text-xs opacity-70">Example: Detective and suspect across table</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">3. Medium Shots</h3>
                <p className="text-sm">Individual character shots (waist up)</p>
                <p className="text-xs opacity-70">Example: Detective from front</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">4. Close-Ups</h3>
                <p className="text-sm">Tight shots of faces showing emotion</p>
                <p className="text-xs opacity-70">Example: Suspect&apos;s nervous expression</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">5. Insert Shots</h3>
                <p className="text-sm">Details that move the story forward</p>
                <p className="text-xs opacity-70">Example: Detective&apos;s notes</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">6. Reaction Shots</h3>
                <p className="text-sm">Character reactions to dialogue/action</p>
                <p className="text-xs opacity-70">Example: Detective&apos;s knowing look</p>
              </div>
            </div>
          </div>

          <h2>Step-by-Step Process</h2>

          <h3>Step 1: Plan Your Coverage</h3>
          <p>Before generating, list the shots you need:</p>
          <div className="mockup-code text-xs my-6">
            <pre><code>Scene: Detective Interrogation</code></pre>
            <pre><code>1. Wide - Interrogation room</code></pre>
            <pre><code>2. Medium - Detective and suspect</code></pre>
            <pre><code>3. Close - Detective face</code></pre>
            <pre><code>4. Close - Suspect nervous</code></pre>
            <pre><code>5. Insert - Case file</code></pre>
            <pre><code>6. Two-shot - Both characters, tension</code></pre>
          </div>

          <h3>Step 2: Upload Character References</h3>
          <ul>
            <li>Upload 1-2 images of each character</li>
            <li>Use the Character Bank for consistency</li>
            <li>Keep references accessible during generation</li>
          </ul>

          <h3>Step 3: Generate in Order</h3>
          <div className="alert alert-info my-8 not-prose">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <div className="font-bold">Pro Tip:</div>
              <div className="text-sm">Generate all shots in one session for best consistency</div>
            </div>
          </div>

          <h3>Step 4: Edit in Timeline</h3>
          <ul>
            <li>Import all shots into timeline editor</li>
            <li>Arrange shots for best flow</li>
            <li>Add transitions between shots</li>
            <li>Add audio, music, sound effects</li>
            <li>Export final scene</li>
          </ul>

          <h2>Common Shot Patterns</h2>

          <h3>Pattern 1: Conversation (Shot-Reverse-Shot)</h3>
          <ol>
            <li>Master shot - Both characters</li>
            <li>Over-the-shoulder - Character A speaking</li>
            <li>Over-the-shoulder - Character B responding</li>
            <li>Close-up - Character A</li>
            <li>Close-up - Character B</li>
            <li>Repeat as needed</li>
          </ol>

          <h3>Pattern 2: Action Sequence</h3>
          <ol>
            <li>Wide - Establish action space</li>
            <li>Medium - Character prepares</li>
            <li>Close - Determined face</li>
            <li>Action - Wide angle of movement</li>
            <li>Insert - Critical detail (weapon, obstacle)</li>
            <li>Close - Reaction to outcome</li>
          </ol>

          <h3>Pattern 3: Emotional Beat</h3>
          <ol>
            <li>Medium - Character alone</li>
            <li>Close - Face, emotion building</li>
            <li>Extreme close-up - Eyes or hands</li>
            <li>Insert - Object of emotion (photo, letter)</li>
            <li>Medium - Character reacts</li>
          </ol>

          <h2>Using Workflows for Multi-Shot Scenes</h2>
          <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 my-8 not-prose">
            <div className="card-body">
              <h3 className="card-title text-xl">🎬 Complete Scene Workflow</h3>
              <p className="text-sm mb-4 opacity-90">Automatically generates a complete scene package with perfect consistency across all shots. The easiest way to create professional multi-shot scenes!</p>
              <div className="badge badge-primary">145-689 credits</div>
              
              <div className="divider my-2"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xs font-bold mb-2">📝 WHAT YOU PROVIDE (Simple!):</div>
                  <ol className="text-sm space-y-2">
                    <li><strong>1. Scene Description</strong>
                      <div className="text-xs opacity-70 ml-4">Plain text or screenplay format</div>
                      <div className="text-xs italic ml-4">&quot;A detective interrogates a suspect in a dimly lit room&quot;</div>
                    </li>
                    <li><strong>2. Character Images (Optional)</strong>
                      <div className="text-xs opacity-70 ml-4">Upload 1-2 images per character</div>
                    </li>
                    <li><strong>3. Settings</strong>
                      <div className="text-xs opacity-70 ml-4">Aspect ratio (16:9, 9:16, etc.), Duration (5s or 10s), Quality (1080p or 4K)</div>
                    </li>
                  </ol>
                </div>
                
                <div>
                  <div className="text-xs font-bold mb-2">🎁 WHAT YOU GET:</div>
                  <ul className="text-sm space-y-1">
                    <li>✅ <strong>1 Master Establishing Shot</strong>
                      <div className="text-xs opacity-70 ml-5">Sets the scene aesthetic, lighting, mood</div>
                    </li>
                    <li>✅ <strong>3 Character Coverage Shots</strong>
                      <div className="text-xs opacity-70 ml-5">Close-up, medium, action angle (if you uploaded character images)</div>
                    </li>
                    <li>✅ <strong>OR 3 Scene Exploration Shots</strong>
                      <div className="text-xs opacity-70 ml-5">Different angles of the scene (if no character images)</div>
                    </li>
                    <li>✅ <strong>Perfect Scene Consistency</strong>
                      <div className="text-xs opacity-70 ml-5">All shots match lighting, color, atmosphere</div>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="divider my-2"></div>
              
              <div className="text-xs">
                <strong>💰 Cost Breakdown:</strong>
                <ul className="mt-2 space-y-1 opacity-80">
                  <li>• Basic (1080p, scene only): <strong>145-325 credits</strong></li>
                  <li>• With Characters (1080p): <strong>175-250 credits</strong></li>
                  <li>• Premium 4K Enhancement: <strong>+80 credits</strong></li>
                  <li>• Full Package (4K with characters): <strong>up to 689 credits</strong></li>
                </ul>
              </div>
              
              <div className="alert alert-success mt-4 text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <div>
                  <div className="font-bold">Pro Tip:</div>
                  <div>Start with the basic version (no characters) to test your scene idea, then add characters for the final production.</div>
                </div>
              </div>
            </div>
          </div>

          <h2>Pro Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Maintain Consistent Lighting</h3>
                <p className="text-sm">Use the same lighting description in all prompts for the scene.</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Screen Direction</h3>
                <p className="text-sm">Keep characters on the same side of the frame across shots (180° rule).</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Shot Length</h3>
                <p className="text-sm">Wide shots can be longer (5-8s), close-ups shorter (2-4s).</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title text-base">Test First</h3>
                <p className="text-sm">Generate one shot with Professional tier to test consistency before doing full scene.</p>
              </div>
            </div>
          </div>

          <h2>What&apos;s Next?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-8">
            <Link href="/help/advanced/timeline-mastery" className="card bg-primary text-primary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Timeline Editing Mastery</h3>
                <p className="text-sm">Edit your multi-shot scenes</p>
              </div>
            </Link>
            <Link href="/help/workflows" className="card bg-secondary text-secondary-content hover:shadow-xl transition-shadow">
              <div className="card-body">
                <h3 className="card-title text-base">Try Complete Scene Workflow</h3>
                <p className="text-sm">Automatic multi-shot generation</p>
              </div>
            </Link>
          </div>
        </article>
      </main>
    </>
  );
}

