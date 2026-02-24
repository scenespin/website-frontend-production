'use client';

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import config from "@/config";
import Footer from "@/components/Footer";
import logo from "@/app/icon.png";
import { ShowcaseGallery } from "@/components/showcase/ShowcaseGallery";
import { useShowcaseStatus } from "@/hooks/useShowcase";
import { mediaShowcaseContent } from "@/lib/mediaShowcaseContent";

const step2CaptureSources = {
  scriptContext: "/examples/captures/cap_s2a_script_context_01.jpg",
  charactersDetected: "/examples/captures/cap_s2b_characters_detected_01.jpg",
  locationDetected: "/examples/captures/cap_s2c_location_detected_01.jpg",
};
const step1CaptureSource = "/examples/captures/cap_s1_script_capture_01.jpg";
const step3CaptureSources = {
  characterReference: "/examples/captures/cap_s3_character_reference_01.jpg",
  clothingInput: "/examples/captures/cap_s3_clothing_input_01.jpg",
  tryOnResult: "/examples/captures/cap_s3_tryon_result_01.jpg",
  finalPoses: "/examples/captures/cap_s3_final_poses_01.jpg",
};
const step4CaptureSources = {
  locationReference: "/examples/captures/cap_s4_location_reference_01.jpg",
  locationAngles: "/examples/captures/cap_s4_location_angles_01.jpg",
  locationBackgrounds: "/examples/captures/cap_s4_location_backgrounds_01.jpg",
  locationXcu: "/examples/captures/cap_s4_location_xcu_01.jpg",
};
const step5CaptureSources = {
  propReference: "/examples/captures/cap_s5_prop_reference_01.jpg",
  propAngles: "/examples/captures/cap_s5_prop_angles_01.jpg",
  propMacro: "/examples/captures/cap_s5_prop_macro_01.jpg",
};
const step7CaptureSources = {
  sceneBuilder: "/examples/captures/cap_s7_scenebuilder_capture_01.jpg",
  shotBoard: "/examples/captures/cap_s7_shotboard_capture_01.jpg",
  teaser: "/examples/captures/cap_s7_teaser_capture_01.jpg",
};

function StepCaptureCard({ src, alt, fallbackLabel, minHeight = "min-h-[120px]" }) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`relative overflow-hidden rounded-lg border border-[#2F2F2F] bg-gradient-to-br from-[#171717] to-[#0F0F0F] p-0 ${minHeight}`}>
      {!hasError ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setHasError(true)}
        />
      ) : null}
      {hasError ? (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <p className="text-sm text-gray-400 text-center">{fallbackLabel}</p>
        </div>
      ) : null}
    </div>
  );
}

