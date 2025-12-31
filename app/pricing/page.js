import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";

export const metadata = getSEOTags({
  title: `Pricing - Everything Free, Pay for Credits | ${config.appName}`,
  description: "All features unlocked. Only pay for AI generation. Credit packages and subscriptions available. 50 free credits to start.",
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
              <span className="text-2xl font-extrabold text-white">
                {config.appName}<span className="text-[#DC143C]">.ai</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/features" className="text-sm text-gray-300 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="/pricing" className="text-sm text-gray-300 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/help" className="text-sm text-gray-300 hover:text-white transition-colors">
                Help
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
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              Everything is Free. You Only Pay for Credits.
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              All features unlocked. The only difference is credits per month. No paywalls. No feature tiers. No watermarks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors text-lg"
              >
                Start Free - 50 Credits
              </Link>
              <Link
                href="/buy-credits"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#141414] border border-[#3F3F46] text-white font-semibold rounded-lg hover:bg-[#1F1F1F] transition-colors text-lg"
              >
                Buy Credits
              </Link>
            </div>
          </div>
        </section>

        {/* Free Tier */}
        <section className="py-20 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[#141414] border-2 border-[#DC143C] rounded-lg p-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Free Tier</h2>
              <p className="text-2xl text-[#DC143C] font-bold mb-2">50 credits to start + 10 credits/month</p>
              <p className="text-gray-300 mb-6">Everything unlocked. No credit card required.</p>
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center px-6 py-3 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </section>

        {/* Subscriptions */}
        <section className="py-20 bg-[#141414]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Monthly Subscriptions
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Better credit value. Credits roll over (up to plan limit). Cancel anytime.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-8">
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <div className="text-4xl font-extrabold mb-2">$29<span className="text-lg text-gray-400">/month</span></div>
                <div className="bg-[#DC143C]/10 p-3 rounded-lg mb-4">
                  <p className="text-sm font-semibold">3,000 credits/month</p>
                </div>
                <ul className="space-y-2 text-sm text-gray-300 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Everything in Free</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>~60 Professional 1080p videos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>~40 Premium 4K videos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>~20 Ultra Native 4K videos</span>
                  </li>
                </ul>
                <Link
                  href="/sign-up?plan=pro"
                  className="block w-full text-center px-6 py-3 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors"
                >
                  Get Pro
                </Link>
              </div>

              <div className="bg-[#0A0A0A] border-2 border-[#DC143C] rounded-lg p-8 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="px-3 py-1 bg-[#DC143C] text-white text-xs font-semibold rounded">MOST POPULAR</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">Ultra</h3>
                <div className="text-4xl font-extrabold mb-2">$149<span className="text-lg text-gray-400">/month</span></div>
                <div className="bg-[#DC143C]/10 p-3 rounded-lg mb-4">
                  <p className="text-sm font-semibold">20,000 credits/month</p>
                </div>
                <ul className="space-y-2 text-sm text-gray-300 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Everything in Free</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>~400 Professional 1080p videos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>~266 Premium 4K videos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>~133 Ultra Native 4K videos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Perfect for studios & agencies</span>
                  </li>
                </ul>
                <Link
                  href="/sign-up?plan=ultra"
                  className="block w-full text-center px-6 py-3 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors"
                >
                  Get Ultra
                </Link>
              </div>

              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-8">
                <h3 className="text-2xl font-bold mb-2">Studio</h3>
                <div className="text-4xl font-extrabold mb-2">$399<span className="text-lg text-gray-400">/month</span></div>
                <div className="bg-[#DC143C]/10 p-3 rounded-lg mb-4">
                  <p className="text-sm font-semibold">75,000 credits/month</p>
                </div>
                <ul className="space-y-2 text-sm text-gray-300 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Everything in Free</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>~1,500 Professional 1080p videos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>~1,000 Premium 4K videos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>~500 Ultra Native 4K videos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Massive production capacity</span>
                  </li>
                </ul>
                <Link
                  href="/sign-up?plan=studio"
                  className="block w-full text-center px-6 py-3 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors"
                >
                  Get Studio
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Credit Packages */}
        <section className="py-20 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Credit Packages (One-Time Purchase)
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Pay-as-you-go. No monthly commitment. Credits never expire.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-8">
                <h3 className="text-2xl font-bold mb-2">Starter Pack</h3>
                <div className="text-4xl font-extrabold mb-2">$10</div>
                <div className="bg-[#DC143C]/10 p-3 rounded-lg mb-4">
                  <p className="text-sm font-semibold">500 credits</p>
                </div>
                <ul className="space-y-2 text-sm text-gray-300 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>5 professional quality videos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>25-50 AI images</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>All quality tiers</span>
                  </li>
                </ul>
                <Link
                  href="/buy-credits"
                  className="block w-full text-center px-6 py-3 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors"
                >
                  Buy Starter Pack
                </Link>
              </div>

              <div className="bg-[#141414] border-2 border-[#DC143C] rounded-lg p-8 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <span className="px-3 py-1 bg-[#DC143C] text-white text-xs font-semibold rounded">BEST VALUE</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">Booster Pack</h3>
                <div className="text-4xl font-extrabold mb-2">$25</div>
                <div className="bg-[#DC143C]/10 p-3 rounded-lg mb-4">
                  <p className="text-sm font-semibold">1,500 credits</p>
                  <p className="text-xs text-gray-400 mt-1">17% discount</p>
                </div>
                <ul className="space-y-2 text-sm text-gray-300 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>15 professional videos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>75-150 AI images</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Priority generation</span>
                  </li>
                </ul>
                <Link
                  href="/buy-credits"
                  className="block w-full text-center px-6 py-3 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors"
                >
                  Buy Booster Pack
                </Link>
              </div>

              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-8">
                <h3 className="text-2xl font-bold mb-2">Mega Pack</h3>
                <div className="text-4xl font-extrabold mb-2">$60</div>
                <div className="bg-[#DC143C]/10 p-3 rounded-lg mb-4">
                  <p className="text-sm font-semibold">4,000 credits</p>
                  <p className="text-xs text-gray-400 mt-1">25% discount</p>
                </div>
                <ul className="space-y-2 text-sm text-gray-300 mb-6">
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>40+ professional videos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>200-400 AI images</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Priority support</span>
                  </li>
                </ul>
                <Link
                  href="/buy-credits"
                  className="block w-full text-center px-6 py-3 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors"
                >
                  Buy Mega Pack
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Credit Costs Breakdown */}
        <section className="py-20 bg-[#141414]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                How Credits Work
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                1 credit = $0.01 USD. Pay only for AI generation. Everything else is free.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">🎬 Video Generation</h3>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li>
                    <div className="font-semibold text-white mb-1">Professional 1080p</div>
                    <div className="text-gray-400">50 credits per 5s • 100 credits per 10s</div>
                  </li>
                  <li>
                    <div className="font-semibold text-white mb-1">Premium 4K</div>
                    <div className="text-gray-400">75 credits per 5s • 150 credits per 10s</div>
                  </li>
                  <li>
                    <div className="font-semibold text-white mb-1">Ultra Native 4K</div>
                    <div className="text-gray-400">150 credits per 5s • 300 credits per 10s</div>
                  </li>
                  <li>
                    <div className="font-semibold text-white mb-1">21:9 Cinema</div>
                    <div className="text-gray-400">+15 credits per video</div>
                  </li>
                </ul>
              </div>

              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">🖼️ Image Generation</h3>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li>
                    <div className="font-semibold text-white mb-1">Fast Models</div>
                    <div className="text-gray-400">1-5 credits per image</div>
                  </li>
                  <li>
                    <div className="font-semibold text-white mb-1">Standard Models</div>
                    <div className="text-gray-400">5-15 credits per image</div>
                  </li>
                  <li>
                    <div className="font-semibold text-white mb-1">Premium Models</div>
                    <div className="text-gray-400">20-50 credits per image</div>
                  </li>
                  <li>
                    <div className="font-semibold text-white mb-1">Character/Location/Prop</div>
                    <div className="text-gray-400">Varies by model</div>
                  </li>
                </ul>
              </div>

              <div className="bg-[#0A0A0A] border border-[#3F3F46] rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">✨ What's FREE</h3>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Upload your own footage (unlimited)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>65 compositions, 30 transitions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Screenplay + Timeline editor</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>Cloud Storage (Drive/Dropbox)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>All AI writing agents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#DC143C]">✓</span>
                    <span>All quality tiers & aspect ratios</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-[#0A0A0A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start Creating Today
            </h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Get 50 free credits to start. All features unlocked. No credit card required.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors text-lg"
            >
              Start Free - 50 Credits
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
