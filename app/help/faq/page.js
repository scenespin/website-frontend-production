import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `FAQ | ${config.appName}`,
  description: "Frequently asked questions about Wryda.ai - Credits, pricing, features, and getting started.",
  canonicalUrlRelative: "/help/faq",
});

export default function FAQHelp() {
  return (
    <>
      <header className="p-4 flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-extrabold">
            {config.appName}<span className="text-[#DC143C]">.ai</span>
          </span>
        </Link>
        <Link href="/help" className="btn btn-ghost">← Back to Help</Link>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-16">
        <h1 className="text-4xl font-extrabold mb-4">❓ Frequently Asked Questions</h1>
        <p className="text-xl opacity-80 mb-12">
          Quick answers to common questions about Wryda.ai
        </p>

        <div className="space-y-6">
          <FAQItem
            question="How do credits work?"
            answer={
              <>
                <p className="mb-3">
                  Wryda.ai uses a credit-based system. You get <strong>50 credits free when you sign up</strong>, 
                  plus <strong>10 credits per month</strong> (non-accumulating, max 20 credits if you wait 2 months).
                </p>
                <p className="mb-3">
                  <strong>What's FREE (no credits required):</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 mb-3 ml-4">
                  <li>Professional screenplay editor (Fountain format)</li>
                  <li>5 AI writing agents</li>
                  <li>Character, location, and prop banks</li>
                  <li>Cloud backup (Google Drive & Dropbox)</li>
                  <li>All planning tools</li>
                </ul>
                <p className="mb-3">
                  <strong>What costs credits:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>AI video generation (25-120 credits per video)</li>
                  <li>AI screenplay readings (varies)</li>
                  <li>Scene Builder / Motion Picture Technology</li>
                  <li>Composition layouts (10-30 credits)</li>
                  <li>Video exports (varies by format)</li>
                </ul>
                <p className="mt-3">
                  You only pay for what you create, not for access to the platform.
                </p>
              </>
            }
          />

          <FAQItem
            question="What makes Wryda.ai different from Final Draft?"
            answer={
              <>
                <p className="mb-3">
                  Final Draft charges $249/year for a screenplay editor. We give that away <strong>FREE</strong>. 
                  But here's what they don't tell you: To actually make your film, you need:
                </p>
                <ul className="list-disc list-inside space-y-1 mb-3 ml-4">
                  <li>Story Advisor (reads entire screenplay) - Not available elsewhere</li>
                  <li>Table reads - We have AI screenplay readings with character voices</li>
                  <li>Character/location/prop consistency - Not available elsewhere</li>
                  <li>Scene Builder (Motion Picture Technology) - Not available elsewhere</li>
                  <li>Video generation - Built-in with 3 AI providers</li>
                </ul>
                <p>
                  <strong>Final Draft writes the script. Wryda makes the film.</strong> We're the only platform 
                  that gives you all of this - all in one place.
                </p>
              </>
            }
          />

          <FAQItem
            question="How do I create my first video?"
            answer={
              <>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li><strong>Write your screenplay</strong> - Use the Write section to create your script</li>
                  <li><strong>Set up consistency</strong> - Upload character images, locations, and props to the banks</li>
                  <li><strong>Generate videos</strong> - Go to Production and use workflows or Scene Builder</li>
                  <li><strong>Compose your layout</strong> - Arrange clips in Composition Studio</li>
                  <li><strong>Edit & export</strong> - Polish in Timeline editor and export in your preferred format</li>
                </ol>
                <p className="mt-3">
                  Check out our <Link href="/help/writing" className="link link-primary">Writing</Link> and{' '}
                  <Link href="/help/production" className="link link-primary">Production</Link> guides for detailed instructions.
                </p>
              </>
            }
          />

          <FAQItem
            question="What are the 5 AI writing agents?"
            answer={
              <>
                <p className="mb-3">All agents understand your screenplay context and work together:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Story Advisor</strong> (UNIQUE) - Reads your entire screenplay, analyzes structure, tracks character arcs</li>
                  <li><strong>Screenwriter</strong> - Continue scenes, expand dialogue, develop characters</li>
                  <li><strong>Director</strong> - Generate full scenes with action, dialogue, and direction</li>
                  <li><strong>Dialogue</strong> - Polish dialogue, match character voice, improve conversations</li>
                  <li><strong>Rewrite</strong> - Polish and refine, fix pacing, improve clarity</li>
                </ul>
                <p className="mt-3">
                  Learn more in our <Link href="/help/writing" className="link link-primary">Writing guide</Link>.
                </p>
              </>
            }
          />

          <FAQItem
            question="What is character/location/prop consistency?"
            answer={
              <>
                <p className="mb-3">
                  <strong>UNIQUE FEATURES</strong> - The only platform that maintains consistency across your entire production:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Character Consistency</strong> - Same character, same voice, same outfit across every scene. One headshot → unlimited scenes.</li>
                  <li><strong>Location Consistency</strong> - Same location, multiple angles. Background consistency across shots. Upload once, use everywhere.</li>
                  <li><strong>Prop Consistency</strong> - Same prop, multiple angles. Consistent appearance across scenes. Digital asset library.</li>
                </ul>
                <p className="mt-3">
                  This solves the biggest problem in AI video production - maintaining consistency across multiple shots.
                </p>
              </>
            }
          />

          <FAQItem
            question="Can I export to different formats?"
            answer={
              <>
                <p className="mb-3">Yes! Export in multiple formats for any platform:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong>16:9</strong> - YouTube, web, traditional media</li>
                  <li><strong>9:16</strong> - TikTok, Reels, Stories</li>
                  <li><strong>1:1</strong> - Instagram Feed, Twitter</li>
                  <li><strong>4:3</strong> - Classic/Nostalgia aesthetic</li>
                  <li><strong>21:9</strong> - Cinema widescreen (Premium)</li>
                </ul>
                <p className="mt-3">
                  You can also use bundles to save credits: <strong>Social Bundle</strong> (16:9 + 9:16 + 1:1) saves 20%.
                </p>
              </>
            }
          />

          <FAQItem
            question="Do I need a credit card to start?"
            answer={
              <>
                <p>
                  <strong>No credit card required!</strong> You get 50 credits free when you sign up, plus 10 credits per month. 
                  This is enough to create your first few videos and explore the platform.
                </p>
                <p className="mt-3">
                  You only need to add a payment method when you want to purchase additional credits for more video generation.
                </p>
              </>
            }
          />

          <FAQItem
            question="How do I get more help?"
            answer={
              <>
                <p className="mb-3">We're here to help! You can:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Browse our help guides: <Link href="/help/writing" className="link link-primary">Writing</Link>,{' '}
                      <Link href="/help/production" className="link link-primary">Production</Link>,{' '}
                      <Link href="/help/editing" className="link link-primary">Editing</Link></li>
                  <li>Email us at <a href="mailto:support@wryda.ai" className="link link-primary">support@wryda.ai</a></li>
                  <li>Check the dashboard for in-app tips and guides</li>
                </ul>
              </>
            }
          />
        </div>

        {/* Navigation */}
        <div className="flex gap-4 justify-between mt-12">
          <Link href="/help/editing" className="btn btn-ghost">← Editing</Link>
          <Link href="/help" className="btn btn-primary">Back to Help Center</Link>
        </div>
      </main>
    </>
  );
}

function FAQItem({ question, answer }) {
  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h3 className="card-title text-xl mb-3">{question}</h3>
        <div className="text-sm opacity-90">
          {answer}
        </div>
      </div>
    </div>
  );
}