export default function ExamplesPage() {
  const { data: status } = useShowcaseStatus();
  const [activeMediaTabId, setActiveMediaTabId] = useState(mediaShowcaseContent.tabs[0].id);
  const activeMediaTab = useMemo(
    () => mediaShowcaseContent.tabs.find((tab) => tab.id === activeMediaTabId) || mediaShowcaseContent.tabs[0],
    [activeMediaTabId]
  );
  const fountainDemoSnippet = `Title: The Last Witness

INT. INTERROGATION ROOM - NIGHT

Rain taps the narrow window. A steel table sits under a hard overhead light.

DETECTIVE MARA VOSS enters, sets a CASE FILE and a DIGITAL VOICE RECORDER on the table, then sits across from ELI TRENT.

MARA
Let's start again. From the beginning.

Eli avoids her eyes. His hands shake.

ELI
I already told patrol everything.

Mara presses RECORD on the voice recorder.

MARA
Not everything.`;
  
  return (
    <>
      {/* Header */}
      <header className="bg-[#0A0A0A] border-b border-[#3F3F46] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src={logo}
                alt={`${config.appName} logo`}
                width={40}
                height={40}
                className="w-10 h-10"
                priority={true}
              />
              <span className="text-2xl font-extrabold text-white">
                {config.appName}<span className="text-[#DC143C]">.ai</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/how-it-works" className="text-sm text-gray-300 hover:text-white transition-colors">
                How It Works
              </Link>
              <Link href="/features" className="text-sm text-gray-300 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="/examples" className="text-sm text-white font-medium">
                Examples
              </Link>
              <Link href="/pricing" className="text-sm text-gray-300 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/sign-in" className="text-sm text-gray-300 hover:text-white transition-colors">
                Login
              </Link>
            </nav>
            <Link href="/sign-in" className="md:hidden text-sm text-gray-300 hover:text-white transition-colors">
              Login
            </Link>
          </div>
        </div>
      </header>

      <main className="bg-[#0A0A0A] text-white min-h-screen">
        {/* Hero Section */}
        <section className="pt-14 pb-8 bg-gradient-to-b from-[#141414] to-[#0A0A0A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black border border-[#DC143C]/30 text-sm mb-6">
              <span className="font-semibold text-gray-300">✨ Real Writer Workflows</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              Writing + Visual Workflow Examples
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              See how screenplay-first work in Wryda extends into optional visual planning. The examples below show character, location, and prop references used to support writing, continuity, and production prep.
            </p>
            
            {/* Stats */}
            {status && (
              <div className="flex justify-center gap-8 text-center mt-6">
                <div>
                  <div className="text-3xl font-bold text-[#DC143C]">{status.contentCounts?.characters || 0}</div>
                  <div className="text-sm text-gray-400">Character References</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-cyan-400">{status.contentCounts?.locations || 0}</div>
                  <div className="text-sm text-gray-400">Location References</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-amber-400">{status.contentCounts?.props || 0}</div>
                  <div className="text-sm text-gray-400">Prop References</div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Script to Screen Walkthrough */}
        <section className="pt-4 pb-14 border-t border-[#1E1E1E]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Script → References → Generated Assets</h2>
              <p className="text-gray-300 max-w-3xl mx-auto">
                A complete screenplay-first flow: write the scene, extract production entities, establish references, and carry everything into visual planning.
              </p>
            </div>

            <div className="rounded-xl border border-[#3F3F46] bg-[#111111] p-5 md:p-6 mb-6">
              <h3 className="text-xl font-semibold mb-3">1) Start With the Script</h3>
              <p className="text-sm text-gray-300 mb-4">
                Write directly in Wryda with a screenplay-first workflow, then paste, import, or scan when bringing in existing pages. Your script stays the source of truth for character, location, prop, and shot planning.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-lg border border-[#2F2F2F] bg-[#0D0D0D] p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Scene excerpt</p>
                  <pre className="text-xs sm:text-sm text-gray-200 whitespace-pre-wrap">{fountainDemoSnippet}</pre>
                </div>
                <StepCaptureCard
                  src={step1CaptureSource}
                  alt="Screenplay workspace showing the active script in Wryda"
                  fallbackLabel="Screenplay workspace capture"
                  minHeight="min-h-[220px]"
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#3F3F46] bg-[#111111] p-5 md:p-6 mb-6">
              <h3 className="text-xl font-semibold mb-3">2) Auto-Detect Story Elements</h3>
              <p className="text-sm text-gray-300 mb-4">
                Wryda reads your script and automatically detects core story entities from Fountain context.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <StepCaptureCard
                  src={step2CaptureSources.scriptContext}
                  alt="Script context showing interrogation room scene heading and character mentions"
                  fallbackLabel="Script context capture"
                />
                <StepCaptureCard
                  src={step2CaptureSources.charactersDetected}
                  alt="Detected characters list showing Mara Voss and Eli Trent"
                  fallbackLabel="Characters detected"
                />
                <StepCaptureCard
                  src={step2CaptureSources.locationDetected}
                  alt="Detected location list showing Interrogation Room"
                  fallbackLabel="Location detected"
                />
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Script context auto-drives character and location setup. Props are manually added and attached per scene for production control.
              </p>
            </div>

            <div className="rounded-xl border border-[#3F3F46] bg-[#111111] p-5 md:p-6 mb-6">
              <h3 className="text-xl font-semibold mb-3">3) Character Workflow (Virtual Try-On)</h3>
              <p className="text-sm text-gray-300 mb-4">
                Demonstrate one hero character through the complete wardrobe pipeline from baseline reference to final generated pose set.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <StepCaptureCard
                  src={step3CaptureSources.characterReference}
                  alt="Character reference image used for identity lock"
                  fallbackLabel="Character reference image"
                  minHeight="min-h-[140px]"
                />
                <StepCaptureCard
                  src={step3CaptureSources.clothingInput}
                  alt="Clothing input image used for virtual try-on"
                  fallbackLabel="Clothing input image"
                  minHeight="min-h-[140px]"
                />
                <StepCaptureCard
                  src={step3CaptureSources.tryOnResult}
                  alt="Virtual try-on result preserving character identity"
                  fallbackLabel="Virtual try-on result"
                  minHeight="min-h-[140px]"
                />
                <StepCaptureCard
                  src={step3CaptureSources.finalPoses}
                  alt="Final generated character pose set"
                  fallbackLabel="Final generated pose set"
                  minHeight="min-h-[140px]"
                />
              </div>
              <div className="rounded-lg border border-[#2F2F2F] bg-[#0D0D0D] p-4 mt-3">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Prompt snippet</p>
                <p className="text-sm text-gray-300">
                  Base identity prompt + outfit add-on prompt. Keep identity fixed and change wardrobe only.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#3F3F46] bg-[#111111] p-5 md:p-6 mb-6">
              <h3 className="text-xl font-semibold mb-3">4) Location Workflow</h3>
              <p className="text-sm text-gray-300 mb-4">
                Build location continuity from one reference through angle coverage, background variants, and a detail plate for close-up texture.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <StepCaptureCard
                  src={step4CaptureSources.locationReference}
                  alt="Location reference image used for continuity"
                  fallbackLabel="Location reference"
                  minHeight="min-h-[140px]"
                />
                <StepCaptureCard
                  src={step4CaptureSources.locationAngles}
                  alt="Location angle outputs derived from one reference"
                  fallbackLabel="Location angle outputs"
                  minHeight="min-h-[140px]"
                />
                <StepCaptureCard
                  src={step4CaptureSources.locationBackgrounds}
                  alt="Location background variation outputs"
                  fallbackLabel="Location background outputs"
                  minHeight="min-h-[140px]"
                />
                <StepCaptureCard
                  src={step4CaptureSources.locationXcu}
                  alt="Extreme close-up background detail plate"
                  fallbackLabel="Extreme close-up background plate"
                  minHeight="min-h-[140px]"
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#3F3F46] bg-[#111111] p-5 md:p-6 mb-6">
              <h3 className="text-xl font-semibold mb-3">5) Prop Workflow</h3>
              <p className="text-sm text-gray-300 mb-4">
                Capture prop continuity with one reference, practical angle coverage, and one macro detail pass for storytelling inserts.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <StepCaptureCard
                  src={step5CaptureSources.propReference}
                  alt="Prop reference image for continuity"
                  fallbackLabel="Prop reference"
                  minHeight="min-h-[140px]"
                />
                <StepCaptureCard
                  src={step5CaptureSources.propAngles}
                  alt="Prop angle outputs generated from the reference"
                  fallbackLabel="Prop angle outputs"
                  minHeight="min-h-[140px]"
                />
                <StepCaptureCard
                  src={step5CaptureSources.propMacro}
                  alt="Macro detail output for storytelling inserts"
                  fallbackLabel="Macro detail output"
                  minHeight="min-h-[140px]"
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#3F3F46] bg-[#111111] p-5 md:p-6 mb-6">
              <h3 className="text-xl font-semibold mb-3">6) Final Generated Library (Live)</h3>
              <p className="text-sm text-gray-300 mb-4">
                Live demo-account outputs from one coherent screenplay world: character poses, location angles/backgrounds, and prop continuity renders.
              </p>
            </div>

            <div className="rounded-xl border border-[#3F3F46] bg-[#111111] p-5 md:p-6">
              <h3 className="text-xl font-semibold mb-3">7) Direct Workflow</h3>
              <p className="text-sm text-gray-300 mb-4">
                Scene Builder and Shot Board connect this same script context to shot-level planning and execution.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <StepCaptureCard
                  src={step7CaptureSources.sceneBuilder}
                  alt="Scene Builder view showing shot sequence and planning context"
                  fallbackLabel="Scene Builder preview"
                  minHeight="min-h-[140px]"
                />
                <StepCaptureCard
                  src={step7CaptureSources.shotBoard}
                  alt="Shot Board view showing shot variants and continuity planning"
                  fallbackLabel="Shot Board preview"
                  minHeight="min-h-[140px]"
                />
                <StepCaptureCard
                  src={step7CaptureSources.teaser}
                  alt="End-result teaser frame from generated sequence"
                  fallbackLabel="End-result teaser video"
                  minHeight="min-h-[140px]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Final Generated Library (Live) */}
        <section className="pt-2 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Final Generated Library (Live)</h2>
              <p className="text-gray-300 max-w-3xl mx-auto">
                These galleries are loaded from the demo account and should reflect your strongest curated outputs for each category.
              </p>
            </div>

            <div className="space-y-10">
              <ShowcaseGallery 
                contentType="characters"
                columns={4}
                title="Character Reference Examples"
                showTitle={true}
              />
              <ShowcaseGallery 
                contentType="locations"
                columns={3}
                title="Location Planning Examples"
                showTitle={true}
              />
              <ShowcaseGallery 
                contentType="props"
                columns={4}
                title="Prop Continuity Examples"
                showTitle={true}
              />
            </div>
          </div>
        </section>

        {/* Media Deep Dive Tabs */}
        <section className="pt-2 pb-10 border-t border-[#1E1E1E]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Media Deep Dive</h2>
              <p className="text-gray-300 max-w-3xl mx-auto">
                Explore workflow details by mode. These tabs are secondary drill-down views on top of the script-first flow above.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {mediaShowcaseContent.tabs.map((tab) => {
                const active = tab.id === activeMediaTabId;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveMediaTabId(tab.id)}
                    className={`px-3 py-2 rounded-md text-sm border transition-colors ${
                      active
                        ? "bg-[#DC143C]/20 text-[#F28BA0] border-[#DC143C]/50"
                        : "bg-[#111111] text-gray-300 border-[#3F3F46] hover:border-[#DC143C]/40 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-[#3F3F46] bg-[#111111] p-5 md:p-6 mb-8">
              <h3 className="text-xl md:text-2xl font-semibold mb-3">{activeMediaTab.headline}</h3>
              <p className="text-gray-300 mb-4">{activeMediaTab.howItWorks}</p>

              <div className="mb-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Sample flow</p>
                <ol className="space-y-2 text-sm text-gray-300 list-decimal list-inside">
                  {activeMediaTab.sampleFlow.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Output strip</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {activeMediaTab.outputCaptions.map((caption) => (
                    <div key={caption} className="rounded-lg border border-[#2F2F2F] bg-[#0E0E0E] px-3 py-2 text-sm text-gray-300">
                      {caption}
                    </div>
                  ))}
                </div>
              </div>

              {activeMediaTab.supportingLine && (
                <p className="text-sm text-gray-400 mt-4">{activeMediaTab.supportingLine}</p>
              )}
            </div>

            {activeMediaTab.id === "references" ? (
              <div className="space-y-10">
                <ShowcaseGallery 
                  contentType="characters"
                  columns={4}
                  title="Character Reference Examples"
                  showTitle={true}
                />
                <ShowcaseGallery 
                  contentType="locations"
                  columns={3}
                  title="Location Planning Examples"
                  showTitle={true}
                />
                <ShowcaseGallery 
                  contentType="props"
                  columns={4}
                  title="Prop Continuity Examples"
                  showTitle={true}
                />
              </div>
            ) : (
              <div>
                <ShowcaseGallery
                  contentType="all"
                  limit={6}
                  columns={3}
                  title="Demo Showcase Strip"
                  showTitle={true}
                />
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-b from-[#0A0A0A] to-[#141414]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to write and visualize your next project in Wryda?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Start with screenplay-native writing tools, then carry the same story context into image and video workflows built for continuity, speed, and creative control.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors text-lg"
            >
              Start Writing
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
