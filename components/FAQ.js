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
        <p><strong>You only pay for AI & compute when generating or rendering videos.</strong> The software itself, all editing tools, compositions, transitions, and uploads are 100% free forever.</p>
      </div>
    ),
  },
  {
    question: "How do credits work? What can I make with them?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p><strong>Free Plan:</strong> 50 signup credits + 10 credits/month = ~1 professional 1080p video</p>
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
          <li>✅ Export final render (nominal rendering fee)</li>
        </ul>
        <p><strong>Storage:</strong> Save to YOUR Google Drive or Dropbox—we just reference the URLs. No vendor lock-in. Same approach as Premiere Pro & DaVinci Resolve.</p>
        <p className="font-semibold text-primary">Think of it as: Replace your entire software stack for $0, only pay for AI & rendering compute.</p>
      </div>
    ),
  },
  {
    question: "What's the difference between Free, Pro, Ultra, and Studio plans?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p><strong>Simple: It's just volume discounts on credits.</strong></p>
        <p>Every tier gets the exact same features:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>✅ All features unlocked (no feature gating)</li>
          <li>✅ All quality tiers (1080p, Premium 4K, Ultra Native 4K)</li>
          <li>✅ All aspect ratios (16:9, 9:16, 1:1, 4:3, 21:9)</li>
          <li>✅ Upload unlimited footage</li>
          <li>✅ 65 compositions + 30 transitions</li>
          <li>✅ No watermarks, no vendor lock-in</li>
        </ul>
        <p><strong>The difference? Just how many credits you get per dollar:</strong></p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Pay-as-you-go:</strong> 1 credit = $0.01 (baseline price)</li>
          <li><strong>Pro ($29/mo):</strong> 3,000 credits = ~3% discount</li>
          <li><strong>Ultra ($149/mo):</strong> 20,000 credits = ~25% discount</li>
          <li><strong>Studio ($399/mo):</strong> 75,000 credits = ~47% discount</li>
        </ul>
        <p className="font-semibold text-primary">Higher tiers = deeper discounts. Choose based on your monthly video needs!</p>
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
        <p><strong>Wryda.ai:</strong> $0/month + free footage uploads + only pay for AI generation & rendering compute</p>
        <p><strong>Plus you get:</strong></p>
        <ul className="list-disc pl-5">
          <li>All-in-one platform (no tool juggling)</li>
          <li>AI video generation built-in</li>
          <li>Character consistency across scenes</li>
          <li>Screenplay-driven automation</li>
          <li>No vendor lock-in - export to Drive/Dropbox</li>
        </ul>
        <p className="font-semibold">Traditional tools can&apos;t generate AI video. Wryda.ai replaces 6+ tools with one, and you only pay for what you use.</p>
      </div>
    ),
  },
  {
    question: "What is HDR video and why should I care?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p><strong>HDR (High Dynamic Range) = Cinema-grade color depth.</strong></p>
        <p>We&apos;re the ONLY AI platform that can generate AND upgrade videos to 16-bit HDR.</p>
        <p><strong>What you get with HDR:</strong></p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Vivid, accurate colors (not washed out)</li>
          <li>Professional film festival quality</li>
          <li>16-bit color depth (vs standard 8-bit)</li>
          <li>Ready for DaVinci Resolve color grading</li>
          <li>Export as EXR for pro workflows</li>
        </ul>
        <p><strong>HDR Workflows:</strong></p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Native HDR Generation:</strong> Generate videos in HDR from scratch (100-300 credits)</li>
          <li><strong>SDR to HDR Upgrade:</strong> Convert ANY video to HDR - even from other AI tools! (30 credits per video)</li>
          <li><strong>Multi-Format HDR:</strong> Generate once, export to all platforms in HDR</li>
        </ul>
        <p className="font-semibold text-primary">We're the ONLY AI platform with true cinema-grade HDR support.</p>
      </div>
    ),
  },
  {
    question: "Why does my receipt show 'Garden State Concentrate LLC' instead of Wryda.ai?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p><strong>Wryda.ai is a product of Garden State Concentrate LLC.</strong> This is our parent company that handles all legal and financial operations.</p>
        <p>When you make a purchase, your receipt and credit card statement will show "Garden State Concentrate LLC" as the merchant name. This is normal and required for tax and compliance purposes.</p>
        <p><strong>What you'll see:</strong></p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Receipts/Invoices:</strong> "Garden State Concentrate LLC" (legal entity name)</li>
          <li><strong>Credit Card Statement:</strong> "WRYDA.AI" (statement descriptor)</li>
          <li><strong>Checkout Page:</strong> "Wryda.ai" branding and messaging</li>
        </ul>
        <p>Your purchase is 100% for Wryda.ai services - the parent company name is just for legal/billing purposes. This is a standard practice for businesses operating under a DBA (Doing Business As) structure.</p>
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
