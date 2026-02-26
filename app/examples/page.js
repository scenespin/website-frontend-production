'use client';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import config from "@/config";
import Footer from "@/components/Footer";
import logo from "@/app/icon.png";
import { ShowcaseGallery } from "@/components/showcase/ShowcaseGallery";
import { useShowcaseStatus } from "@/hooks/useShowcase";

const captureCandidates = (basePath) => [
  `${basePath}.jpg`,
  `${basePath}.jpeg`,
  `${basePath}.png`,
];

const step2CaptureSources = {
  scriptContext: captureCandidates("/examples/captures/cap_s2a_script_context_01"),
  charactersDetected: captureCandidates("/examples/captures/cap_s2b_characters_detected_01"),
  locationDetected: captureCandidates("/examples/captures/cap_s2c_location_detected_01"),
};
const step1CaptureSource = captureCandidates("/examples/captures/cap_s1_script_capture_01");
const step3AgentsCaptureSource = captureCandidates("/examples/captures/cap_s3_agents_capture_01");
const step3AgentsOutputCards = [
  {
    key: "director",
    label: "Director",
    description: "Translate story intent into clear visual direction and shot emphasis.",
    srcCandidates: captureCandidates("/examples/captures/cap_s3_agents_output_01"),
  },
  {
    key: "dialogue",
    label: "Dialogue",
    description: "Sharpen voice, subtext, and pacing while preserving character intent.",
    srcCandidates: captureCandidates("/examples/captures/cap_s3_agents_output_02"),
  },
  {
    key: "screenwriter",
    label: "Screenwriter",
    description: "Strengthen structure, scene momentum, and page-level clarity.",
    srcCandidates: captureCandidates("/examples/captures/cap_s3_agents_output_03"),
  },
  {
    key: "rewrite",
    label: "Rewrite",
    description: "Generate alternate passes quickly for tone, brevity, or dramatic impact.",
    srcCandidates: captureCandidates("/examples/captures/cap_s3_agents_output_04"),
  },
];
const step3CaptureSources = {
  characterReference: captureCandidates("/examples/captures/cap_s3_character_reference_01"),
  clothingInput: captureCandidates("/examples/captures/cap_s3_clothing_input_01"),
  tryOnResult: captureCandidates("/examples/captures/cap_s3_tryon_result_01"),
  finalPoses: captureCandidates("/examples/captures/cap_s3_final_poses_01"),
};
const step4CaptureSources = {
  locationReference: captureCandidates("/examples/captures/cap_s4_location_reference_01"),
  locationAngles: captureCandidates("/examples/captures/cap_s4_location_angles_01"),
  locationBackgrounds: captureCandidates("/examples/captures/cap_s4_location_backgrounds_01"),
  locationXcu: captureCandidates("/examples/captures/cap_s4_location_xcu_01"),
};
const step5CaptureSources = {
  propReference: captureCandidates("/examples/captures/cap_s5_prop_reference_01"),
  propAngles: captureCandidates("/examples/captures/cap_s5_prop_angles_01"),
  propMacro: captureCandidates("/examples/captures/cap_s5_prop_macro_01"),
};
const step7CaptureSources = {
  sceneBuilder: captureCandidates("/examples/captures/cap_s7_scenebuilder_capture_01"),
  shotBoard: captureCandidates("/examples/captures/cap_s7_shotboard_capture_01"),
  teaser: captureCandidates("/examples/captures/cap_s7_teaser_capture_01"),
};

