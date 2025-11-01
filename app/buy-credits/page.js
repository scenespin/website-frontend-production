'use client';

import Link from "next/link";
import config from "@/config";
import { Check, Zap, Sparkles, Star, Crown } from "lucide-react";

// Credit Packages - Pricing based on 1 credit = $0.01
const CREDIT_PACKAGES = [
  {
    id: "starter",
    name: "Starter Pack",
    credits: 500,
    price: 10,
    savings: 0,
    popular: false,
    color: "from-blue-500 to-cyan-500",
    icon: Zap,
    bestFor: "Testing & Learning",
    includes: [
      "5 professional quality videos (5-8 sec)",
      "25-50 AI images",
      "Character consistency features",
      "All quality tiers",
      "Commercial rights included"
    ]
  },
  {
    id: "creator",
    name: "Creator Pack",
    credits: 1500,
    price: 25,
    savings: 5,
    popular: true,
    color: "from-purple-500 to-pink-500",
    icon: Sparkles,
    bestFor: "Content Creators",
    includes: [
      "15 professional videos",
      "75-150 AI images",
      "Pose packages (2-3 characters)",
      "Priority generation",
      "Commercial rights + watermark removal"
    ]
  },
  {
    id: "pro",
    name: "Pro Pack",
    credits: 3500,
    price: 50,
    savings: 15,
    popular: false,
    color: "from-orange-500 to-red-500",
    icon: Star,
    bestFor: "Professional Projects",
    includes: [
      "35 professional videos",
      "175-350 AI images",
      "Pose packages (5-7 characters)",
      "Location bank full access",
      "Priority support"
    ]
  },
  {
    id: "studio",
    name: "Studio Pack",
    credits: 8000,
    price: 100,
    savings: 40,
    popular: false,
    color: "from-yellow-500 to-amber-500",
    icon: Crown,
    bestFor: "Production Studios",
    includes: [
      "80 professional videos",
      "400-800 AI images",
      "Pose packages (15+ characters)",
      "Complete scene generation",
      "White-glove support"
    ]
  },
  {
    id: "enterprise",
    name: "Enterprise Pack",
    credits: 20000,
    price: 250,
    savings: 125,
    popular: false,
    color: "from-slate-700 to-slate-900",
    icon: Crown,
    bestFor: "Agencies & Teams",
    includes: [
      "200+ professional videos",
      "1000+ AI images",
      "Unlimited pose packages",
      "Dedicated account manager",
      "Custom integrations available"
    ]
  }
];

