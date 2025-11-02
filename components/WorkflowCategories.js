'use client';

import { useRef } from 'react';

function WorkflowCard({ title, description, stars, helpLink }) {
  return (
    <div className="card bg-base-100 shadow-md hover:shadow-xl transition-shadow border border-base-300">
      <div className="card-body p-4">
        <h4 className="card-title text-base">{title}</h4>
        <p className="text-sm opacity-70">{description}</p>
        <div className="card-actions justify-between items-center mt-2">
          <div className="flex gap-0.5">
            {Array.from({ length: stars || 5 }).map((_, i) => (
              <span key={i} className="text-yellow-500">⭐</span>
            ))}
          </div>
          {helpLink && (
            <a href={helpLink} className="link link-primary text-xs">
              Learn More →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WorkflowCategories() {
  const categoryRefs = useRef({});

  const handleCategoryClick = (categoryId) => {
    // Longer delay to ensure collapse animation completes
    setTimeout(() => {
      const element = categoryRefs.current[categoryId];
      if (element) {
        // Scroll to the TOP of the collapsed section with offset for fixed header
        const yOffset = -20; // Adjust this value if there's a fixed header
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 150); // Increased delay for smoother experience
  };

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold mb-4">📂 Browse by Category (Sorted by Viral Potential):</h3>
      <div className="space-y-4">
        {/* Performance Capture */}
        <div 
          className="collapse collapse-arrow bg-base-200" 
          ref={(el) => (categoryRefs.current['performance'] = el)}
        >
          <input 
            type="radio" 
            name="workflow-category" 
            defaultChecked 
            onClick={() => handleCategoryClick('performance')}
          />
          <div className="collapse-title text-lg font-semibold">
            🎭 Performance Capture 🔥 <span className="text-sm opacity-70">(12 workflows) - MOST VIRAL!</span>
          </div>
          <div className="collapse-content">
            <p className="text-sm opacity-70 mb-4 pt-2">&quot;Be the Character&quot; - Upload your performance, get stylized output</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WorkflowCard
                title="🎯 AI Avatar (NEW!)"
                description="Clone ANY voice and create photorealistic talking avatars! Two options: (1) Clone a voice + type dialogue = instant avatar, OR (2) Upload your own audio file + photo = instant lip-sync video. Perfect for scaling personal brands, creating digital spokespersons, or making any audio visual."
                stars={5}
              />
              <WorkflowCard
                title="🎨 Image to Speech (NEW!)"
                description="Make ANY image speak! Upload artwork, cartoons, mascots, or photos and add audio. Perfect for viral content—make Mona Lisa talk, anime characters come alive, or brand mascots pitch products."
                stars={5}
              />
              <WorkflowCard
                title="🎙️ Podcast to Video (NEW!)"
                description="Turn podcast episodes into YouTube videos! Upload your podcast audio + host photo = instant talking-head video. Perfect for repurposing audio content without re-recording. Batch process entire seasons!"
                stars={5}
              />
              <WorkflowCard
                title="🌍 Multilingual Dubbing (NEW!)"
                description="Create videos in multiple languages instantly! Same face, different languages with perfect lip sync. One recording → 20+ language versions. Massive B2B opportunity for global content creators!"
                stars={5}
              />
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

        {/* Budget / Speed */}
        <div 
          className="collapse collapse-arrow bg-base-200"
          ref={(el) => (categoryRefs.current['budget'] = el)}
        >
          <input 
            type="radio" 
            name="workflow-category"
            onClick={() => handleCategoryClick('budget')}
          />
          <div className="collapse-title text-lg font-semibold">
            ⚡ Budget / Speed 🔥 <span className="text-sm opacity-70">(7 workflows) - HIGHLY VIRAL!</span>
          </div>
          <div className="collapse-content">
            <p className="text-sm opacity-70 mb-4 pt-2">Fast iteration & budget-conscious workflows</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WorkflowCard
                title="Screenwriting Assistant (AI Chat)"
                description="Get instant screenplay feedback, character development, plot suggestions, dialogue rewrites, and story structure guidance from AI. Your 24/7 writing partner."
                stars={5}
              />
              <WorkflowCard
                title="Storyboard to Animatic"
                description="Upload hand-drawn storyboards, get them assembled into timed animatics automatically. Preview pacing and timing before full production. Traditional pre-production, accelerated."
                stars={5}
              />
              <WorkflowCard
                title="Concept Art Generation"
                description="Turn text descriptions into visual concept art for characters, locations, props, and scenes. Rapid visual development for pitches and pre-production."
                stars={5}
              />
              <WorkflowCard
                title="Budget Animatic Preview"
                description="Low-fidelity preview of your full screenplay. See the entire story in rough form before committing to expensive production. Test pacing and structure early."
                stars={4}
              />
              <WorkflowCard
                title="Fast Turnaround Commercial"
                description="Complete 30-second commercial from script to delivery in hours. Optimized workflow for rapid content creation. Perfect for social media advertising and fast campaigns."
                stars={5}
              />
              <WorkflowCard
                title="Asset Reuse Pipeline"
                description="Automatically identifies and reuses existing characters, locations, and props across scenes. Massive credit savings by intelligently recycling assets. Smart production economics."
                stars={4}
              />
              <WorkflowCard
                title="Preview Before Render"
                description="Generate low-quality previews of complex scenes before committing credits to full renders. Test compositions, timing, and edits risk-free."
                stars={4}
              />
            </div>
          </div>
        </div>

        {/* Video Enhancement */}
        <div 
          className="collapse collapse-arrow bg-base-200"
          ref={(el) => (categoryRefs.current['enhancement'] = el)}
        >
          <input 
            type="radio" 
            name="workflow-category"
            onClick={() => handleCategoryClick('enhancement')}
          />
          <div className="collapse-title text-lg font-semibold">
            ✨ Video Enhancement 🔥 <span className="text-sm opacity-70">(5 workflows) - VIRAL TRANSFORMATIONS!</span>
          </div>
          <div className="collapse-content">
            <p className="text-sm opacity-70 mb-4 pt-2">Transform existing footage with AI effects</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WorkflowCard
                title="Style Transfer (Uploaded Footage)"
                description="Upload your own footage and transform it into any artistic style: anime, watercolor, oil painting, cyberpunk, etc. Turn live-action into stylized art instantly."
                stars={5}
              />
              <WorkflowCard
                title="AI Upscaling & Enhancement"
                description="Upscale low-resolution footage to 4K or 8K with AI-powered detail enhancement. Restore old footage, enhance webcam recordings, improve quality of any source material."
                stars={5}
              />
              <WorkflowCard
                title="Weather & Lighting Effects"
                description="Add rain, snow, fog, or change time of day on existing footage. Make daytime scenes nighttime, add atmospheric effects, and more—all from uploaded video."
                stars={5}
              />
              <WorkflowCard
                title="Color Matching & Consistency"
                description="Automatically match color grades across different clips to create visual consistency. Upload footage from multiple sources, get cohesive color-matched output."
                stars={4}
              />
              <WorkflowCard
                title="Background Removal & Replacement"
                description="Remove backgrounds from uploaded footage and replace with AI-generated or custom environments. Green screen without the green screen."
                stars={5}
              />
            </div>
          </div>
        </div>

        {/* Post-Production & HDR */}
        <div 
          className="collapse collapse-arrow bg-base-200"
          ref={(el) => (categoryRefs.current['postprod'] = el)}
        >
          <input 
            type="radio" 
            name="workflow-category"
            onClick={() => handleCategoryClick('postprod')}
          />
          <div className="collapse-title text-lg font-semibold">
            🎬 Post-Production & HDR Finishing ✨ <span className="text-sm opacity-70">(7 workflows) - CINEMA-GRADE PROFESSIONAL</span>
          </div>
          <div className="collapse-content">
            <p className="text-sm opacity-70 mb-4 pt-2">Professional finishing for theatrical & streaming delivery</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WorkflowCard
                title="🎨 HDR Mastering (Dolby Vision)"
                description="TRUE cinema HDR with Dolby Vision metadata. The ONLY AI platform with real HDR support. Theatrical & Apple TV+ delivery ready. PQ/HLG for HDR10+ and broadcast."
                stars={5}
              />
              <WorkflowCard
                title="🎞️ SDR to HDR Conversion"
                description="Convert SDR footage to HDR (PQ/HLG) with AI-powered tone mapping and expanded dynamic range. Make standard footage HDR-ready for premium distribution."
                stars={5}
              />
              <WorkflowCard
                title="📽️ HDR to SDR (Standard Dynamic Range)"
                description="Professional HDR-to-SDR tone mapping for universal playback. Preserve creative intent when delivering to non-HDR platforms. Broadcast-safe output."
                stars={5}
              />
              <WorkflowCard
                title="🌈 HDR Grade Matching"
                description="Match HDR color grades across multiple clips for visual consistency. Ensure uniform HDR presentation across your project. Professional color continuity."
                stars={4}
              />
              <WorkflowCard
                title="🎭 Cinema DCI-P3 Export"
                description="Export in DCI-P3 color space for theatrical projection. Professional cinema delivery with proper color space conversion and metadata."
                stars={5}
              />
              <WorkflowCard
                title="📺 Broadcast HDR (HLG) Export"
                description="Hybrid Log-Gamma (HLG) encoding for broadcast HDR. BBC/NHK standard for live production and broadcast delivery. DVB-compliant."
                stars={5}
              />
              <WorkflowCard
                title="🎬 Multi-Format HDR Delivery"
                description="Simultaneously export Dolby Vision, HDR10+, HLG, and SDR versions. Complete delivery package for all platforms from single master. Streamlined distribution workflow."
                stars={5}
              />
            </div>
          </div>
        </div>

        {/* Screenplay Production */}
        <div 
          className="collapse collapse-arrow bg-base-200"
          ref={(el) => (categoryRefs.current['screenplay'] = el)}
        >
          <input 
            type="radio" 
            name="workflow-category"
            onClick={() => handleCategoryClick('screenplay')}
          />
          <div className="collapse-title text-lg font-semibold">
            📝 Screenplay to Production <span className="text-sm opacity-70">(9 workflows) - COMPLETE AUTOMATION</span>
          </div>
          <div className="collapse-content">
            <p className="text-sm opacity-70 mb-4 pt-2">Script → Screen automation pipelines</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WorkflowCard
                title="Full Screenplay Automation"
                description="Upload a full screenplay, get the entire production automatically: character consistency, scene generation, editing, audio, and final delivery. Complete film from script."
                stars={5}
              />
              <WorkflowCard
                title="Scene-by-Scene Production"
                description="Break screenplay into scenes, generate each individually with proper shot coverage, then assemble automatically. Modular production with full control at scene level."
                stars={5}
              />
              <WorkflowCard
                title="Multi-Shot Scene Coverage"
                description="Generate professional coverage for each scene: master shot, close-ups, inserts, reactions. Complete cinematic coverage from screenplay description."
                stars={5}
                helpLink="/help/advanced/multi-shot-scenes"
              />
              <WorkflowCard
                title="Dialogue Scene Generator"
                description="Specialized workflow for dialogue-heavy scenes. Generates proper shot-reverse-shot coverage, lip-sync, and character close-ups automatically from screenplay dialogue."
                stars={5}
              />
              <WorkflowCard
                title="Action Sequence Builder"
                description="Optimized for action scenes with dynamic camera work, fast cuts, and impact shots. Generates choreographed action sequences from screenplay action lines."
                stars={5}
              />
              <WorkflowCard
                title="Character Introduction Scene"
                description="Specialized workflow for character introductions with proper establishing shots, hero moments, and visual introductions. Makes characters memorable from first appearance."
                stars={4}
              />
              <WorkflowCard
                title="Montage Sequence Generator"
                description="Create montage sequences from screenplay montage descriptions. Handles time passage, parallel action, and thematic montages with proper pacing and music."
                stars={5}
              />
              <WorkflowCard
                title="Flashback Scene Integration"
                description="Generate flashback sequences with visual distinction (color grading, vignette, etc.) and seamless integration into main timeline. Handles temporal shifts elegantly."
                stars={4}
              />
              <WorkflowCard
                title="Complete Feature Film Pipeline"
                description="Enterprise workflow: Full feature-length screenplay → production → post → delivery. Handles multi-act structure, character arcs, and complete narrative flow. Film production at scale."
                stars={5}
              />
            </div>
          </div>
        </div>

        {/* Commercial & Social */}
        <div 
          className="collapse collapse-arrow bg-base-200"
          ref={(el) => (categoryRefs.current['commercial'] = el)}
        >
          <input 
            type="radio" 
            name="workflow-category"
            onClick={() => handleCategoryClick('commercial')}
          />
          <div className="collapse-title text-lg font-semibold">
            💼 Commercial & Social Content <span className="text-sm opacity-70">(8 workflows) - HIGH ENGAGEMENT</span>
          </div>
          <div className="collapse-content">
            <p className="text-sm opacity-70 mb-4 pt-2">Advertising, marketing & viral content</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WorkflowCard
                title="Product Demo Video"
                description="Create professional product demos from text description and product images. Showcase features, benefits, and use cases automatically. E-commerce video made easy."
                stars={5}
              />
              <WorkflowCard
                title="Social Media Multi-Format"
                description="Generate one video concept across all social formats: 16:9 (YouTube), 9:16 (TikTok/Reels), 1:1 (Instagram). One idea, all platforms, automatically."
                stars={5}
              />
              <WorkflowCard
                title="Viral Hook Generator"
                description="Create attention-grabbing opening hooks optimized for social media. Generates multiple variations, A/B testing ready. Maximize scroll-stopping power."
                stars={5}
              />
              <WorkflowCard
                title="Brand Mascot Animation"
                description="Animate your brand mascot or logo character for marketing videos. Bring static brand assets to life with personality and movement."
                stars={5}
              />
              <WorkflowCard
                title="Testimonial Video Generator"
                description="Turn written customer testimonials into video format with AI avatars or animated text. Scale testimonial production without filming."
                stars={4}
              />
              <WorkflowCard
                title="Explainer Video"
                description="Create animated explainer videos from script. Perfect for SaaS products, tutorials, and educational content. Complex concepts, simplified visually."
                stars={5}
              />
              <WorkflowCard
                title="Ad Campaign Multi-Variant"
                description="Generate multiple ad variations for A/B testing from one concept. Different hooks, styles, and formats for optimization testing. Data-driven creative production."
                stars={5}
              />
              <WorkflowCard
                title="Influencer-Style Content"
                description="Generate influencer-style talking-head content from script. Perfect for personal brand content, vlogs, and creator economy. Authentic, engaging, scalable."
                stars={5}
              />
            </div>
          </div>
        </div>

        {/* Music Video & Creative */}
        <div 
          className="collapse collapse-arrow bg-base-200"
          ref={(el) => (categoryRefs.current['music'] = el)}
        >
          <input 
            type="radio" 
            name="workflow-category"
            onClick={() => handleCategoryClick('music')}
          />
          <div className="collapse-title text-lg font-semibold">
            🎵 Music Video & Creative <span className="text-sm opacity-70">(5 workflows) - ARTISTIC EXPRESSION</span>
          </div>
          <div className="collapse-content">
            <p className="text-sm opacity-70 mb-4 pt-2">Music videos, lyric videos & visual art</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WorkflowCard
                title="AI Music + Video Bundle"
                description="Generate original AI music + matching music video in one workflow. Complete music video production from text description. Audio and visual, unified."
                stars={5}
              />
              <WorkflowCard
                title="Lyric Video Generator"
                description="Upload song + lyrics, get animated lyric video with synchronized text, visual effects, and style matching the song's mood. YouTube-ready lyric videos instantly."
                stars={5}
              />
              <WorkflowCard
                title="Visualizer for Existing Music"
                description="Upload your own music, get AI-generated visuals synced to beat and mood. Perfect for SoundCloud, Spotify Canvas, and YouTube uploads."
                stars={5}
              />
              <WorkflowCard
                title="Abstract Visual Art Video"
                description="Create abstract, artistic video content synchronized to music. Perfect for VJ loops, art installations, and experimental visual content."
                stars={4}
              />
              <WorkflowCard
                title="Concert Visuals / Stage Backdrop"
                description="Generate looping visuals for live performances and stage backdrops. Sync to music tempo and energy. Live show production assets."
                stars={4}
              />
            </div>
          </div>
        </div>

        {/* Documentary & Educational */}
        <div 
          className="collapse collapse-arrow bg-base-200"
          ref={(el) => (categoryRefs.current['educational'] = el)}
        >
          <input 
            type="radio" 
            name="workflow-category"
            onClick={() => handleCategoryClick('educational')}
          />
          <div className="collapse-title text-lg font-semibold">
            📚 Documentary & Educational <span className="text-sm opacity-70">(5 workflows) - INFORMATIVE CONTENT</span>
          </div>
          <div className="collapse-content">
            <p className="text-sm opacity-70 mb-4 pt-2">Educational, documentary, tutorial content</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WorkflowCard
                title="Documentary Scene Recreation"
                description="Recreate historical events or documentary scenes from text descriptions. Generate B-roll and visual storytelling for documentary projects."
                stars={5}
              />
              <WorkflowCard
                title="Educational Animation"
                description="Create educational animations from lesson scripts. Perfect for e-learning, online courses, and educational YouTube channels. Make learning visual."
                stars={5}
              />
              <WorkflowCard
                title="Tutorial Video Generator"
                description="Convert written tutorials into video format with voiceover and visuals. Scale tutorial production for documentation, training, and how-to content."
                stars={5}
              />
              <WorkflowCard
                title="Infographic to Video"
                description="Transform static infographics into animated video format. Add narration, motion graphics, and pacing for engaging data visualization."
                stars={4}
              />
              <WorkflowCard
                title="Interview B-Roll Generator"
                description="Generate contextual B-roll footage to overlay interview content. Visualize spoken topics, locations, and subjects discussed in interviews."
                stars={4}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

