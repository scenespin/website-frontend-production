export const mediaShowcaseContent = {
  tabs: [
    {
      id: "references",
      label: "References",
      headline: "Reference Consistency Workflows",
      howItWorks:
        "Turn reference inputs into controlled character, location, and asset sets that stay consistent across your project.",
      sampleFlow: [
        "Add a reference image or prompt.",
        "Apply controls (wardrobe/style, angle/background, time/weather).",
        "Generate a reusable reference set for production planning.",
      ],
      outputCaptions: [
        "Character: Reference -> Wardrobe/Style Inputs -> Pose Set",
        "Location: Reference -> Time/Weather/Angle Inputs -> Coverage Pack",
        "Asset: Prompt/Reference -> Category + Angle Inputs -> Asset Set",
      ],
    },
    {
      id: "shot-board",
      label: "Shot Board",
      headline: "Shot Board to First-Frame Handoff",
      howItWorks:
        "Organize first frames by scene, iterate shot variations, then hand off directly to video generation.",
      sampleFlow: [
        "Review first frames grouped by scene/shot context.",
        "Cycle variations to select the best framing.",
        "Click Generate Video to open Video mode with the frame prefilled.",
      ],
      outputCaptions: [
        "Scene-organized first-frame grid",
        "Variation cycling on selected shot",
        "One-click handoff into video workflow",
      ],
    },
    {
      id: "video",
      label: "Video",
      headline: "Writer-Controlled Visual Planning",
      howItWorks:
        "Choose the level of control from concept generation to first-frame continuity and frame-to-frame transitions.",
      sampleFlow: [
        "Choose mode: Text->Video, First Frame->Video, or Frame->Frame.",
        "Set prompt + motion/format controls.",
        "Generate a clip that stays aligned with your visual intent.",
      ],
      outputCaptions: [
        "Text->Video: concept exploration",
        "First Frame->Video: continuity from selected shot",
        "Frame->Frame: controlled transition between defined beats",
      ],
      supportingLine:
        "You choose the model/provider directly, then control creative direction with prompt, motion, and format settings.",
    },
    {
      id: "dialogue-voice",
      label: "Dialogue + Voice",
      headline: "Dialogue Performance + Voice Control",
      howItWorks:
        "Pair dialogue shots with consistent character voice identity, or intentionally switch voice profiles when needed.",
      sampleFlow: [
        "Assign voice path (Auto-Matched or Custom ElevenLabs).",
        "Choose performance path (Talking Head or Motion/Performance).",
        "Generate dialogue video with controlled voice continuity.",
      ],
      outputCaptions: [
        "Consistency test: same character + line across shots, same voice profile",
        "Control test: same character + line, alternate voice profiles by choice",
        "Performance modes: talking-head clarity vs motion-driven delivery",
      ],
      supportingLine:
        "Voice identity is user-directed: keep it consistent for continuity or vary it intentionally for creative options.",
    },
  ],
};

export default mediaShowcaseContent;