export default function BuyCreditsPage() {
  return (
    <>
      <header className="p-4 flex justify-between items-center max-w-7xl mx-auto sticky top-0 bg-base-100/80 backdrop-blur-lg z-50 border-b border-base-300">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-extrabold">
            {config.appName}<span className="text-[#DC143C]">.ai</span>
          </span>
        </Link>
        <div className="flex gap-2">
          <Link href="/pricing" className="btn btn-ghost btn-sm">Plans</Link>
          <Link href="/dashboard" className="btn btn-ghost btn-sm">← Dashboard</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
            Power Your Creativity
          </h1>
          <p className="text-xl text-base-content/70 max-w-2xl mx-auto mb-6">
            Choose the perfect credit package for your production needs. Generate videos, images, and characters with AI.
          </p>
          
          {/* ROI Calculator */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-full border border-green-500/30">
            <Zap className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">1 credit = $0.01 USD</span>
            <span className="text-xs opacity-60">• No expiration • Rollover monthly</span>
          </div>
        </div>

        {/* Credit Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {CREDIT_PACKAGES.map((pkg) => {
            const Icon = pkg.icon;
            return (
              <div
                key={pkg.id}
                className={`card bg-base-200 shadow-xl hover:shadow-2xl transition-all duration-300 ${
                  pkg.popular ? 'ring-4 ring-purple-500 scale-105' : ''
                } relative overflow-hidden`}
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${pkg.color} opacity-5`}></div>
                
                {/* Popular Badge */}
                {pkg.popular && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="badge badge-primary badge-sm">
                      ⭐ MOST POPULAR
                    </div>
                  </div>
                )}

                <div className="card-body relative z-10">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${pkg.color} p-3 mb-4 flex items-center justify-center`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>

                  {/* Package Name */}
                  <h3 className="card-title text-2xl mb-2">{pkg.name}</h3>
                  
                  {/* Best For */}
                  <p className="text-sm text-base-content/60 mb-4">{pkg.bestFor}</p>

                  {/* Pricing */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-4xl font-black">${pkg.price}</span>
                      {pkg.savings > 0 && (
                        <span className="text-sm text-success font-semibold">
                          Save ${pkg.savings}
                        </span>
                      )}
                    </div>
                    <div className="text-base-content/70 font-bold text-lg">
                      {pkg.credits.toLocaleString()} Credits
                    </div>
                    {pkg.savings > 0 && (
                      <div className="text-xs text-success mt-1">
                        ${((pkg.price / pkg.credits) * 1000).toFixed(2)}/1000 credits
                      </div>
                    )}
                  </div>

                  {/* Includes */}
                  <div className="mb-6 space-y-2">
                    {pkg.includes.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button
                    className={`btn w-full ${
                      pkg.popular ? 'btn-primary' : 'btn-outline'
                    }`}
                    onClick={() => {
                      // TODO: Integrate with Stripe checkout
                      alert(`Purchase ${pkg.name} for $${pkg.price} - Stripe integration needed`);
                    }}
                  >
                    {pkg.popular ? '🚀 Get Started' : 'Buy Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* What You Can Create Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">What Can You Create?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card bg-base-200">
              <div className="card-body items-center text-center">
                <div className="text-4xl mb-4">🎬</div>
                <h3 className="card-title mb-2">Professional Videos</h3>
                <p className="text-sm text-base-content/70">
                  5-8 second videos: <strong>100 credits</strong><br/>
                  Character consistency, any aspect ratio, commercial rights
                </p>
              </div>
            </div>

            <div className="card bg-base-200">
              <div className="card-body items-center text-center">
                <div className="text-4xl mb-4">🎭</div>
                <h3 className="card-title mb-2">Character Poses</h3>
                <p className="text-sm text-base-content/70">
                  Standard package: <strong>120 credits</strong><br/>
                  6 poses, perfect consistency, all angles covered
                </p>
              </div>
            </div>

            <div className="card bg-base-200">
              <div className="card-body items-center text-center">
                <div className="text-4xl mb-4">🖼️</div>
                <h3 className="card-title mb-2">AI Images</h3>
                <p className="text-sm text-base-content/70">
                  High-quality image: <strong>10-20 credits</strong><br/>
                  Characters, locations, concept art, storyboards
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" />
              <div className="collapse-title font-semibold">
                Do credits expire?
              </div>
              <div className="collapse-content">
                <p className="text-sm">
                  No! Credits never expire and roll over every month. Buy once, use forever.
                </p>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" />
              <div className="collapse-title font-semibold">
                Can I use credits for commercial projects?
              </div>
              <div className="collapse-content">
                <p className="text-sm">
                  Yes! All content generated with credits includes full commercial rights. Use in client work, YouTube, social media, anywhere.
                </p>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" />
              <div className="collapse-title font-semibold">
                What if I run out of credits mid-project?
              </div>
              <div className="collapse-content">
                <p className="text-sm">
                  You can purchase more credits anytime! They're added to your balance instantly. No interruption to your workflow.
                </p>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" />
              <div className="collapse-title font-semibold">
                How do credits compare to subscriptions?
              </div>
              <div className="collapse-content">
                <p className="text-sm">
                  Credits are perfect for one-time purchases or topping up your subscription. Subscriptions include monthly credits automatically. Check our <Link href="/pricing" className="link link-primary">pricing page</Link> to compare.
                </p>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-200">
              <input type="checkbox" />
              <div className="collapse-title font-semibold">
                Can I get a refund?
              </div>
              <div className="collapse-content">
                <p className="text-sm">
                  We offer refunds within 7 days if you haven't used more than 10% of your purchased credits. Contact support for assistance.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-red-500/10 rounded-3xl p-12 border border-purple-500/20">
          <h2 className="text-3xl font-bold mb-4">Need Help Choosing?</h2>
          <p className="text-lg text-base-content/70 mb-6 max-w-2xl mx-auto">
            Start with the Creator Pack (most popular) or contact our team for custom enterprise solutions.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/contact" className="btn btn-outline">
              Contact Sales
            </Link>
            <Link href="/pricing" className="btn btn-ghost">
              View Subscriptions
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-base-300 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-base-content/60">
          <p>All prices in USD. Credits never expire. Commercial rights included.</p>
          <p className="mt-2">
            <Link href="/terms" className="link">Terms</Link>
            {" · "}
            <Link href="/privacy" className="link">Privacy</Link>
            {" · "}
            <Link href="/contact" className="link">Support</Link>
          </p>
        </div>
      </footer>
    </>
  );
}