function StepCaptureCard({ srcCandidates, alt, fallbackLabel, itemKey, onOpen }) {
  const sources = Array.isArray(srcCandidates) ? srcCandidates : [srcCandidates];
  const [sourceIndex, setSourceIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const activeSource = sources[sourceIndex];

  useEffect(() => {
    setSourceIndex(0);
    setHasError(false);
  }, [sources.join("|")]);

  return (
    <button
      type="button"
      className="relative w-full aspect-video overflow-hidden rounded-lg border border-[#2F2F2F] bg-gradient-to-br from-[#171717] to-[#0F0F0F] p-0 text-left"
      onClick={() => {
        if (!hasError && activeSource && onOpen && itemKey) {
          onOpen(itemKey, activeSource, alt);
        }
      }}
      disabled={hasError}
    >
      {!hasError && activeSource ? (
        <img
          src={activeSource}
          alt={alt}
          className="h-full w-full object-contain bg-[#0B0B0B]"
          loading="lazy"
          onError={() => {
            if (sourceIndex < sources.length - 1) {
              setSourceIndex((index) => index + 1);
              return;
            }
            setHasError(true);
          }}
        />
      ) : null}
      {hasError ? (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <p className="text-sm text-gray-400 text-center">{fallbackLabel}</p>
        </div>
      ) : null}
    </button>
  );
}

function AgentsMiniCaptureCard({ srcCandidates, alt, fallbackLabel, itemKey, onOpen }) {
  const sources = Array.isArray(srcCandidates) ? srcCandidates : [srcCandidates];
  const [sourceIndex, setSourceIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const activeSource = sources[sourceIndex];

  useEffect(() => {
    setSourceIndex(0);
    setHasError(false);
  }, [sources.join("|")]);

  return (
    <button
      type="button"
      className="relative w-full aspect-video overflow-hidden rounded-lg border border-[#2F2F2F] bg-[#0B0B0B] text-left"
      onClick={() => {
        if (!hasError && activeSource && onOpen && itemKey) {
          onOpen(itemKey, activeSource, alt);
        }
      }}
      disabled={hasError}
    >
      {!hasError && activeSource ? (
        <img
          src={activeSource}
          alt={alt}
          className="h-full w-full object-cover scale-[1.08]"
          loading="lazy"
          onError={() => {
            if (sourceIndex < sources.length - 1) {
              setSourceIndex((index) => index + 1);
              return;
            }
            setHasError(true);
          }}
        />
      ) : null}
      {hasError ? (
        <div className="absolute inset-0 flex items-center justify-center p-3">
          <p className="text-xs text-gray-500 text-center">{fallbackLabel}</p>
        </div>
      ) : null}
    </button>
  );
}

export default function ExamplesPage() {
  const { data: status } = useShowcaseStatus();
  const [lightboxState, setLightboxState] = useState(null);
  const lightboxItems = useMemo(
    () => [
      { key: "s1_script_capture", srcCandidates: step1CaptureSource, alt: "Screenplay workspace showing the active script in Wryda" },
      { key: "s2_script_context", srcCandidates: step2CaptureSources.scriptContext, alt: "Script context showing interrogation room scene heading and character mentions" },
      { key: "s2_characters_detected", srcCandidates: step2CaptureSources.charactersDetected, alt: "Detected characters list showing Mara Voss and Eli Trent" },
      { key: "s2_location_detected", srcCandidates: step2CaptureSources.locationDetected, alt: "Detected location list showing Interrogation Room" },
      { key: "s3_agents_capture", srcCandidates: step3AgentsCaptureSource, alt: "Story advisor style AI agent response shown alongside screenplay context" },
      ...step3AgentsOutputCards.map((card, index) => ({
        key: `s3_agents_output_${index + 1}`,
        srcCandidates: card.srcCandidates,
        alt: `${card.label} agent output example`,
      })),
      { key: "s4_char_reference", srcCandidates: step3CaptureSources.characterReference, alt: "Character reference image used for identity lock" },
      { key: "s4_clothing_reference", srcCandidates: step3CaptureSources.clothingInput, alt: "Clothing input image used for virtual try-on" },
      { key: "s4_tryon_result", srcCandidates: step3CaptureSources.tryOnResult, alt: "Virtual try-on result preserving character identity" },
      { key: "s4_final_pose", srcCandidates: step3CaptureSources.finalPoses, alt: "Final generated character pose set" },
      { key: "s5_location_reference", srcCandidates: step4CaptureSources.locationReference, alt: "Location reference image used for continuity" },
      { key: "s5_location_angles", srcCandidates: step4CaptureSources.locationAngles, alt: "Location angle outputs derived from one reference" },
      { key: "s5_location_backgrounds", srcCandidates: step4CaptureSources.locationBackgrounds, alt: "Location background variation outputs" },
      { key: "s5_location_xcu", srcCandidates: step4CaptureSources.locationXcu, alt: "Extreme close-up background detail plate" },
      { key: "s6_prop_reference", srcCandidates: step5CaptureSources.propReference, alt: "Prop reference image for continuity" },
      { key: "s6_prop_angles", srcCandidates: step5CaptureSources.propAngles, alt: "Prop angle outputs generated from the reference" },
      { key: "s6_prop_macro", srcCandidates: step5CaptureSources.propMacro, alt: "Macro detail output for storytelling inserts" },
      { key: "s7_scene_builder", srcCandidates: step7CaptureSources.sceneBuilder, alt: "Scene Builder view showing shot sequence and planning context" },
      { key: "s7_shot_board", srcCandidates: step7CaptureSources.shotBoard, alt: "Shot Board view showing shot variants and continuity planning" },
      { key: "s7_teaser", srcCandidates: step7CaptureSources.teaser, alt: "End-result teaser frame from generated sequence" },
    ],
    []
  );
  const openLightbox = (itemKey, resolvedSource, alt) => {
    const itemIndex = lightboxItems.findIndex((item) => item.key === itemKey);
    if (itemIndex < 0) return;
    const sourceIndex = lightboxItems[itemIndex].srcCandidates.indexOf(resolvedSource);
    setLightboxState({
      itemIndex,
      sourceIndex: sourceIndex >= 0 ? sourceIndex : 0,
      alt: alt || lightboxItems[itemIndex].alt,
    });
  };
  const closeLightbox = () => setLightboxState(null);
  const goToPrevLightboxItem = () => {
    if (!lightboxState) return;
    const prevIndex = (lightboxState.itemIndex - 1 + lightboxItems.length) % lightboxItems.length;
    setLightboxState({
      itemIndex: prevIndex,
      sourceIndex: 0,
      alt: lightboxItems[prevIndex].alt,
    });
  };
  const goToNextLightboxItem = () => {
    if (!lightboxState) return;
    const nextIndex = (lightboxState.itemIndex + 1) % lightboxItems.length;
    setLightboxState({
      itemIndex: nextIndex,
      sourceIndex: 0,
      alt: lightboxItems[nextIndex].alt,
    });
  };
  useEffect(() => {
    if (!lightboxState) return;
    const handleKeydown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPrevLightboxItem();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNextLightboxItem();
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [lightboxState, lightboxItems.length]);
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
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Script → Agents → Visuals → Shots</h2>
              <p className="text-gray-300 max-w-3xl mx-auto">
                A writing-first flow: shape the story, refine with AI, then carry continuity into planning and shot decisions.
              </p>
            </div>

            <div className="rounded-xl border border-[#3F3F46] bg-[#111111] p-5 md:p-6 mb-6">
              <h3 className="text-xl font-semibold mb-3">1) Start With the Script</h3>
              <p className="text-sm text-gray-300 mb-4">
                Write directly in Wryda with a screenplay-first workflow. Your script stays the source of truth for character, location, prop, and shot planning.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-lg border border-[#2F2F2F] bg-[#0D0D0D] p-4 aspect-video overflow-auto">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Scene excerpt</p>
                  <pre className="text-xs sm:text-sm text-gray-200 whitespace-pre-wrap">{fountainDemoSnippet}</pre>
                </div>
                <StepCaptureCard
                  srcCandidates={step1CaptureSource}
                  itemKey="s1_script_capture"
                  alt="Screenplay workspace showing the active script in Wryda"
                  fallbackLabel="Screenplay workspace capture"
                  onOpen={openLightbox}
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#3F3F46] bg-[#111111] p-5 md:p-6 mb-6">
              <h3 className="text-xl font-semibold mb-3">2) Auto-Detect Story Elements</h3>
              <p className="text-sm text-gray-300 mb-4">
                Import an existing script or click Scan, and Wryda automatically detects characters and locations from your Fountain context. Props are added manually, then flow through the same continuity and planning pipeline.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <StepCaptureCard
                  srcCandidates={step2CaptureSources.scriptContext}
                  itemKey="s2_script_context"
                  alt="Script context showing interrogation room scene heading and character mentions"
                  fallbackLabel="Script context capture"
                  onOpen={openLightbox}
                />
                <StepCaptureCard
                  srcCandidates={step2CaptureSources.charactersDetected}
                  itemKey="s2_characters_detected"
                  alt="Detected characters list showing Mara Voss and Eli Trent"
                  fallbackLabel="Characters detected"
                  onOpen={openLightbox}
                />
                <StepCaptureCard
                  srcCandidates={step2CaptureSources.locationDetected}
                  itemKey="s2_location_detected"
                  alt="Detected location list showing Interrogation Room"
                  fallbackLabel="Location detected"
                  onOpen={openLightbox}
                />
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Script context auto-drives character and location setup. Props are manually added and attached per scene for production control.
              </p>
            </div>

            <div className="rounded-xl border border-[#3F3F46] bg-[#111111] p-5 md:p-6 mb-6">
              <h3 className="text-xl font-semibold mb-3">3) Wryda AI Agents</h3>
              <p className="text-sm text-gray-300 mb-4">
                Analyze, edit, and extend scenes with AI while keeping your screenplay context intact.
              </p>
              <StepCaptureCard
                srcCandidates={step3AgentsCaptureSource}
                itemKey="s3_agents_capture"
                alt="Story advisor style AI agent response shown alongside screenplay context"
                fallbackLabel="AI agents workflow capture"
                onOpen={openLightbox}
              />
              <p className="text-xs text-gray-400 mt-3">
                Story Advisor (hero): high-level scene guidance to diagnose issues, recommend improvements, and guide the next draft.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
                {step3AgentsOutputCards.map((agentCard, index) => (
                  <div key={agentCard.key} className="rounded-lg border border-[#2F2F2F] bg-[#0E0E0E] p-2">
                    <AgentsMiniCaptureCard
                      srcCandidates={agentCard.srcCandidates}
                      itemKey={`s3_agents_output_${index + 1}`}
                      alt={`${agentCard.label} agent output example`}
                      fallbackLabel={`Agent output ${index + 1}`}
                      onOpen={openLightbox}
                    />
                    <p className="text-xs uppercase tracking-wide text-gray-500 mt-2">{agentCard.label}</p>
                    <p className="text-xs text-gray-300 mt-1">{agentCard.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-[#3F3F46] bg-[#111111] p-5 md:p-6 mb-6">
              <h3 className="text-xl font-semibold mb-3">4) Character Workflow (Virtual Try-On)</h3>
              <p className="text-sm text-gray-300 mb-4">
                Keep one character identity locked while testing wardrobe references and generating production-ready outputs.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <StepCaptureCard
                  srcCandidates={step3CaptureSources.characterReference}
                  itemKey="s4_char_reference"
                  alt="Character reference image used for identity lock"
                  fallbackLabel="Reference image"
                  onOpen={openLightbox}
                />
                <StepCaptureCard
                  srcCandidates={step3CaptureSources.clothingInput}
                  itemKey="s4_clothing_reference"
                  alt="Clothing input image used for virtual try-on"
                  fallbackLabel="Clothing reference"
                  onOpen={openLightbox}
                />
                <StepCaptureCard
                  srcCandidates={step3CaptureSources.tryOnResult}
                  itemKey="s4_tryon_result"
                  alt="Virtual try-on result preserving character identity"
                  fallbackLabel="Virtual try-on result"
                  onOpen={openLightbox}
                />
                <StepCaptureCard
                  srcCandidates={step3CaptureSources.finalPoses}
                  itemKey="s4_final_pose"
                  alt="Final generated character pose set"
                  fallbackLabel="Final generated pose set"
                  onOpen={openLightbox}
                />
              </div>
              <div className="rounded-lg border border-[#2F2F2F] bg-[#0D0D0D] p-4 mt-3">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Prompt snippet</p>
                <p className="text-sm text-gray-300">
                  Base identity prompt + outfit add-on: black hoodie, light jacket (see image), blue eyes.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#3F3F46] bg-[#111111] p-5 md:p-6 mb-6">
              <h3 className="text-xl font-semibold mb-3">5) Location Workflow</h3>
              <p className="text-sm text-gray-300 mb-4">
                Turn one location reference into cinematic coverage with angle variants, mood passes, and close-up texture detail.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <StepCaptureCard
                  srcCandidates={step4CaptureSources.locationReference}
                  itemKey="s5_location_reference"
                  alt="Location reference image used for continuity"
                  fallbackLabel="Reference image"
                  onOpen={openLightbox}
                />
                <StepCaptureCard
                  srcCandidates={step4CaptureSources.locationAngles}
                  itemKey="s5_location_angles"
                  alt="Location angle outputs derived from one reference"
                  fallbackLabel="Location angle outputs"
                  onOpen={openLightbox}
                />
                <StepCaptureCard
                  srcCandidates={step4CaptureSources.locationBackgrounds}
                  itemKey="s5_location_backgrounds"
                  alt="Location background variation outputs"
                  fallbackLabel="Location background outputs"
                  onOpen={openLightbox}
                />
                <StepCaptureCard
                  srcCandidates={step4CaptureSources.locationXcu}
                  itemKey="s5_location_xcu"
                  alt="Extreme close-up background detail plate"
                  fallbackLabel="Extreme close-up background plate"
                  onOpen={openLightbox}
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#3F3F46] bg-[#111111] p-5 md:p-6 mb-6">
              <h3 className="text-xl font-semibold mb-3">6) Prop Workflow</h3>
              <p className="text-sm text-gray-300 mb-4">
                Build prop continuity with two story-critical props using reference, angle variants, and macro detail outputs.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <StepCaptureCard
                  srcCandidates={step5CaptureSources.propReference}
                  itemKey="s6_prop_reference"
                  alt="Prop reference image for continuity"
                  fallbackLabel="Reference image"
                  onOpen={openLightbox}
                />
                <StepCaptureCard
                  srcCandidates={step5CaptureSources.propAngles}
                  itemKey="s6_prop_angles"
                  alt="Prop angle outputs generated from the reference"
                  fallbackLabel="Prop angle outputs"
                  onOpen={openLightbox}
                />
                <StepCaptureCard
                  srcCandidates={step5CaptureSources.propMacro}
                  itemKey="s6_prop_macro"
                  alt="Macro detail output for storytelling inserts"
                  fallbackLabel="Macro detail output"
                  onOpen={openLightbox}
                />
              </div>
            </div>

            <div className="rounded-xl border border-[#3F3F46] bg-[#111111] p-5 md:p-6">
              <h3 className="text-xl font-semibold mb-3">7) Shots (Scene Builder + Shot Board)</h3>
              <p className="text-sm text-gray-300 mb-4">
                Carry the same script context into shot-level planning, compare options, and lock visual intent before generation.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <StepCaptureCard
                  srcCandidates={step7CaptureSources.sceneBuilder}
                  itemKey="s7_scene_builder"
                  alt="Scene Builder view showing shot sequence and planning context"
                  fallbackLabel="Scene Builder preview"
                  onOpen={openLightbox}
                />
                <StepCaptureCard
                  srcCandidates={step7CaptureSources.shotBoard}
                  itemKey="s7_shot_board"
                  alt="Shot Board view showing shot variants and continuity planning"
                  fallbackLabel="Shot Board preview"
                  onOpen={openLightbox}
                />
                <StepCaptureCard
                  srcCandidates={step7CaptureSources.teaser}
                  itemKey="s7_teaser"
                  alt="End-result teaser frame from generated sequence"
                  fallbackLabel="End-result teaser video"
                  onOpen={openLightbox}
                />
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Model-agnostic by design: take approved shots into your preferred video workflow.
              </p>
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

      {lightboxState ? (
        <div
          className="fixed inset-0 z-[100] bg-black/90 p-4 md:p-8 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            type="button"
            className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-white/90 hover:text-white text-3xl leading-none border border-white/30 rounded-full h-10 w-10 bg-black/40"
            onClick={(event) => {
              event.stopPropagation();
              goToPrevLightboxItem();
            }}
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            type="button"
            className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 text-white/90 hover:text-white text-3xl leading-none border border-white/30 rounded-full h-10 w-10 bg-black/40"
            onClick={(event) => {
              event.stopPropagation();
              goToNextLightboxItem();
            }}
            aria-label="Next image"
          >
            ›
          </button>
          <button
            type="button"
            className="absolute top-4 right-4 text-white/80 hover:text-white text-sm border border-white/30 rounded px-3 py-1 bg-black/40"
            onClick={closeLightbox}
          >
            Close
          </button>
          <img
            src={lightboxItems[lightboxState.itemIndex]?.srcCandidates[lightboxState.sourceIndex] || ""}
            alt={lightboxState.alt}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg border border-[#2F2F2F] bg-[#0B0B0B]"
            onClick={(event) => event.stopPropagation()}
            onError={() => {
              const currentItem = lightboxItems[lightboxState.itemIndex];
              if (!currentItem) return;
              if (lightboxState.sourceIndex < currentItem.srcCandidates.length - 1) {
                setLightboxState((previous) =>
                  previous
                    ? { ...previous, sourceIndex: previous.sourceIndex + 1 }
                    : previous
                );
              }
            }}
          />
          <p className="absolute bottom-4 text-xs text-white/70 tracking-wide">
            {lightboxState.itemIndex + 1} / {lightboxItems.length}
          </p>
        </div>
      ) : null}

      <Footer />
    </>
  );
}
