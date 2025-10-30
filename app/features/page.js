import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Complete Features | ${config.appName}`,
  description: "Explore all 47 AI workflows, professional screenplay writing tools, multi-track timeline editor, Hollywood transitions & compositions, and more. Everything unlocked from day one.",
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
            <strong>80+ features. 47 AI workflows. All unlocked from day one.</strong>
            <br />
            Free users get everything. Pro/Ultra/Studio just get more credits.
          </p>
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <div className="card bg-base-200">
            <div className="card-body text-center">
              <div className="text-4xl font-bold text-[#DC143C]">47</div>
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
              title="Custom Voice-Overs (11 Labs Integration)"
              description="Add custom narration and voice-overs using your own 11 Labs voices. Perfect for tutorials, documentaries, and background narration. Does NOT include character lip-sync."
              free={true}
              note="(FREE integration - bring your own 11 Labs API key)"
            />
            <FeatureCard
              title="Character Dialogue & Lip-Sync (AI Workflows)"
              description="Generate characters speaking with perfect lip-sync and facial animation using our AI workflows. Upload audio or describe dialogue, get fully animated talking characters."
              free={false}
              credits="400+ credits per scene"
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

        {/* 47 AI Workflows */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">⚡ 47 AI Workflows</h2>
          <p className="text-lg opacity-80 mb-8">
            Pre-built professional workflows for instant content creation. All workflows support vertical video (TikTok, Reels) and multi-format bundles.
          </p>

          {/* Browse by Input Type */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">🎯 Browse by Input Type:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <a href="/help/workflows#text-only" className="card bg-gradient-to-br from-green-500/10 to-green-600/10 border-2 border-green-500/30 hover:border-green-500 transition-colors">
                <div className="card-body p-4">
                  <div className="text-green-500 font-bold">✍️ Text Only (18)</div>
                  <div className="text-xs opacity-70">Start from description alone</div>
                </div>
              </a>
              <a href="/help/workflows#text-images" className="card bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-2 border-orange-500/30 hover:border-orange-500 transition-colors">
                <div className="card-body p-4">
                  <div className="text-orange-500 font-bold">🖼️ Text + Images (14)</div>
                  <div className="text-xs opacity-70">Character consistency required</div>
                </div>
              </a>
              <a href="/help/workflows#video-transform" className="card bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-2 border-purple-500/30 hover:border-purple-500 transition-colors">
                <div className="card-body p-4">
                  <div className="text-purple-500 font-bold">🎬 Video Transform (15)</div>
                  <div className="text-xs opacity-70">Upload & transform footage</div>
                </div>
              </a>
            </div>
          </div>

          {/* Browse by Category */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">📂 Browse by Category:</h3>
            <div className="space-y-4">
              {/* Photorealistic */}
              <div className="collapse collapse-arrow bg-base-200">
                <input type="radio" name="workflow-category" defaultChecked />
                <div className="collapse-title text-lg font-semibold">
                  🎥 Photorealistic / Live-Action <span className="text-sm opacity-70">(6 workflows)</span>
                </div>
                <div className="collapse-content">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <WorkflowCard
                title="Hollywood Standard"
                description="The gold standard for professional video production. Multi-step processing delivers cinema-grade quality that rivals traditional film production—at a fraction of the cost."
                stars={5}
              />
              <WorkflowCard
                title="Budget Photorealistic"
                description="Fast and affordable photorealistic generation optimized for speed and cost efficiency. Still delivers impressive quality—perfect for rapid prototyping, social media content, and high-volume production."
                stars={4}
              />
              <WorkflowCard
                title="Multi-Platform Hero"
                description="Generate once, optimize for all platforms automatically. Intelligent reframing for YouTube (16:9), TikTok (9:16), Instagram (1:1), and more. Maximum reach with minimum effort."
                stars={5}
              />
              <WorkflowCard
                title="Precision Poser"
                description="Control exact character positioning using keyframe-based pose guidance. Perfect for matching specific choreography, dance moves, or reference footage with frame-perfect accuracy."
                stars={4}
              />
              <WorkflowCard
                title="Cinematic Camera Suite"
                description="Professional camera movements including dollies, crane shots, tracking moves, and complex camera choreography. Hollywood-grade cinematography without the Hollywood crew."
                stars={5}
              />
              <WorkflowCard
                title="Scene Composer"
                description="Apply professional composition rules automatically: Rule of Thirds, Golden Ratio, leading lines, and balanced framing for visually compelling storytelling."
                stars={5}
              />
                  </div>
                </div>
              </div>

              {/* Animated */}
              <div className="collapse collapse-arrow bg-base-200">
                <input type="radio" name="workflow-category" />
                <div className="collapse-title text-lg font-semibold">
                  🎨 Animated Styles <span className="text-sm opacity-70">(3 workflows)</span>
                </div>
                <div className="collapse-content">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <WorkflowCard
                title="Anime Master"
                description="Authentic anime-style generation with consistent art direction, proper shading techniques, and maintained character features across all scenes. Perfect for anime creators and storytellers."
                stars={5}
              />
              <WorkflowCard
                title="Cartoon Classic"
                description="Western cartoon aesthetics with exaggerated expressions, squash-and-stretch animation principles, and vibrant color palettes. Perfect for comedy, family content, and animated storytelling."
                stars={5}
              />
              <WorkflowCard
                title="3D Character"
                description="High-quality 3D animated characters with professional lighting, realistic materials, and premium rendering. Industry-grade 3D animation for professional animated content."
                stars={5}
              />
                  </div>
                </div>
              </div>

              {/* Hybrid & Transformation */}
              <div className="collapse collapse-arrow bg-base-200">
                <input type="radio" name="workflow-category" />
                <div className="collapse-title text-lg font-semibold">
                  🔄 Hybrid & Transformation <span className="text-sm opacity-70">(7 workflows)</span>
                </div>
                <div className="collapse-content">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <WorkflowCard
                title="Action Director"
                description="Create multi-angle action sequences with guaranteed character consistency. Automatically generates master shots, close-ups, and reaction angles for dynamic, professional action scenes."
                stars={5}
                helpLink="/help/advanced/multi-shot-scenes"
              />
              <WorkflowCard
                title="Reality-to-Toon"
                description="Transform live-action reference footage into any animated style while preserving motion, timing, and performance. Revolutionary for creators who want animation without traditional animation skills."
                stars={5}
              />
              <WorkflowCard
                title="Style Chameleon"
                description="Generate the same scene across multiple artistic styles simultaneously. Perfect for client presentations, creative exploration, and finding the perfect visual direction for your project."
                stars={5}
              />
              <WorkflowCard
                title="Reverse Action Builder"
                description="Create action sequences designed to play in reverse. Generates physics-accurate motion that looks intentional when reversed—perfect for dramatic effect and time-manipulation narratives."
                stars={4}
              />
              <WorkflowCard
                title="Bidirectional Storytelling"
                description="Scenes that work perfectly playing forward or backward. Used for loop-based content, time-travel narratives, or artistic reversals. Mathematically perfect symmetry."
                stars={5}
              />
              <WorkflowCard
                title="Voice Actor Match"
                description="Generate character dialogue with perfect lip-sync, facial animation, and emotional performance. Sync any audio track to your characters with frame-perfect accuracy."
                stars={5}
                helpLink="/help/advanced/dialogue-generation"
              />
              <WorkflowCard
                title="Production Pipeline"
                description="Complete end-to-end workflow from script breakdown to final edit. Automated scene generation, coverage, and assembly for maximum production efficiency."
                stars={5}
              />
                  </div>
                </div>
              </div>

              {/* Fantasy & VFX */}
              <div className="collapse collapse-arrow bg-base-200">
                <input type="radio" name="workflow-category" />
                <div className="collapse-title text-lg font-semibold">
                  ✨ Fantasy & VFX <span className="text-sm opacity-70">(2 workflows)</span>
                </div>
                <div className="collapse-content">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <WorkflowCard
                title="Fantasy Epic"
                description="Create immersive fantasy worlds with mythical creatures, magical effects, and otherworldly environments. Includes particle effects, atmospheric lighting, and epic scale for world-building."
                stars={5}
              />
              <WorkflowCard
                title="Superhero Transform"
                description="Dramatic transformation sequences with power effects, energy auras, costume changes, and heroic poses. Perfect for action content, superhero stories, and dramatic character reveals."
                stars={5}
              />
                  </div>
                </div>
              </div>

              {/* Animals & Creatures */}
              <div className="collapse collapse-arrow bg-base-200">
                <input type="radio" name="workflow-category" />
                <div className="collapse-title text-lg font-semibold">
                  🦁 Animals & Creatures <span className="text-sm opacity-70">(2 workflows)</span>
                </div>
                <div className="collapse-content">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <WorkflowCard
                title="Animal Kingdom"
                description="Realistic animal characters with accurate anatomy, natural behaviors, and lifelike movements. From domestic pets to wildlife—documentary-quality animal footage with complete control."
                stars={5}
              />
              <WorkflowCard
                title="Anthro Character"
                description="Anthropomorphic animal characters with expressive faces and human-like gestures. Talking animals perfect for animated storytelling, mascots, and character-driven narratives."
                stars={5}
                helpLink="/help/advanced/character-consistency"
              />
                  </div>
                </div>
              </div>

              {/* Budget / Speed */}
              <div className="collapse collapse-arrow bg-base-200">
                <input type="radio" name="workflow-category" />
                <div className="collapse-title text-lg font-semibold">
                  ⚡ Budget / Speed <span className="text-sm opacity-70">(7 workflows)</span>
                </div>
                <div className="collapse-content">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <WorkflowCard
                title="Speed Demon"
                description="Ultra-fast generation in under 2 minutes. Generate from text alone or add optional Character Bank for consistency. Perfect for rapid ideation, storyboarding, and testing concepts quickly."
                stars={3}
              />
              <WorkflowCard
                title="Micro Action Loop"
                description="Short, seamless looping action clips (2-4 seconds) perfect for social media, GIFs, and attention-grabbing content. Optimized for viral potential on TikTok and Reels."
                stars={4}
              />
              <WorkflowCard
                title="Multi-Platform Loop"
                description="Generate one perfect loop, automatically reframed for all social platforms. Creates 16:9, 9:16, 1:1, and 4:3 versions from a single generation—maximum platform reach."
                stars={4}
              />
              <WorkflowCard
                title="Perfect Loop Generator"
                description="Mathematically perfect seamless loops where the end frame matches the start frame exactly. Creates infinite replay-able content for backgrounds, ambiance, and hypnotic visuals."
                stars={4}
              />
              <WorkflowCard
                title="Loop Variations"
                description="Generate 5 style variations of the same looping clip. Test different moods, colors, times of day, or weather conditions to find the perfect look for your content."
                stars={4}
              />
              <WorkflowCard
                title="Budget Loop 2"
                description="Additional budget-friendly loop variation with lower credit cost. Great for bulk content creation and testing loop concepts before investing in premium quality."
                stars={3}
              />
              <WorkflowCard
                title="Speed Loop V2"
                description="Alternative ultra-fast loop generation with different optimization settings. Balances speed and loop quality for rapid content production and high-volume workflows."
                stars={3}
              />
                  </div>
                </div>
              </div>

              {/* Production Tools */}
              <div className="collapse collapse-arrow bg-base-200">
                <input type="radio" name="workflow-category" />
                <div className="collapse-title text-lg font-semibold">
                  🎬 Production Tools <span className="text-sm opacity-70">(7 workflows)</span>
                </div>
                <div className="collapse-content">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <WorkflowCard
                title="Scene Bridge"
                description="Generate smooth transitions between two existing clips. AI analyzes both scenes to create a seamless bridge shot that connects them naturally—perfect for coverage gaps."
                stars={4}
              />
              <WorkflowCard
                title="Video Chain Builder"
                description="Chain multiple video clips together while maintaining consistent style, lighting, and atmosphere. Perfect for montages and sequences with unified visual language."
                stars={5}
              />
              <WorkflowCard
                title="Genre Camera Variants"
                description="Generate the same scene with different genre-specific camera work: horror (handheld shaky), comedy (bright steady), action (dynamic tracking), and more. Perfect for finding your style."
                stars={5}
              />
              <WorkflowCard
                title="Shot Type Variants"
                description="Automatically generate multiple shot types from one scene: wide establishing, medium coverage, close-ups, and inserts. Complete professional coverage from a single prompt."
                stars={5}
                helpLink="/help/advanced/multi-shot-scenes"
              />
              <WorkflowCard
                title="B-Roll Master"
                description="Generate professional B-roll footage: establishing shots, cutaways, environmental details, and atmospheric footage to enhance your main narrative. Essential for documentary-style content."
                stars={5}
              />
              <WorkflowCard
                title="Coverage Master"
                description="Complete scene coverage workflow: generates master shot, over-the-shoulder angles, close-ups, and reaction shots. TV/film production standard coverage automatically."
                stars={5}
                helpLink="/help/advanced/multi-shot-scenes"
              />
              <WorkflowCard
                title="Scene Variants"
                description="Generate multiple variations of the same scene with different lighting conditions, time of day, weather, or mood. Perfect for client options, A/B testing, or creative exploration."
                stars={4}
              />
                  </div>
                </div>
              </div>

              {/* Performance Capture */}
              <div className="collapse collapse-arrow bg-base-200">
                <input type="radio" name="workflow-category" />
                <div className="collapse-title text-lg font-semibold">
                  🎭 Performance Capture <span className="text-sm opacity-70">(8 workflows)</span>
                </div>
                <div className="collapse-content">
                  <p className="text-sm opacity-70 mb-4 pt-2">&quot;Be the Character&quot; - Upload your performance, get stylized output</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WorkflowCard
                title="Anime Performance Capture"
                description="Upload your own video performance, get it transformed into anime style while preserving your movements, expressions, and timing. Perfect for anime creators without traditional animation skills."
                stars={5}
              />
              <WorkflowCard
                title="3D Performance Capture"
                description="Convert your performance into high-quality 3D animation. Your acting drives the 3D character—no mocap suit required. Industry-grade 3D animation from your webcam."
                stars={5}
              />
              <WorkflowCard
                title="Cartoon Performance Capture"
                description="Transform your performance into classic Western cartoon style with exaggerated expressions and squash-and-stretch animation. Your performance, cartoonified in seconds."
                stars={5}
              />
              <WorkflowCard
                title="Anthro Performance Capture"
                description="Become an anthropomorphic animal character. Upload your performance, get a talking animal version. Ideal for animated stories, mascot content, and character-driven narratives."
                stars={5}
                helpLink="/help/advanced/character-consistency"
              />
              <WorkflowCard
                title="Action Director Performance"
                description="Upload one action performance, get multi-angle coverage automatically. Creates master, close-ups, and reaction shots from your single performance—complete professional coverage."
                stars={5}
                helpLink="/help/advanced/multi-shot-scenes"
              />
              <WorkflowCard
                title="Reality-to-Toon Performance"
                description="Hybrid workflow combining live-action with animated transformation. Start realistic, transform mid-scene, or blend both styles throughout for creative hybrid effects."
                stars={5}
              />
              <WorkflowCard
                title="Complete Scene Performance"
                description="Full scene package from your performance upload. Generates character consistency, proper coverage, and scene assembly automatically—complete production from one take."
                stars={5}
              />
              <WorkflowCard
                title="Production Pipeline Performance"
                description="Enterprise workflow: upload your performance, get complete production pipeline output including all necessary deliverables and formats. Professional production automation."
                stars={5}
              />
                  </div>
                </div>
              </div>

              {/* Dialogue Workflows */}
              <div className="collapse collapse-arrow bg-base-200">
                <input type="radio" name="workflow-category" />
                <div className="collapse-title text-lg font-semibold">
                  💬 Dialogue & Conversation <span className="text-sm opacity-70">(2 workflows)</span>
                </div>
                <div className="collapse-content">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <WorkflowCard
                title="Standard Dialogue Generation"
                description="Generate AI-powered character dialogue with video, voice synthesis, and perfectly synced lip animation. Supports 4-8 second clips with emotion control."
                stars={5}
                credits="400 credits"
                helpLink="/help/advanced/dialogue-generation"
              />
              <WorkflowCard
                title="Extended & Cinema Dialogue"
                description="Longer dialogue clips (4-12 seconds) with cinema format (21:9) support. Perfect for dramatic scenes, monologues, and extended conversations."
                stars={5}
                credits="450-750 credits"
                helpLink="/help/advanced/dialogue-generation"
              />
                  </div>
                </div>
              </div>

              {/* Video Enhancement */}
              <div className="collapse collapse-arrow bg-base-200">
                <input type="radio" name="workflow-category" />
                <div className="collapse-title text-lg font-semibold">
                  ✨ Video Enhancement <span className="text-sm opacity-70">(5 workflows)</span>
                </div>
                <div className="collapse-content">
                  <p className="text-sm opacity-70 mb-4 pt-2">Transform existing video footage with special effects, style changes, object removal, and more</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WorkflowCard
                title="VFX Magic"
                description="Add special effects to your existing footage. Rain, fire, magic, powers—Hollywood VFX without the Hollywood budget. Transform any video with seamless effects integration."
                stars={5}
              />
              <WorkflowCard
                title="Scene Transformer"
                description="Transform your scene&apos;s environment, lighting, time of day, or art style. Shoot once, create unlimited variations. Virtual production without the green screen."
                stars={5}
              />
              <WorkflowCard
                title="Element Eraser"
                description="Remove unwanted objects, people, or elements from your video. Clean up footage and salvage otherwise unusable shots. AI-powered content-aware fill."
                stars={4}
              />
              <WorkflowCard
                title="Product Reshoot"
                description="Transform product photos or videos with new backgrounds, lighting, or settings. No expensive photoshoots required. Perfect for e-commerce and marketing."
                stars={5}
              />
              <WorkflowCard
                title="Still Photo Performer"
                description="Animate still photos with your voice and expressions. Make grandma&apos;s photo speak again. Revolutionary for tribute videos and viral content."
                stars={5}
              />
                  </div>
                </div>
              </div>
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
              title="Intelligent AI Routing"
              description="Automatic provider selection for optimal quality and cost based on your needs"
              free={true}
            />
            <FeatureCard
              title="GitHub Integration"
              description="Version control for screenplays, multi-user collaboration, branch management"
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
            <FeatureCard
              title="Credit Management"
              description="Simple credit-based billing (1 credit = $0.01), subscription management, usage tracking"
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

function WorkflowCard({ title, description, stars, credits, helpLink }) {
  const CardContent = (
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
      {helpLink && (
        <div className="text-xs text-[#DC143C] mt-2 hover:underline">
          Learn more →
        </div>
      )}
    </div>
  );

  if (helpLink) {
    return (
      <Link href={helpLink} className="card bg-base-100 border border-base-300 hover:border-primary transition-colors">
        {CardContent}
      </Link>
    );
  }

  return (
    <div className="card bg-base-100 border border-base-300">
      {CardContent}
    </div>
  );
}

