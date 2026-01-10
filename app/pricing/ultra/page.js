import Link from "next/link";
import Image from "next/image";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";
import logo from "@/app/icon.png";
import { Check, Zap, Video, Sparkles, Shield, ArrowRight, Users } from "lucide-react";

export const metadata = getSEOTags({
  title: `Ultra Plan - $99/month | 12,000 Credits | ${config.appName}`,
  description: "Ultra Plan: 12,000 monthly credits for production companies and agencies. All features unlocked. Credits roll over. Cancel anytime. Perfect for studios, agencies, and high-volume creators.",
  canonicalUrlRelative: "/pricing/ultra",
});

export default function UltraPricingPage() {
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
              <Link href="/pricing" className="text-sm text-gray-300 hover:text-white transition-colors">
                All Plans
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
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-[#141414] to-[#0A0A0A]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#DC143C]/10 border border-[#DC143C]/30 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-[#DC143C]" />
              <span className="text-sm font-semibold text-[#DC143C]">ULTRA PLAN • MOST POPULAR</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4 md:mb-6">
              Scale Your Production
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Enterprise-grade tools for teams and agencies. 12,000 monthly credits for unlimited creative power.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/sign-up?plan=ultra"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors text-lg min-h-[56px]"
              >
                Get Ultra Plan
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-6 py-4 bg-[#141414] border border-[#3F3F46] text-white font-semibold rounded-lg hover:bg-[#1F1F1F] transition-colors min-h-[56px]"
              >
                Compare All Plans
              </Link>
            </div>
          </div>
        </section>

        {/* Pricing Card */}
        <section className="py-12 bg-[#141414]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[#0A0A0A] border-2 border-[#DC143C] rounded-2xl p-8 md:p-12 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="px-4 py-2 bg-[#DC143C] text-white text-sm font-semibold rounded-full">MOST POPULAR</span>
              </div>
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-2">Ultra Plan</h2>
                <div className="text-5xl md:text-6xl font-extrabold text-[#DC143C] mb-2">
                  $99<span className="text-2xl text-gray-400">/month</span>
                </div>
                <div className="bg-[#DC143C]/10 p-4 rounded-lg mb-6 inline-block">
                  <p className="text-lg font-semibold">12,000 credits/month</p>
                  <p className="text-sm text-gray-400 mt-1">Credits roll over up to 24,000</p>
                </div>
                <div className="bg-[#141414] p-4 rounded-lg mb-6 inline-block">
                  <p className="text-xs text-gray-400 mb-1">Volume Discount</p>
                  <p className="text-base font-semibold text-white">15% off pay-as-you-go</p>
                  <p className="text-xs text-gray-500 mt-1">$0.00825 per credit (vs $0.01)</p>
                </div>
                <Link
                  href="/sign-up?plan=ultra"
                  className="block w-full max-w-md mx-auto px-8 py-4 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors text-lg min-h-[56px] flex items-center justify-center gap-2"
                >
                  Start Ultra Plan
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <p className="text-sm text-gray-400 mt-4">Cancel anytime • No contracts</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 md:py-20 bg-[#0A0A0A]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                All features unlocked. The only difference is credits per month.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#DC143C]/10 rounded-lg">
                    <Video className="w-6 h-6 text-[#DC143C]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">12,000 Monthly Credits</h3>
                    <p className="text-gray-300 text-sm">
                      Generate 480 Ray Flash videos or 160 Ray 2 premium videos every month. Credits roll over up to 24,000.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#DC143C]/10 rounded-lg">
                    <Sparkles className="w-6 h-6 text-[#DC143C]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">All Features Included</h3>
                    <p className="text-gray-300 text-sm">
                      Full screenplay editor, team collaboration, all quality tiers, aspect ratios, compositions, and transitions. Everything unlocked.
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#DC143C]/10 rounded-lg">
                    <Zap className="w-6 h-6 text-[#DC143C]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Best Volume Discount</h3>
                    <p className="text-gray-300 text-sm">
                      Save 15% compared to pay-as-you-go pricing. The best value for high-volume creators and teams.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Perfect For */}
        <section className="py-16 md:py-20 bg-[#141414]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Perfect For</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6">
                <div className="text-4xl mb-4">🎥</div>
                <h3 className="font-semibold text-lg mb-2">Production Companies</h3>
                <p className="text-gray-300 text-sm">12,000 credits perfect for high-volume video production needs</p>
              </div>
              <div className="text-center p-6">
                <div className="text-4xl mb-4">🏢</div>
                <h3 className="font-semibold text-lg mb-2">Agencies</h3>
                <p className="text-gray-300 text-sm">Best value for agencies managing multiple client projects monthly</p>
              </div>
              <div className="text-center p-6">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="font-semibold text-lg mb-2">High-Volume Creators</h3>
                <p className="text-gray-300 text-sm">15% volume discount makes this the sweet spot for heavy usage</p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Signals */}
        <section className="py-16 md:py-20 bg-[#0A0A0A]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[#141414] border border-[#3F3F46] rounded-lg p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <Check className="w-8 h-8 text-[#DC143C] mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Cancel Anytime</h3>
                  <p className="text-sm text-gray-400">No contracts, no commitments</p>
                </div>
                <div>
                  <Shield className="w-8 h-8 text-[#DC143C] mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Secure Payment</h3>
                  <p className="text-sm text-gray-400">Powered by Stripe</p>
                </div>
                <div>
                  <Zap className="w-8 h-8 text-[#DC143C] mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Instant Access</h3>
                  <p className="text-sm text-gray-400">Start creating immediately</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-[#DC143C]/10 to-transparent">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Scale Your Production?</h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Join production companies and agencies using Ultra Plan to power their creative workflows.
            </p>
            <Link
              href="/sign-up?plan=ultra"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#DC143C] text-white font-semibold rounded-lg hover:bg-[#B01030] transition-colors text-lg min-h-[56px]"
            >
              Get Started with Ultra Plan
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
