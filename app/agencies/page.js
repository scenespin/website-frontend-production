import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";
import Pricing from "@/components/Pricing";

export const metadata = getSEOTags({
  title: `Agency Video Production Tools - Client Work at Scale | ${config.appName}`,
  description: "Create client videos 10x faster. Multi-brand management, team collaboration, white-label exports. $0/month vs $2,000+/month traditional stack.",
  canonicalUrlRelative: "/agencies",
  keywords: ["agency video production", "client video tools", "multi-brand video", "agency collaboration", "white-label video"],
});

export default function AgenciesPage() {
  return (
    <>
      {/* Header */}
      <header className="p-4 flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-extrabold">
            {config.appName}<span className="text-[#DC143C]">.ai</span>
          </span>
        </Link>
        <div className="flex gap-2">
          <Link href="/sign-in" className="btn btn-ghost">Login</Link>
          <Link href="/sign-up" className="btn btn-primary">Start Free</Link>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center text-center gap-8 px-8 py-16 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
            <span>🏢</span>
            <span>For Creative Agencies</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Client Work at Scale.
            <br />
            <span className="text-[#DC143C]">10x Faster. $0/Month.</span>
          </h1>

          <p className="text-xl md:text-2xl opacity-90 max-w-3xl">
            Create videos for multiple clients. Team collaboration. Brand consistency. White-label exports.
            <br />
            <strong>Complete agency toolkit for FREE</strong> vs $2,000+/month traditional stack.
          </p>

          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
            <div className="bg-base-200 p-4 rounded-lg">
              <div className="text-3xl font-bold text-[#DC143C]">10x</div>
              <div className="text-sm opacity-70">Faster Production</div>
            </div>
            <div className="bg-base-200 p-4 rounded-lg">
              <div className="text-3xl font-bold text-[#DC143C]">∞</div>
              <div className="text-sm opacity-70">Client Projects</div>
            </div>
            <div className="bg-base-200 p-4 rounded-lg">
              <div className="text-3xl font-bold text-[#DC143C]">5+</div>
              <div className="text-sm opacity-70">Team Members</div>
            </div>
            <div className="bg-base-200 p-4 rounded-lg">
              <div className="text-3xl font-bold text-[#DC143C]">$0</div>
              <div className="text-sm opacity-70">Software/Month</div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link className="btn btn-primary btn-lg" href="/sign-up">
              Start Free Trial - 100 Credits →
            </Link>
            <Link className="btn btn-outline btn-lg" href="#roi">
              Calculate Your ROI
            </Link>
          </div>

          <p className="text-sm opacity-60">
            No credit card required. Invite your team. Unlimited client projects.
          </p>
        </section>

        {/* The Agency Problem */}
        <section className="bg-base-200 py-16">
          <div className="max-w-6xl mx-auto px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                The Agency Software Tax
              </h2>
              <p className="text-lg opacity-80">
                You&apos;re paying thousands per month just for software access
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Traditional Stack */}
              <div className="card bg-gradient-to-br from-error/10 to-error/5 border-2 border-error/30">
                <div className="card-body">
                  <div className="badge badge-error mb-2">Traditional Agency Stack 😫</div>
                  <h3 className="card-title text-2xl mb-4">What You&apos;re Paying</h3>
                  
                  <ul className="space-y-3">
                    <li className="flex justify-between items-center">
                      <span>Adobe Creative Cloud (5 seats)</span>
                      <span className="font-semibold text-error">$425/mo</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Stock footage subscription</span>
                      <span className="font-semibold text-error">$100/mo</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Project management tools</span>
                      <span className="font-semibold text-error">$50/mo</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Cloud storage (team)</span>
                      <span className="font-semibold text-error">$30/mo</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Collaboration tools</span>
                      <span className="font-semibold text-error">$40/mo</span>
                    </li>
                    <li className="border-t border-error/30 pt-3 flex justify-between items-center">
                      <span className="font-bold text-lg">Monthly Software Cost</span>
                      <span className="font-bold text-2xl text-error">$645/mo</span>
                    </li>
                    <li className="text-sm opacity-60">
                      = $7,740/year in software fees alone
                    </li>
                  </ul>
                </div>
              </div>

              {/* Wryda Solution */}
              <div className="card bg-gradient-to-br from-success/10 to-primary/10 border-2 border-success">
                <div className="card-body">
                  <div className="badge badge-success mb-2">Wryda Agency Solution ✨</div>
                  <h3 className="card-title text-2xl mb-4">Everything Included</h3>
                  
                  <ul className="space-y-3">
                    <li className="flex justify-between items-center">
                      <span className="font-semibold">✅ Unlimited team members</span>
                      <span className="font-bold text-success">FREE</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="font-semibold">✅ Unlimited client projects</span>
                      <span className="font-bold text-success">FREE</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="font-semibold">✅ Real-time collaboration</span>
                      <span className="font-bold text-success">FREE</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="font-semibold">✅ Cloud storage & export</span>
                      <span className="font-bold text-success">FREE</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="font-semibold">✅ All production tools</span>
                      <span className="font-bold text-success">FREE</span>
                    </li>
                    <li className="border-t border-success/30 pt-3 flex justify-between items-center">
                      <span className="font-bold text-lg">Monthly Software Cost</span>
                      <span className="font-bold text-3xl text-success">$0/mo</span>
                    </li>
                    <li className="text-sm text-success font-semibold">
                      💰 Save $7,740/year per agency!
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ROI Calculator */}
        <section id="roi" className="py-16 px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4">
              The Agency ROI Calculator
            </h2>
            <p className="text-xl opacity-80">
              See how much you&apos;ll save switching to {config.appName}
            </p>
          </div>

          <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 max-w-4xl mx-auto">
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Traditional Agency */}
                <div>
                  <h3 className="text-xl font-bold mb-4 text-error">Traditional Agency Costs</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Adobe Creative Cloud (5 seats)</span>
                      <span className="font-semibold">$5,100/yr</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stock footage subscriptions</span>
                      <span className="font-semibold">$1,200/yr</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Project management tools</span>
                      <span className="font-semibold">$600/yr</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cloud storage (team)</span>
                      <span className="font-semibold">$360/yr</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Collaboration tools</span>
                      <span className="font-semibold">$480/yr</span>
                    </div>
                    <div className="divider my-2"></div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Annual Software Cost</span>
                      <span className="text-error text-2xl">$7,740</span>
                    </div>
                  </div>
                </div>

                {/* Wryda Agency */}
                <div>
                  <h3 className="text-xl font-bold mb-4 text-success">With Wryda</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>All software & tools</span>
                      <span className="font-semibold text-success">$0/yr</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unlimited team members</span>
                      <span className="font-semibold text-success">$0/yr</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unlimited projects</span>
                      <span className="font-semibold text-success">$0/yr</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cloud storage & collaboration</span>
                      <span className="font-semibold text-success">$0/yr</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AI video generation credits</span>
                      <span className="font-semibold">~$1,800/yr</span>
                    </div>
                    <div className="divider my-2"></div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Annual Cost</span>
                      <span className="text-primary text-2xl">~$1,800</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="alert alert-success mt-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div>
                  <h4 className="font-bold text-lg">Annual Savings: $5,940</h4>
                  <p className="text-sm opacity-80">That&apos;s a 77% reduction in software costs while getting MORE features</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Agency Features */}
        <section className="bg-base-200 py-16">
          <div className="max-w-7xl mx-auto px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Built For Agency Workflows
              </h2>
              <p className="text-lg opacity-80">
                Everything you need to deliver client work at scale
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon="👥"
                title="Unlimited Team Collaboration"
                description="Invite your entire team. Real-time editing. Role-based permissions. Free for all members."
              />
              <FeatureCard
                icon="📁"
                title="Multi-Client Project Management"
                description="Organize by client. Separate workspaces. Brand-specific assets. No cross-contamination."
              />
              <FeatureCard
                icon="🎨"
                title="Brand Consistency Tools"
                description="Save client brand kits. Reusable character templates. Consistent visual style across campaigns."
              />
              <FeatureCard
                icon="⚡"
                title="10x Faster Production"
                description="Generate 5-second videos in 60-90 seconds. Iterate in real-time. Meet tight deadlines."
              />
              <FeatureCard
                icon="☁️"
                title="White-Label Exports"
                description="No {config.appName} branding. Export to client's Drive/Dropbox. Professional delivery."
              />
              <FeatureCard
                icon="📊"
                title="Usage Analytics"
                description="Track credit usage per client. Transparent billing. Pass costs through to clients."
              />
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Agency Use Cases
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card bg-base-200">
              <div className="card-body">
                <div className="text-3xl mb-2">📱</div>
                <h3 className="card-title">Social Media Management</h3>
                <p className="text-sm opacity-80 mb-4">
                  Create content for 10+ clients simultaneously. TikTok, Reels, YouTube. Multi-platform exports. Brand-consistent posting.
                </p>
                <div className="badge badge-primary">50-150 credits per video</div>
              </div>
            </div>

            <div className="card bg-base-200">
              <div className="card-body">
                <div className="text-3xl mb-2">🎬</div>
                <h3 className="card-title">Commercial Production</h3>
                <p className="text-sm opacity-80 mb-4">
                  Generate concept videos for pitches. Create B-roll for live action. VFX shots. Product showcases. Faster turnaround.
                </p>
                <div className="badge badge-primary">100-300 credits per video</div>
              </div>
            </div>

            <div className="card bg-base-200">
              <div className="card-body">
                <div className="text-3xl mb-2">📊</div>
                <h3 className="card-title">Marketing Campaigns</h3>
                <p className="text-sm opacity-80 mb-4">
                  A/B test video concepts rapidly. Generate variations. Multi-format delivery. Data-driven creative.
                </p>
                <div className="badge badge-primary">50-200 credits per variant</div>
              </div>
            </div>

            <div className="card bg-base-200">
              <div className="card-body">
                <div className="text-3xl mb-2">🎓</div>
                <h3 className="card-title">Corporate Training Videos</h3>
                <p className="text-sm opacity-80 mb-4">
                  Create explainer videos. Onboarding content. Safety training. Consistent talking characters. Scalable production.
                </p>
                <div className="badge badge-primary">100-400 credits per video</div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing for Agencies */}
        <section className="bg-gradient-to-br from-primary/10 to-secondary/10 py-16">
          <div className="max-w-6xl mx-auto px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Pricing That Scales With Your Agency
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card bg-base-100">
                <div className="card-body">
                  <h3 className="card-title">Free</h3>
                  <div className="text-3xl font-bold text-[#DC143C] my-4">$0/mo</div>
                  <ul className="space-y-2 text-sm mb-6">
                    <li>✅ All tools & features</li>
                    <li>✅ Unlimited team members</li>
                    <li>✅ Unlimited projects</li>
                    <li>✅ 10 credits/month</li>
                  </ul>
                  <Link href="/sign-up" className="btn btn-outline">Start Free</Link>
                </div>
              </div>

              <div className="card bg-base-100 border-2 border-primary">
                <div className="badge badge-primary absolute right-4 top-4">Most Popular</div>
                <div className="card-body">
                  <h3 className="card-title">Studio</h3>
                  <div className="text-3xl font-bold text-[#DC143C] my-4">$399/mo</div>
                  <ul className="space-y-2 text-sm mb-6">
                    <li>✅ Everything in Free</li>
                    <li>✅ 75,000 credits/month</li>
                    <li>✅ ~1,000 videos/month</li>
                    <li>✅ Priority support</li>
                  </ul>
                  <Link href="/sign-up" className="btn btn-primary">Start Studio</Link>
                </div>
              </div>

              <div className="card bg-base-100">
                <div className="card-body">
                  <h3 className="card-title">Enterprise</h3>
                  <div className="text-3xl font-bold text-[#DC143C] my-4">Custom</div>
                  <ul className="space-y-2 text-sm mb-6">
                    <li>✅ Everything in Studio</li>
                    <li>✅ Custom credit packages</li>
                    <li>✅ Dedicated support</li>
                    <li>✅ SLA guarantees</li>
                  </ul>
                  <Link href="/team" className="btn btn-outline">Contact Sales</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 px-8 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6">
            Save $7,740/Year in Software Costs
          </h2>
          <p className="text-xl opacity-90 mb-8">
            Start with 100 free credits. No credit card required. Invite your team today.
          </p>
          <Link href="/sign-up" className="btn btn-primary btn-lg">
            Start Free Trial
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z" clipRule="evenodd" />
            </svg>
          </Link>
        </section>
      </main>
    </>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="card bg-base-100 hover:shadow-xl transition-shadow">
      <div className="card-body">
        <div className="text-3xl mb-2">{icon}</div>
        <h3 className="card-title text-lg">{title}</h3>
        <p className="text-sm opacity-80">{description}</p>
      </div>
    </div>
  );
}

