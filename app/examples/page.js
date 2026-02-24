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

export default function ExamplesPage() {
  const { data: status, isLoading: statusLoading } = useShowcaseStatus();
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

  const writingExamples = [
    {
      title: "Action Sequence Tightening",
      agent: "Rewrite",
      before:
        "Sarah walks into the newsroom and looks around nervously as everyone stares at her and she slowly walks toward her desk.",
      after:
        "Sarah pushes through the newsroom doors and heads for her desk as conversations die and heads turn; she keeps her eyes forward, jaw tight, refusing to give anyone the satisfaction of eye contact.",
      outcome: "Delivers tighter pacing and clearer visual readability while preserving the same single-shot action intent.",
    },
    {
      title: "Context-Guided Dialogue Draft",
      agent: "Dialogue",
      before:
        "Scene context: INT. NEWSROOM - NIGHT\nCharacters selected: RIVERA, SARAH\nConflict/Tension: Rivera warns Sarah to back off before Blake retaliates.\nTone: tense\nSubtext: Rivera is scared for her but hides it behind authority.\n\nCurrent script at cursor:\nRIVERA\nI think you should stop investigating Blake because this is becoming dangerous and it is not worth your safety.\n\nSARAH\nI understand what you are saying but I cannot stop now because too many people are depending on this and I have already gone too far.",
      after:
        "RIVERA\nWalk away, Sarah. Blake doesn’t scare easy, and you’re on his radar now.\n\nSARAH\nGood. Let him know I’m not leaving.",
      outcome: "Shows guided dialogue generation from scene context and writer inputs, inserted additively at the cursor for review or further editing.",
    },
    {
      title: "Scene-Level Escalation Pass",
      agent: "Screenwriter",
      before:
        "INT. PARKING GARAGE - NIGHT\n\nRivera meets Sarah in the garage. He gives her a USB with files that could expose Blake. They agree to review it in the morning and leave separately.",
      after:
        "INT. PARKING GARAGE - NIGHT\n\nRivera steps from the shadows, rainwater dripping off his coat. He presses a USB into Sarah’s palm.\n\nRIVERA\nIf this gets out, Blake’s finished. If it doesn’t, we are.\n\nA CAR ENGINE turns over above them. Headlights sweep the concrete.\n\nSARAH\nWe don’t wait until morning.\n\nShe pockets the drive. They split in opposite directions as the headlights descend the ramp.",
      outcome: "Raises stakes, adds urgency, and strengthens the scene turn so momentum carries into the next beat.",
    },
    {
      title: "Story Direction Guidance",
      agent: "Story Advisor",
      before:
        "ACT II currently feels flat: Sarah keeps investigating, but each scene lands at the same emotional level and the antagonist pressure does not escalate.",
      after:
        "Story Advisor feedback:\n1) Add a visible cost by the midpoint (career, relationship, or safety).\n2) Introduce a false win that backfires two scenes later.\n3) Force Sarah into a no-return choice before Act III.\n\nRevision direction selected by writer:\n- Midpoint false win: source appears cooperative.\n- Backfire: source is linked to Blake.\n- No-return choice: Sarah publishes partial evidence anyway.",
      outcome: "Demonstrates strategic, writer-directed story shaping where the final direction depends on your goals and notes.",
    },
    {
      title: "Directed Scene Skeleton Draft",
      agent: "Director",
      before:
        "Scene 1 Input (Director modal)\nLocation: INT. NEWSROOM - NIGHT\nScenario: Sarah confronts Blake near the elevators as security closes in.\nDirection: Keep it tense and fast, with a threat beat at the end.\n\nCurrent scene context is preserved; generate a NEW scene that comes after the current page.",
      after:
        "INT. NEWSROOM - NIGHT\n\nFluorescent lights buzz over an almost empty floor. Sarah cuts Blake off at the elevators.\n\nSARAH\nYou buried the audit trail.\n\nBLAKE\nI protected people who know how to protect me.\n\nSecurity pivots from the far hallway and moves in.\n\nSARAH\nThen you won&apos;t mind when I publish everything at sunrise.\n\nThe elevator doors open. Blake backs in without blinking.\n\nBLAKE\nYou won&apos;t make sunrise.",
      outcome: "Shows Director creating a structured scene draft from location/scenario/direction inputs and inserting it as a new additive block.",
    },
  ];
  const topRowExamples = writingExamples.filter((example) =>
    ["Rewrite", "Screenwriter", "Story Advisor"].includes(example.agent)
  );
  const bottomRowExamples = writingExamples.filter((example) =>
    ["Dialogue", "Director"].includes(example.agent)
  );
  
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
                Paste a Fountain scene and Wryda uses it as the source of truth for downstream character, location, prop, and shot planning.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-lg border border-[#2F2F2F] bg-[#0D0D0D] p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Scene excerpt</p>
                  <pre className="text-xs sm:text-sm text-gray-200 whitespace-pre-wrap">{fountainDemoSnippet}</pre>
                </div>
                <div className="rounded-lg border border-[#2F2F2F] bg-gradient-to-br from-[#171717] to-[#0F0F0F] p-4 min-h-[220px] flex items-center justify-center">
                  <p className="text-sm text-gray-400">Screenplay workspace capture</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#3F3F46] bg-[#111111] p-5 md:p-6 mb-6">
              <h3 className="text-xl font-semibold mb-3">2) Auto-Detect Story Elements</h3>
              <p className="text-sm text-gray-300 mb-4">
                Wryda reads your script and automatically detects core story entities from Fountain context.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg border border-[#2F2F2F] bg-gradient-to-br from-[#171717] to-[#0F0F0F] p-4 min-h-[120px] flex items-center justify-center">
                  <p className="text-sm text-gray-400">Auto-populated entities view</p>
                </div>
                <div className="rounded-lg border border-[#2F2F2F] bg-[#0D0D0D] p-4 min-h-[120px]">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Detected entities</p>
                  <p className="text-sm text-gray-300">Characters: Mara Voss, Eli Trent</p>
                  <p className="text-sm text-gray-300">Location: Interrogation Room</p>
                </div>
                <div className="rounded-lg border border-[#2F2F2F] bg-[#0D0D0D] p-4 min-h-[120px]">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Production props (manual by design)</p>
                  <p className="text-sm text-gray-300">Props are production metadata. Add them manually, then attach them to the scene for continuity planning and shot setup.</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Script context auto-drives character and location setup, while props stay user-directed for production control.
              </p>
            </div>

            <div className="rounded-xl border border-[#3F3F46] bg-[#111111] p-5 md:p-6 mb-6">
              <h3 className="text-xl font-semibold mb-3">3) Reference Uploads (Character / Location / Prop)</h3>
              <p className="text-sm text-gray-300 mb-4">
                Reference uploads anchor consistency across all generated outputs.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg border border-[#2F2F2F] bg-gradient-to-br from-[#171717] to-[#0F0F0F] p-4 min-h-[140px] flex items-center justify-center">
                  <p className="text-sm text-gray-400">Character reference library</p>
                </div>
                <div className="rounded-lg border border-[#2F2F2F] bg-gradient-to-br from-[#171717] to-[#0F0F0F] p-4 min-h-[140px] flex items-center justify-center">
                  <p className="text-sm text-gray-400">Location reference library</p>
                </div>
                <div className="rounded-lg border border-[#2F2F2F] bg-gradient-to-br from-[#171717] to-[#0F0F0F] p-4 min-h-[140px] flex items-center justify-center">
                  <p className="text-sm text-gray-400">Prop reference library</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#3F3F46] bg-[#111111] p-5 md:p-6 mb-6">
              <h3 className="text-xl font-semibold mb-3">4) Generated Assets (Live)</h3>
              <p className="text-sm text-gray-300 mb-4">
                Live demo-account outputs from one coherent screenplay world: character poses, location angles/backgrounds, and prop continuity renders.
              </p>
            </div>

            <div className="rounded-xl border border-[#3F3F46] bg-[#111111] p-5 md:p-6">
              <h3 className="text-xl font-semibold mb-3">5) Direct / Shot Board Preview (Coming Soon)</h3>
              <p className="text-sm text-gray-300 mb-4">
                Scene Builder and Shot Board previews connect this same script context to shot-level planning and execution.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg border border-[#2F2F2F] bg-gradient-to-br from-[#171717] to-[#0F0F0F] p-4 min-h-[140px] flex items-center justify-center">
                  <p className="text-sm text-gray-400">Scene Builder preview</p>
                </div>
                <div className="rounded-lg border border-[#2F2F2F] bg-gradient-to-br from-[#171717] to-[#0F0F0F] p-4 min-h-[140px] flex items-center justify-center">
                  <p className="text-sm text-gray-400">Shot Board preview</p>
                </div>
                <div className="rounded-lg border border-[#2F2F2F] bg-gradient-to-br from-[#171717] to-[#0F0F0F] p-4 min-h-[140px] flex items-center justify-center">
                  <p className="text-sm text-gray-400">Video teaser preview</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Writing Before/After Examples */}
        <section className="pt-8 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Before/After Writing Examples</h2>
              <p className="text-gray-300 max-w-3xl mx-auto">
                Sample text edits showing how writers can use Wryda agents for rewrite, dialogue polish, and scene expansion.
              </p>
              <p className="text-sm text-gray-400 max-w-3xl mx-auto mt-4">
                These are representative sample outputs from in-product agent runs. Results are guided by user prompts and goals, so the same tools can produce very different outcomes based on writer direction, tone, and revision intent.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {topRowExamples.map((example) => (
                <article
                  key={example.title}
                  className="rounded-xl border border-[#3F3F46] bg-[#111111] p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">{example.title}</h3>
                    <span className="text-xs px-2 py-1 rounded bg-[#DC143C]/20 text-[#F28BA0] border border-[#DC143C]/40">
                      {example.agent}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Before</p>
                      <p className="text-sm text-gray-300 whitespace-pre-line">{example.before}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">After</p>
                      <p className="text-sm text-white whitespace-pre-line">{example.after}</p>
                    </div>
                    <div className="pt-2 border-t border-[#2A2A2A]">
                      <p className="text-xs text-gray-400">{example.outcome}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 max-w-5xl mx-auto">
              {bottomRowExamples.map((example) => (
                <article
                  key={example.title}
                  className="rounded-xl border border-[#3F3F46] bg-[#111111] p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">{example.title}</h3>
                    <span className="text-xs px-2 py-1 rounded bg-[#DC143C]/20 text-[#F28BA0] border border-[#DC143C]/40">
                      {example.agent}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Before</p>
                      <p className="text-sm text-gray-300 whitespace-pre-line">{example.before}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">After</p>
                      <p className="text-sm text-white whitespace-pre-line">{example.after}</p>
                    </div>
                    <div className="pt-2 border-t border-[#2A2A2A]">
                      <p className="text-xs text-gray-400">{example.outcome}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Media Examples Intro */}
        <section className="pt-2 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Media Examples (Production-Ready Continuity)</h2>
              <p className="text-gray-300 max-w-3xl mx-auto">
                After you shape the story on the page, Wryda turns screenplay context into consistent visual outputs for production planning.
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
