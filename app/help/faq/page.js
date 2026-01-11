import Link from "next/link";
import Image from "next/image";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";
import logo from "@/app/icon.png";

export const metadata = getSEOTags({
  title: `FAQ | ${config.appName}`,
  description: "Frequently asked questions about Wryda.ai - Credits, pricing, features, and getting started.",
  canonicalUrlRelative: "/help/faq",
});

export default function FAQHelp() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <header className="p-4 flex justify-between items-center max-w-7xl mx-auto bg-[#0A0A0A] border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={logo}
            alt={`${config.appName} logo`}
            width={40}
            height={40}
            className="w-10 h-10"
            priority={true}
          />
          <span className="text-2xl font-extrabold text-[#FFFFFF]">
            {config.appName}<span className="text-[#DC143C]">.ai</span>
          </span>
        </Link>
        <Link href="/help" className="btn btn-ghost text-[#B3B3B3] hover:text-[#FFFFFF] border-white/10">← Back to Help</Link>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-16 bg-[#0A0A0A] text-[#FFFFFF]">
        <h1 className="text-4xl font-extrabold mb-4 text-[#FFFFFF]">❓ Frequently Asked Questions</h1>
        <p className="text-xl opacity-80 mb-12 text-[#B3B3B3]">
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
                  <li>GitHub revision system</li>
                  <li>Upload character outfits & references</li>
                  <li>Upload location shots & backgrounds</li>
                  <li>Upload props (cars, objects, etc.)</li>
                  <li>Professional screenplay editor (Fountain format)</li>
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
                  <li>Video generation - Built-in AI video generation</li>
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
                  <li><strong>Produce with Scene Builder</strong> - Go to Production and use Scene Builder to generate videos from your screenplay</li>
                  <li><strong>Direct your production</strong> - Review and control your generated videos</li>
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
            question="What is the workflow?"
            answer={
              <>
                <p className="mb-3">Wryda.ai follows a simple workflow:</p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li><strong>Write</strong> - Create your screenplay with our professional editor and 5 AI writing agents</li>
                  <li><strong>Produce</strong> - Use Scene Builder to generate videos from your screenplay, maintaining character/location/prop consistency</li>
                  <li><strong>Direct</strong> - Review and control your production</li>
                </ol>
                <p className="mt-3">
                  <strong>Write → Produce → Direct</strong> - Simple, powerful, and all in one platform.
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
                  This is enough to try the professional screenplay editor and explore the 5 AI writing agents.
                </p>
                <p className="mt-3">
                  You only need to add a payment method when you want to purchase additional credits for AI video generation or other premium features.
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
                  <li>Browse our help guides: <Link href="/help/writing" className="link link-primary">Writing</Link> and{' '}
                      <Link href="/help/production" className="link link-primary">Production</Link></li>
                  <li>Email us at <a href="mailto:support@wryda.ai" className="link link-primary">support@wryda.ai</a></li>
                  <li>Check the dashboard for in-app tips and guides</li>
                </ul>
              </>
            }
          />
        </div>

        {/* Navigation */}
        <div className="flex gap-4 justify-between mt-12">
          <Link href="/help/production" className="btn btn-ghost">← Production</Link>
          <Link href="/help" className="btn btn-primary">Back to Help Center</Link>
        </div>
      </main>
    </div>
  );
}

function FAQItem({ question, answer }) {
  return (
    <div className="card bg-[#141414] border border-white/10">
      <div className="card-body">
        <h3 className="card-title text-xl mb-3">{question}</h3>
        <div className="text-sm opacity-90">
          {answer}
        </div>
      </div>
    </div>
  );
}

