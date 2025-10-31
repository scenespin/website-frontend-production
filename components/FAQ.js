"use client";

import { useRef, useState } from "react";

// <FAQ> component is a lsit of <Item> component
// Just import the FAQ & add your FAQ content to the const faqList

const faqList = [
  {
    question: "Do I really get all features for free?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p>Yes! Every user gets full access to all tools, quality tiers, and aspect ratios from day one.</p>
        <p><strong>What&apos;s included FREE:</strong></p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Professional screenplay editor & timeline (8 tracks)</li>
          <li>65 compositions + 30 Hollywood transitions</li>
          <li>Upload unlimited footage</li>
          <li>Character Bank, Cloud Storage</li>
          <li>All quality tiers (1080p, Premium 4K, Ultra Native 4K)</li>
          <li>All aspect ratios (16:9, 9:16, 1:1, 4:3, 21:9)</li>
        </ul>
        <p><strong>You only pay for AI compute when generating videos.</strong> The software itself, all editing tools, compositions, transitions, and uploads are 100% free forever.</p>
      </div>
    ),
  },
  {
    question: "How do credits work? What can I make with them?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p><strong>Free Plan:</strong> 100 signup credits + 10 credits/month = ~2 professional 1080p videos</p>
        <p><strong>Pro Plan ($29/mo):</strong> 3,000 credits = ~60 professional 1080p videos</p>
        <p><strong>Ultra Plan ($149/mo):</strong> 20,000 credits = ~400 professional videos</p>
        <p><strong>Studio Plan ($399/mo):</strong> 75,000 credits = ~1,500 professional videos</p>
        <p className="pt-2"><strong>Credit costs by quality tier:</strong></p>
        <ul className="list-disc pl-5">
          <li>Professional 1080p: 50 credits per 5s</li>
          <li>Premium 4K: 75 credits per 5s</li>
          <li>Ultra Native 4K: 150 credits per 5s</li>
        </ul>
        <p>All aspect ratios are base price except 21:9 Cinema (+15 credits).</p>
      </div>
    ),
  },
  {
    question: "Can I upload my own footage? What formats do you support?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p><strong>Yes! Upload unlimited footage for FREE—100% of it, 0 credits, forever.</strong></p>
        <p><strong>Supported Formats:</strong></p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Video:</strong> MP4, MOV, WebM, MKV (up to 100MB per file)</li>
          <li><strong>Audio:</strong> MP3, WAV, AAC, OGG (up to 10MB per file)</li>
          <li><strong>Images:</strong> JPG, PNG, GIF, WebP (up to 10MB per file)</li>
          <li><strong>Resolution:</strong> ANY (4K, 8K, RED camera footage, DaVinci exports, etc.)</li>
          <li><strong>Aspect Ratio:</strong> ANY (we handle it all)</li>
        </ul>
        <p><strong>Your footage workflow:</strong></p>
        <ul className="list-disc pl-5 space-y-1">
          <li>✅ Upload for FREE (0 credits)</li>
          <li>✅ Edit on 8-track timeline for FREE</li>
          <li>✅ Apply 30 Hollywood transitions for FREE</li>
          <li>✅ Mix with AI-generated clips (pay for AI only)</li>
          <li>✅ Export final render (pay for rendering only)</li>
        </ul>
        <p><strong>Storage:</strong> Save to YOUR Google Drive or Dropbox—we just reference the URLs. No vendor lock-in. Same approach as Premiere Pro & DaVinci Resolve.</p>
        <p className="font-semibold text-primary">Think of it as: Replace your entire software stack for $0, only pay for AI & rendering.</p>
      </div>
    ),
  },
  {
    question: "What's the difference between Free, Pro, Ultra, and Studio?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p><strong>Simple answer: Just the number of credits per month.</strong></p>
        <p>Every tier gets:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>✅ All features unlocked</li>
          <li>✅ All quality tiers (1080p, Premium 4K, Ultra Native 4K)</li>
          <li>✅ All aspect ratios (16:9, 9:16, 1:1, 4:3, 21:9)</li>
          <li>✅ Upload unlimited footage</li>
          <li>✅ 65 compositions + 30 transitions</li>
          <li>✅ No watermarks, no vendor lock-in</li>
          <li>✅ Character Bank</li>
        </ul>
        <p><strong>Choose based on how many AI videos you need per month. That&apos;s it!</strong></p>
        <p className="text-sm opacity-70 mt-2 italic">Remember: You&apos;re never charged for using the software, editing tools, or uploading footage. You only pay credits when generating AI videos.</p>
      </div>
    ),
  },
  {
    question: "Is this really cheaper than traditional video production tools?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p><strong>Way cheaper. Here&apos;s the breakdown:</strong></p>
        <p><strong>Traditional Stack:</strong> $1,776/year</p>
        <ul className="list-disc pl-5 text-sm">
          <li>Final Draft (Screenwriting): $250/yr</li>
          <li>Adobe Premiere Pro (Video Editing): $263/yr</li>
          <li>Adobe After Effects (VFX/Motion Graphics): $263/yr</li>
          <li>Stock footage subscription (Artgrid/Storyblocks): $500/yr</li>
          <li>Stock music/SFX (Epidemic Sound): $300/yr</li>
          <li>Cloud storage (200GB+): $200/yr</li>
        </ul>
        <p><strong>Wryda.ai Pro:</strong> $348/year (save $1,428/year)</p>
        <p><strong>Plus you get:</strong></p>
        <ul className="list-disc pl-5">
          <li>All-in-one platform (no tool juggling)</li>
          <li>AI video generation built-in</li>
          <li>Character consistency across scenes</li>
          <li>Screenplay-driven automation</li>
          <li>No vendor lock-in - export to Drive/Dropbox</li>
        </ul>
        <p>Traditional tools can&apos;t generate AI video. Wryda.ai replaces 6+ tools with one.</p>
      </div>
    ),
  },
];

