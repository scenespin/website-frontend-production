import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Complete Features | ${config.appName}`,
  description: "Explore all 42 AI workflows, professional screenplay writing tools, multi-track timeline editor, Hollywood transitions & compositions, and more. Everything unlocked from day one.",
  canonicalUrlRelative: "/features",
});

export default function Features() {
  return (
    <>
      {/* Header */}
      <header className="p-4 flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-extrabold">
            {config.appName}<span className="text-[#DC143C]">.ai</span>
          </span>
        </Link>
        <Link href="/" className="btn btn-ghost">← Back to Home</Link>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-16">
        {/* Hero */}
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
            Complete Feature List
          </h1>
          <p className="text-xl opacity-80 max-w-3xl mx-auto">
            <strong>80+ features. 42 AI workflows. All unlocked from day one.</strong>
            <br />
            Free users get everything. Pro/Ultra/Studio just get more credits.
          </p>
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <div className="card bg-base-200">
            <div className="card-body text-center">
              <div className="text-4xl font-bold text-[#DC143C]">42</div>
              <div className="text-sm opacity-70">AI Workflows</div>
            </div>
          </div>
          <div className="card bg-base-200">
            <div className="card-body text-center">
              <div className="text-4xl font-bold text-[#DC143C]">65</div>
              <div className="text-sm opacity-70">Compositions</div>
            </div>
          </div>
          <div className="card bg-base-200">
            <div className="card-body text-center">
              <div className="text-4xl font-bold text-[#DC143C]">30</div>
              <div className="text-sm opacity-70">Transitions</div>
            </div>
          </div>
          <div className="card bg-base-200">
            <div className="card-body text-center">
              <div className="text-4xl font-bold text-[#DC143C]">80+</div>
              <div className="text-sm opacity-70">Features</div>
            </div>
          </div>
        </section>

        {/* Core Platform Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">🎬 Core Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeatureCard
              title="Professional Screenplay Editor"
              description="Full Fountain format support, real-time GitHub sync, version control integration, industry-standard formatting"
              free={true}
            />
            <FeatureCard
              title="8-Track Timeline Editor"
              description="Multi-track editing with keyframe precision, professional timeline UI, real-time preview, frame-accurate editing"
              free={true}
            />
            <FeatureCard
              title="AI Video Generation"
              description="3 quality tiers (Professional 1080p, Premium 4K, Ultra Native 4K), 5 aspect ratios (16:9, 9:16, 1:1, 4:3, 21:9)"
              free={false}
              credits="50-150 credits per 5s"
            />
            <FeatureCard
              title="Character Bank"
              description="Maintain character consistency across scenes with reference images, auto-consistency scoring, character library management"
              free={true}
            />
            <FeatureCard
              title="Voice Cloning"
              description="FREE to add your 11 Labs voice, perfect lip-sync, facial animation, emotion and expression support"
              free={true}
              note="(11 Labs subscription required)"
            />
            <FeatureCard
              title="3D Model Export"
              description="Export to GLB, OBJ, USDZ formats for use in Blender, Unity, Unreal Engine, and other 3D software"
              free={false}
              credits="20 credits per export"
            />
            <FeatureCard
              title="Cloud Storage Integration"
              description="Export to Google Drive or Dropbox, hierarchical folder structure, no vendor lock-in"
              free={true}
            />
            <FeatureCard
              title="Upload Your Own Footage"
              description="Unlimited uploads, FREE forever, combine with AI-generated content, apply transitions & compositions"
              free={true}
            />
          </div>
        </section>

        {/* 42 AI Workflows */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">⚡ 42 AI Workflows</h2>
          <p className="text-lg opacity-80 mb-8">
            Pre-built professional workflows for instant content creation. All workflows support vertical video (TikTok, Reels) and multi-format bundles.
          </p>

          {/* Photorealistic Workflows */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-4">1. Photorealistic / Live-Action (6 workflows)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WorkflowCard
                title="Hollywood Standard"
                description="Premium 5-star quality with Photon-1 → Photon Flash → Veo → Runway 4K upscale"
                stars={5}
              />
              <WorkflowCard
                title="Budget Photorealistic"
                description="Fast & affordable (Photon Flash → Photon Flash x3 → Ray Flash)"
                stars={4}
              />
              <WorkflowCard
                title="Multi-Platform Hero"
                description="Single generation optimized for multiple social platforms with smart reframing"
                stars={5}
              />
              <WorkflowCard
                title="Precision Poser"
                description="Character positioning with keyframes for exact poses"
                stars={4}
              />
              <WorkflowCard
                title="Cinematic Camera Suite"
                description="Professional camera movements (dolly, crane, tracking shots)"
                stars={5}
              />
              <WorkflowCard
                title="Scene Composer"
                description="Professional composition templates (Rule of Thirds, Golden Ratio)"
                stars={5}
              />
            </div>
          </div>

          {/* Animated Workflows */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-4">2. Animated (3 workflows)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WorkflowCard
                title="Anime Master"
                description="Anime-style character generation with consistent art style"
                stars={5}
              />
              <WorkflowCard
                title="Cartoon Classic"
                description="Western cartoon style with exaggerated animations"
                stars={5}
              />
              <WorkflowCard
                title="3D Character"
                description="Pixar-style 3D animated characters"
                stars={5}
              />
            </div>
          </div>

          {/* Hybrid Workflows */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-4">3. Hybrid & Transformation (7 workflows)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WorkflowCard
                title="Action Director"
                description="Multi-angle action sequences with perfect character consistency"
                stars={5}
              />
              <WorkflowCard
                title="Reality-to-Toon"
                description="Transform live-action reference to animated style"
                stars={5}
              />
              <WorkflowCard
                title="Style Chameleon"
                description="Same scene in multiple artistic styles"
                stars={5}
              />
              <WorkflowCard
                title="Reverse Action Builder"
                description="Generate action sequence, then play in reverse for creative effects"
                stars={4}
              />
              <WorkflowCard
                title="Bidirectional Storytelling"
                description="Scene plays forward and backward seamlessly"
                stars={5}
              />
              <WorkflowCard
                title="Voice Actor Match"
                description="Generate character dialog with perfect lip-sync using AI"
                stars={5}
              />
              <WorkflowCard
                title="Production Pipeline"
                description="Complete production from script to final edit"
                stars={5}
              />
            </div>
          </div>

          {/* Fantasy & VFX */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-4">4. Fantasy & VFX (2 workflows)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WorkflowCard
                title="Fantasy Epic"
                description="Fantasy worlds with creatures, magic effects"
                stars={5}
              />
              <WorkflowCard
                title="Superhero Transform"
                description="Superhero transformations and power effects"
                stars={5}
              />
            </div>
          </div>

          {/* Animals & Creatures */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-4">5. Animals & Creatures (2 workflows)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WorkflowCard
                title="Animal Kingdom"
                description="Realistic animal characters and behaviors"
                stars={5}
              />
              <WorkflowCard
                title="Anthro Character"
                description="Anthropomorphic animal characters (Zootopia-style)"
                stars={5}
              />
            </div>
          </div>

          {/* Budget / Speed */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-4">6. Budget / Speed (7 workflows)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WorkflowCard
                title="Speed Demon"
                description="Ultra-fast generation (under 2 minutes)"
                stars={3}
              />
              <WorkflowCard
                title="Micro Action Loop"
                description="Short looping action clips for social media"
                stars={4}
              />
              <WorkflowCard
                title="Multi-Platform Loop"
                description="Single loop reframed for all social platforms"
                stars={4}
              />
              <WorkflowCard
                title="Perfect Loop Generator"
                description="Seamless looping videos (start frame = end frame)"
                stars={4}
              />
              <WorkflowCard
                title="Loop Variations"
                description="Generate 5 variations of a looping clip"
                stars={4}
              />
              <WorkflowCard
                title="Budget Loop 2"
                description="Additional budget loop variation"
                stars={3}
              />
              <WorkflowCard
                title="Speed Loop V2"
                description="Alternative fast loop generation"
                stars={3}
              />
            </div>
          </div>

          {/* Production Tools */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-4">7. Production Tools (7 workflows)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WorkflowCard
                title="Scene Bridge"
                description="Generate transition between two existing video clips"
                stars={4}
              />
              <WorkflowCard
                title="Video Chain Builder"
                description="Chain multiple videos with consistent style"
                stars={5}
              />
              <WorkflowCard
                title="Genre Camera Variants"
                description="Same scene with genre-specific camera styles (horror, comedy, action)"
                stars={5}
              />
              <WorkflowCard
                title="Shot Type Variants"
                description="Same scene with different shot types (close-up, medium, wide)"
                stars={5}
              />
              <WorkflowCard
                title="B-Roll Master"
                description="Professional B-roll: establishing shots, cutaways, environmental footage"
                stars={5}
              />
              <WorkflowCard
                title="Coverage Master"
                description="Generate complete coverage for a scene (master, OTS, close-ups)"
                stars={5}
              />
              <WorkflowCard
                title="Scene Variants"
                description="Multiple variations of same scene (different lighting, time of day)"
                stars={4}
              />
            </div>
          </div>

          {/* Performance Capture */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-4">8. Performance Capture (8 workflows)</h3>
            <p className="text-sm opacity-70 mb-4">&quot;Be the Character&quot; - Upload your performance, get stylized output</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WorkflowCard
                title="Anime Performance Capture"
                description="Upload your performance, get anime-style output"
                stars={5}
              />
              <WorkflowCard
                title="3D Performance Capture"
                description="Upload your performance, get 3D animated output"
                stars={5}
              />
              <WorkflowCard
                title="Cartoon Performance Capture"
                description="Upload your performance, get cartoon-style output"
                stars={5}
              />
              <WorkflowCard
                title="Anthro Performance Capture"
                description="Upload your performance, get anthro animal character output"
                stars={5}
              />
              <WorkflowCard
                title="Action Director Performance"
                description="Upload action performance, get multi-angle action sequence"
                stars={5}
              />
              <WorkflowCard
                title="Reality-to-Toon Performance"
                description="Upload live-action, get animated transformation"
                stars={5}
              />
              <WorkflowCard
                title="Complete Scene Performance"
                description="Upload performance for complete scene package"
                stars={5}
              />
              <WorkflowCard
                title="Production Pipeline Performance"
                description="Upload performance for full production pipeline"
                stars={5}
              />
            </div>
          </div>

          {/* Dialogue Workflows */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-4">9. Dialogue & Conversation (2 workflows)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WorkflowCard
                title="Standard Dialogue Generation"
                description="AI-generated character dialogue with video + voice + perfect lip-sync (4-8 seconds)"
                stars={5}
                credits="400 credits"
              />
              <WorkflowCard
                title="Extended & Cinema Dialogue"
                description="Extended dialogue clips with cinema format support (4-12 seconds, 21:9 cinema)"
                stars={5}
                credits="450-750 credits"
              />
            </div>
          </div>
        </section>

        {/* Compositions & Transitions */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">🎨 Compositions & Transitions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title">65 Professional Compositions</h3>
                <ul className="text-sm space-y-1">
                  <li>• 38 Static Layouts (split screens, PIP, grids)</li>
                  <li>• 21 Audio-Enabled Layouts (spatial audio, auto-ducking, 5.1 surround, Dolby Atmos)</li>
                  <li>• 6 Animated Compositions (motion graphics, dynamic transitions)</li>
                </ul>
                <div className="badge badge-success">FREE</div>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title">30 Hollywood Transitions</h3>
                <ul className="text-sm space-y-1">
                  <li>• Whip pans & camera swipes</li>
                  <li>• Glitch effects & digital transitions</li>
                  <li>• Vintage film burns & light leaks</li>
                  <li>• Professional crossfades & dissolves</li>
                </ul>
                <div className="badge badge-success">FREE</div>
              </div>
            </div>
          </div>
        </section>

        {/* Advanced Features */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">🚀 Advanced Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              title="Multi-Provider Orchestration"
              description="Intelligent routing across multiple AI providers for optimal quality and cost"
              free={true}
            />
            <FeatureCard
              title="GitHub Integration"
              description="Version control for screenplays, multi-user collaboration, branch management"
              free={true}
            />
            <FeatureCard
              title="Stripe Billing System"
              description="Credit-based billing (1 credit = $0.01), subscription management, usage tracking"
              free={true}
            />
            <FeatureCard
              title="Asset Management"
              description="Organize all user assets in beautiful folder structures in Drive/Dropbox"
              free={true}
            />
            <FeatureCard
              title="Export System"
              description="Multiple formats, GPU-accelerated rendering, quality presets, batch export"
              free={true}
            />
            <FeatureCard
              title="Collaboration Tools"
              description="Role-based access control, real-time collaboration, activity tracking"
              free={true}
            />
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-16 bg-base-200 rounded-box">
          <h2 className="text-3xl font-bold mb-4">Ready to Create?</h2>
          <p className="text-lg opacity-80 mb-8">
            Sign up for free and get 100 credits to start. All features unlocked from day one.
          </p>
          <Link href="/dashboard" className="btn btn-primary btn-lg">
            Start Free (100 Credits)
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z" clipRule="evenodd" />
            </svg>
          </Link>
        </section>
      </main>
    </>
  );
}

function FeatureCard({ title, description, free, credits, note }) {
  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h3 className="card-title text-lg">{title}</h3>
        <p className="text-sm opacity-80">{description}</p>
        {note && <p className="text-xs opacity-60 italic">{note}</p>}
        <div className="card-actions justify-end mt-2">
          {free ? (
            <div className="badge badge-success">FREE</div>
          ) : (
            <div className="badge badge-primary">{credits}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function WorkflowCard({ title, description, stars, credits }) {
  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body p-4">
        <div className="flex justify-between items-start">
          <h4 className="font-semibold text-sm">{title}</h4>
          <div className="text-yellow-500 text-xs">
            {"⭐".repeat(stars)}
          </div>
        </div>
        <p className="text-xs opacity-70">{description}</p>
        {credits && (
          <div className="text-xs text-primary font-semibold mt-1">{credits}</div>
        )}
      </div>
    </div>
  );
}

