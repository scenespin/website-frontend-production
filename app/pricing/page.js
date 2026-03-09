import Link from "next/link";
import Image from "next/image";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";
import logo from "@/app/icon.png";

export const metadata = getSEOTags({
  title: `Pricing - Everything Free, Pay for Credits | ${config.appName}`,
  description: "All features unlocked. Only pay for AI generation. Monthly plans available with included credits. 50 free credits to start.",
  canonicalUrlRelative: "/pricing",
});

export default function PricingPage() {
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
              <Link href="/examples" className="text-sm text-gray-300 hover:text-white transition-colors">
                Examples
              </Link>
              <Link href="/compare" className="text-sm text-gray-300 hover:text-white transition-colors">
                Compare
              </Link>
              <Link href="/models" className="text-sm text-gray-300 hover:text-white transition-colors">
                Models
              </Link>
              <Link href="/pricing" className="text-sm text-white font-medium">
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

      <main className="bg-[#0A0A0A] text-white">
        {/* Hero */}
        <section className="py-20 bg-[#141414]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight mb-4 md:mb-6 px-4">
              Start Free. Upgrade for More Credits.
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-6 md:mb-8 px-4">
              All features are unlocked on every plan. Your only decision is how many credits you want each month.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors text-base md:text-lg min-h-[44px] w-full sm:w-auto"
              >
                Start Free
              </Link>
              <Link
                href="/examples"
                className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 bg-[#141414] border border-[#3F3F46] text-white font-semibold rounded-lg hover:bg-[#1F1F1F] transition-colors text-base md:text-lg min-h-[44px] w-full sm:w-auto"
              >
                View Examples
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3 max-w-4xl mx-auto px-4 text-left">
              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Step 1</p>
                <p className="text-sm text-gray-200 font-medium">Start Free and write</p>
                <p className="text-xs text-gray-400 mt-1">Use the screenplay editor and writing agents with no feature gates.</p>
              </div>
              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Step 2</p>
                <p className="text-sm text-gray-200 font-medium">Use credits when you generate</p>
                <p className="text-xs text-gray-400 mt-1">Credits apply only when you run AI generation workflows.</p>
              </div>
              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Step 3</p>
                <p className="text-sm text-gray-200 font-medium">Upgrade only for volume</p>
                <p className="text-xs text-gray-400 mt-1">Pick a monthly plan for lower per-credit cost as your usage grows.</p>
              </div>
            </div>
            <div className="mt-4 max-w-4xl mx-auto px-4">
              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-4 text-left">
                <p className="text-sm text-gray-300">
                  All plans include the <strong className="text-white">Wryda Provenance Ledger</strong>. Credits apply when you generate AI outputs, not for maintaining disclosure records.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Supports WGA and studio disclosure workflows; not a legal determination, legal advice, or certification of compliance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Subscriptions */}
        <section id="subscriptions" className="py-20 bg-[#141414]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-16 px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
                Monthly Subscriptions
              </h2>
              <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
                Best for consistent monthly usage. Get discounted credits and rollover up to 2x your monthly amount.
              </p>
              <p className="text-xs sm:text-sm text-gray-400 max-w-2xl mx-auto mt-2">
                Mental model: subscription = discounted monthly credits. Same features as free tier.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 px-4">
              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-bold mb-2">Pro</h3>
                <div className="text-3xl md:text-4xl font-extrabold mb-2">$20<span className="text-base md:text-lg text-gray-400">/month</span></div>
                <div className="bg-[#DC143C]/10 p-3 rounded-lg mb-4">
                  <p className="text-sm font-semibold">3,000 credits/month</p>
                </div>
                <div className="mb-4 p-3 bg-[#141414] rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Volume Discount</p>
                  <p className="text-sm font-semibold text-white">3% off pay-as-you-go</p>
                  <p className="text-xs text-gray-500 mt-1">$0.00967 per credit (vs $0.01)</p>
                </div>
                <ul className="space-y-2 text-sm text-gray-300 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Everything in Free</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Credits roll over up to 6,000 (2x monthly)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>All features unlocked</span>
                  </li>
                </ul>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/sign-up?plan=pro"
                    className="block w-full text-center px-6 py-3 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors min-h-[44px] flex items-center justify-center"
                  >
                    Start Pro
                  </Link>
                  <Link
                    href="/pricing/pro"
                    className="block w-full text-center px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Learn more →
                  </Link>
                </div>
              </div>

              <div className="bg-[#0A0A0A] border-2 border-[#DC143C] rounded-lg p-6 md:p-8 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="px-3 py-1 bg-[#DC143C] text-white text-xs font-semibold rounded">MOST POPULAR</span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-2">Ultra</h3>
                <div className="text-3xl md:text-4xl font-extrabold mb-2">$60<span className="text-base md:text-lg text-gray-400">/month</span></div>
                <div className="bg-[#DC143C]/10 p-3 rounded-lg mb-4">
                  <p className="text-sm font-semibold">12,000 credits/month</p>
                </div>
                <div className="mb-4 p-3 bg-[#141414] rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Volume Discount</p>
                  <p className="text-sm font-semibold text-white">15% off pay-as-you-go</p>
                  <p className="text-xs text-gray-500 mt-1">$0.00825 per credit (vs $0.01)</p>
                </div>
                <ul className="space-y-2 text-sm text-gray-300 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Everything in Free</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Credits roll over up to 24,000 (2x monthly)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>All features unlocked</span>
                  </li>
                </ul>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/sign-up?plan=ultra"
                    className="block w-full text-center px-6 py-3 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors min-h-[44px] flex items-center justify-center"
                  >
                    Start Ultra
                  </Link>
                  <Link
                    href="/pricing/ultra"
                    className="block w-full text-center px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Learn more →
                  </Link>
                </div>
              </div>

              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-bold mb-2">Studio</h3>
                <div className="text-3xl md:text-4xl font-extrabold mb-2">$200<span className="text-base md:text-lg text-gray-400">/month</span></div>
                <div className="bg-[#DC143C]/10 p-3 rounded-lg mb-4">
                  <p className="text-sm font-semibold">50,000 credits/month</p>
                </div>
                <div className="mb-4 p-3 bg-[#141414] rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">Volume Discount</p>
                  <p className="text-sm font-semibold text-white">17% off pay-as-you-go</p>
                  <p className="text-xs text-gray-500 mt-1">$0.00798 per credit (vs $0.01)</p>
                </div>
                <ul className="space-y-2 text-sm text-gray-300 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Everything in Free</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Credits roll over up to 100,000 (2x monthly)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>All features unlocked</span>
                  </li>
                </ul>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/sign-up?plan=studio"
                    className="block w-full text-center px-6 py-3 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors min-h-[44px] flex items-center justify-center"
                  >
                    Start Studio
                  </Link>
                  <Link
                    href="/pricing/studio"
                    className="block w-full text-center px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Learn more →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Credit Costs Breakdown */}
        <section className="py-20 bg-[#141414]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 md:mb-16 px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
                How Credits Work
              </h2>
              <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
                You only spend credits when you generate AI outputs. Writing, editing, and project setup remain available across plans.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 px-4">
              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">🎬 Scene Generation</h3>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li>
                    <div className="font-semibold text-white mb-1">Scene Builder</div>
                    <div className="text-gray-400">Varies by complexity</div>
                    <div className="text-xs text-gray-500 mt-1">50-400+ credits (shots, characters, dialogue)</div>
                  </li>
                  <li>
                    <div className="font-semibold text-white mb-1">Video Generation</div>
                    <div className="text-gray-400">50-150 credits per 5-10s</div>
                    <div className="text-xs text-gray-500 mt-1">Resolution and options per model; credits shown before generation</div>
                  </li>
                  <li>
                    <div className="font-semibold text-white mb-1">Dialogue Scenes</div>
                    <div className="text-gray-400">~150-400 credits per scene</div>
                    <div className="text-xs text-gray-500 mt-1">Includes lip sync audio</div>
                  </li>
                </ul>
              </div>

              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">🖼️ Asset Generation</h3>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li>
                    <div className="font-semibold text-white mb-1">Character Angle Packages</div>
                    <div className="text-gray-400">60-200 credits</div>
                    <div className="text-xs text-gray-500 mt-1">3-10 angles per package</div>
                  </li>
                  <li>
                    <div className="font-semibold text-white mb-1">Location Background Packages</div>
                    <div className="text-gray-400">60-200 credits</div>
                    <div className="text-xs text-gray-500 mt-1">3-10 angles per package</div>
                  </li>
                  <li>
                    <div className="font-semibold text-white mb-1">Prop Angle Packages</div>
                    <div className="text-gray-400">60-200 credits</div>
                    <div className="text-xs text-gray-500 mt-1">3-10 angles per package</div>
                  </li>
                  <li>
                    <div className="font-semibold text-white mb-1">Single Images</div>
                    <div className="text-gray-400">15-50 credits</div>
                    <div className="text-xs text-gray-500 mt-1">Varies by model</div>
                  </li>
                </ul>
              </div>

              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">✨ What's FREE</h3>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>GitHub revision system</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Upload character outfits & references</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Upload location shots & backgrounds</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Upload props (cars, objects, etc.)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Screenplay editor</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Cloud Storage (Drive/Dropbox)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">
              Start Creating Today
            </h2>
            <p className="text-base sm:text-lg text-gray-300 mb-6 md:mb-8 max-w-2xl mx-auto">
              Get 50 free credits to start. All features unlocked. No credit card required.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors text-base md:text-lg min-h-[44px] w-full sm:w-auto max-w-xs"
            >
              Start Free
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