const Item = ({ item }) => {
  const accordion = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li>
      <button
        className="relative flex gap-2 items-center w-full py-5 text-base font-semibold text-left border-t md:text-lg border-base-content/10"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        aria-expanded={isOpen}
      >
        <span
          className={`flex-1 text-base-content ${isOpen ? "text-primary" : ""}`}
        >
          {item?.question}
        </span>
        <svg
          className={`flex-shrink-0 w-4 h-4 ml-auto fill-current`}
          viewBox="0 0 16 16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect
            y="7"
            width="16"
            height="2"
            rx="1"
            className={`transform origin-center transition duration-200 ease-out ${
              isOpen && "rotate-180"
            }`}
          />
          <rect
            y="7"
            width="16"
            height="2"
            rx="1"
            className={`transform origin-center rotate-90 transition duration-200 ease-out ${
              isOpen && "rotate-180 hidden"
            }`}
          />
        </svg>
      </button>

      <div
        ref={accordion}
        className={`transition-all duration-300 ease-in-out opacity-80 overflow-hidden`}
        style={
          isOpen
            ? { maxHeight: accordion?.current?.scrollHeight, opacity: 1 }
            : { maxHeight: 0, opacity: 0 }
        }
      >
        <div className="pb-5 leading-relaxed">{item?.answer}</div>
      </div>
    </li>
  );
};

const FAQ = () => {
  return (
    <section className="bg-base-200 py-24 px-8" id="faq">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12">
        <div className="flex flex-col text-left basis-1/2">
          <p className="inline-block font-semibold text-primary mb-4">FAQ</p>
          <p className="sm:text-4xl text-3xl font-extrabold text-base-content">
            Frequently Asked Questions
          </p>
        </div>

        <ul className="basis-1/2">
          {faqList.map((item, i) => (
            <Item key={i} item={item} />
          ))}
        </ul>
      </div>
    </section>
  );
};

export default FAQ;
