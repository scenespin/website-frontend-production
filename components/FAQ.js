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
        <p><strong>What's included FREE:</strong></p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Professional screenplay editor & timeline (8 tracks)</li>
          <li>65 compositions + 30 Hollywood transitions</li>
          <li>Upload unlimited footage</li>
          <li>Character Bank, Voice Cloning, Cloud Storage</li>
          <li>All quality tiers (1080p, Premium 4K, Ultra Native 4K)</li>
          <li>All aspect ratios (16:9, 9:16, 1:1, 4:3, 21:9)</li>
        </ul>
        <p>You only pay credits when generating AI video/image content. Everything else is 100% free.</p>
      </div>
    ),
  },
  {
    question: "How do credits work? What can I make with them?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p><strong>Free Plan:</strong> 100 signup credits + 10/month = ~2 professional 1080p videos</p>
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
    question: "Can I use my own footage, or is it all AI-generated?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p><strong>Both!</strong> This is what makes Wryda.ai unique:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Upload your own footage:</strong> 100% FREE, unlimited uploads</li>
          <li><strong>Mix & match:</strong> Combine your camera shots with AI-generated VFX, B-roll, and locations</li>
          <li><strong>Apply Hollywood tools:</strong> Use our 65 compositions and 30 transitions on any footage</li>
          <li><strong>Professional editing:</strong> Full timeline editor with 8 tracks</li>
        </ul>
        <p>Think of it as: <strong>Your Camera Footage + AI Shots + Hollywood Tools = Pro Film at 1% Cost</strong></p>
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
          <li>✅ Character consistency, voice cloning, 3D export</li>
        </ul>
        <p>Choose based on how many AI videos you need per month. That's it!</p>
      </div>
    ),
  },
  {
    question: "Is this really cheaper than traditional video production tools?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        <p><strong>Way cheaper. Here's the breakdown:</strong></p>
        <p><strong>Traditional Stack:</strong> $1,571/year</p>
        <ul className="list-disc pl-5 text-sm">
          <li>Screenwriting software: $250/yr</li>
          <li>Video editing suite: $263/yr</li>
          <li>Motion graphics software: $263/yr</li>
          <li>Professional video editor: $295</li>
          <li>Stock footage & music: $500/yr</li>
        </ul>
        <p><strong>Wryda.ai Pro:</strong> $348/year (save $1,223/year)</p>
        <p><strong>Plus you get:</strong></p>
        <ul className="list-disc pl-5">
          <li>All-in-one platform (no tool juggling)</li>
          <li>AI video generation built-in</li>
          <li>Character consistency across scenes</li>
          <li>Screenplay-driven automation</li>
          <li>No vendor lock-in - export to Drive/Dropbox</li>
        </ul>
        <p>Traditional tools can't generate AI video. Wryda.ai replaces 6+ tools with one.</p>
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
    <section className="bg-base-200" id="faq">
      <div className="py-24 px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-12">
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
