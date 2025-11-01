import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";
import Pricing from "@/components/Pricing";

export const metadata = getSEOTags({
  title: `Marketing Team Video Production Tools | ${config.appName}`,
  description: "Create campaign videos 10x faster. A/B testing, multi-format delivery, team collaboration. $0/month vs $1,500+/month traditional marketing stack.",
  canonicalUrlRelative: "/marketing-teams",
  keywords: ["marketing video tools", "campaign video production", "marketing team collaboration", "A/B test videos", "multi-platform marketing"],
});

export default function MarketingTeamsPage() {
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
            <span>📊</span>
            <span>For Marketing Teams</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Campaign Videos at Speed.
            <br />
            <span className="text-[#DC143C]">Test Everything. Scale Fast.</span>
          </h1>

          <p className="text-xl md:text-2xl opacity-90 max-w-3xl">
            A/B test video concepts instantly. Multi-platform delivery. Team collaboration. Real-time iteration.
            <br />
            <strong>Complete marketing toolkit for $0/month</strong> vs $1,500+/month traditional stack.
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
            <div className="bg-base-200 p-4 rounded-lg">
              <div className="text-3xl font-bold text-[#DC143C]">10x</div>
              <div className="text-sm opacity-70">Faster Testing</div>
            </div>
            <div className="bg-base-200 p-4 rounded-lg">
              <div className="text-3xl font-bold text-[#DC143C]">5+</div>
              <div className="text-sm opacity-70">Platforms</div>
            </div>
            <div className="bg-base-200 p-4 rounded-lg">
              <div className="text-3xl font-bold text-[#DC143C]">∞</div>
              <div className="text-sm opacity-70">Variations</div>
            </div>
            <div className="bg-base-200 p-4 rounded-lg">
              <div className="text-3xl font-bold text-[#DC143C]">$0</div>
              <div className="text-sm opacity-70">Software/Mo</div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link className="btn btn-primary btn-lg" href="/sign-up">
              Start Free - 100 Credits →
            </Link>
            <Link className="btn btn-outline btn-lg" href="#roi">
              Calculate Marketing ROI
            </Link>
          </div>

          <p className="text-sm opacity-60">
            No credit card. Invite your team. Launch campaigns faster.
          </p>
        </section>

        {/* The Marketing Software Stack Problem */}
        <section className="bg-base-200 py-16">
          <div className="max-w-6xl mx-auto px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Stop Paying for Disconnected Tools
              </h2>
              <p className="text-lg opacity-80">
                Marketing teams waste thousands on software subscriptions
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Traditional Stack */}
              <div className="card bg-gradient-to-br from-error/10 to-error/5 border-2 border-error/30">
                <div className="card-body">
                  <div className="badge badge-error mb-2">Traditional Marketing Stack 😫</div>
                  <h3 className="card-title text-2xl mb-4">Monthly Subscriptions</h3>
                  
                  <ul className="space-y-3">
                    <li className="flex justify-between items-center">
                      <span>Adobe Creative Cloud (team)</span>
                      <span className="font-semibold text-error">$85/mo</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Canva Pro (team)</span>
                      <span className="font-semibold text-error">$30/mo</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Stock footage/images</span>
                      <span className="font-semibold text-error">$50/mo</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Video editing tools</span>
                      <span className="font-semibold text-error">$30/mo</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Collaboration tools</span>
                      <span className="font-semibold text-error">$25/mo</span>
                    </li>
                    <li className="border-t border-error/30 pt-3 flex justify-between items-center">
                      <span className="font-bold text-lg">Monthly Cost</span>
                      <span className="font-bold text-2xl text-error">$220/mo</span>
                    </li>
                    <li className="text-sm opacity-60">
                      = $2,640/year before creating anything
                    </li>
                  </ul>
                </div>
              </div>

              {/* Wryda Solution */}
              <div className="card bg-gradient-to-br from-success/10 to-primary/10 border-2 border-success">
                <div className="card-body">
                  <div className="badge badge-success mb-2">Wryda Marketing Platform ✨</div>
                  <h3 className="card-title text-2xl mb-4">Everything Included</h3>
                  
                  <ul className="space-y-3">
                    <li className="flex justify-between items-center">
                      <span className="font-semibold">✅ Video generation & editing</span>
                      <span className="font-bold text-success">FREE</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="font-semibold">✅ Team collaboration</span>
                      <span className="font-bold text-success">FREE</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="font-semibold">✅ Multi-platform export</span>
                      <span className="font-bold text-success">FREE</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="font-semibold">✅ A/B testing workflows</span>
                      <span className="font-bold text-success">FREE</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="font-semibold">✅ Cloud storage</span>
                      <span className="font-bold text-success">FREE</span>
                    </li>
                    <li className="border-t border-success/30 pt-3 flex justify-between items-center">
                      <span className="font-bold text-lg">Software Cost</span>
                      <span className="font-bold text-3xl text-success">$0/mo</span>
                    </li>
                    <li className="text-sm text-success font-semibold">
                      💰 Save $2,640/year per team!
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Marketing Use Cases */}
        <section className="py-16 px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built For Marketing Workflows
            </h2>
            <p className="text-lg opacity-80">
              Every campaign stage, from concept to conversion
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <UseCaseCard
              icon="🧪"
              title="A/B Testing"
              description="Generate 5 video variations in minutes. Test hooks, CTAs, visuals. Data-driven creative decisions."
              example="Test 5 different hooks → Find winner → Scale"
              credits="250-500"
            />
            <UseCaseCard
              icon="📱"
              title="Multi-Platform Campaigns"
              description="Create once → TikTok, Reels, YouTube, LinkedIn. Auto-optimized for each platform."
              example="1 video → 3 formats → 5 platforms"
              credits="50-150"
            />
            <UseCaseCard
              icon="🚀"
              title="Product Launches"
              description="Announce new products fast. Multiple angles. Feature highlights. Benefits showcase."
              example="Launch video + 10 feature videos"
              credits="500-800"
            />
            <UseCaseCard
              icon="📊"
              title="Social Proof"
              description="Turn customer testimonials into engaging videos. Build trust visually."
              example="10 testimonial videos from text"
              credits="300-600"
            />
            <UseCaseCard
              icon="🎯"
              title="Ad Creative"
              description="Generate ad variations rapidly. Test different audiences. Optimize spend."
              example="20 ad variations for Facebook/Google"
              credits="800-1200"
            />
            <UseCaseCard
              icon="📧"
              title="Email Campaigns"
              description="Add video to email. Increase click-through rates. Stand out in inbox."
              example="Weekly email video series"
              credits="200-400"
            />
          </div>
        </section>

        {/* The Speed Advantage */}
        <section className="bg-gradient-to-br from-primary/10 to-secondary/10 py-16">
          <div className="max-w-6xl mx-auto px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                10x Faster Than Traditional Video Production
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Traditional Timeline */}
              <div className="card bg-base-100">
                <div className="card-body">
                  <h3 className="card-title mb-4">Traditional Video Production</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="badge badge-neutral">Day 1-2</div>
                      <div>
                        <strong>Concept & Script</strong>
                        <p className="text-xs opacity-70">Brainstorm, write, revise</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="badge badge-neutral">Day 3-4</div>
                      <div>
                        <strong>Pre-Production</strong>
                        <p className="text-xs opacity-70">Location scouting, talent, equipment</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="badge badge-neutral">Day 5-6</div>
                      <div>
                        <strong>Filming</strong>
                        <p className="text-xs opacity-70">Setup, shoot, multiple takes</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="badge badge-neutral">Day 7-10</div>
                      <div>
                        <strong>Post-Production</strong>
                        <p className="text-xs opacity-70">Edit, color grade, effects, sound</p>
                      </div>
                    </div>
                    <div className="divider my-2"></div>
                    <div className="flex justify-between font-bold">
                      <span>Total Time</span>
                      <span className="text-error">10+ days</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Cost</span>
                      <span className="text-error">$2,000-$5,000</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Wryda Timeline */}
              <div className="card bg-gradient-to-br from-success/20 to-primary/20 border-2 border-success">
                <div className="card-body">
                  <h3 className="card-title mb-4">With Wryda</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="badge badge-success">5 min</div>
                      <div>
                        <strong>Write Prompt</strong>
                        <p className="text-xs opacity-70">Describe your vision</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="badge badge-success">90 sec</div>
                      <div>
                        <strong>Generate Video</strong>
                        <p className="text-xs opacity-70">AI creates professional video</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="badge badge-success">10 min</div>
                      <div>
                        <strong>Generate Variations</strong>
                        <p className="text-xs opacity-70">A/B test different versions</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="badge badge-success">5 min</div>
                      <div>
                        <strong>Export & Deploy</strong>
                        <p className="text-xs opacity-70">Multi-platform delivery</p>
                      </div>
                    </div>
                    <div className="divider my-2"></div>
                    <div className="flex justify-between font-bold">
                      <span>Total Time</span>
                      <span className="text-success">~20 minutes</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Cost</span>
                      <span className="text-success">50-150 credits (~$10-30)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <div className="alert alert-success max-w-2xl mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div>
                  <h4 className="font-bold">720x faster. 99% cheaper.</h4>
                  <p className="text-sm opacity-80">Launch campaigns in hours, not weeks</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Marketing Team Features */}
        <section className="py-16 px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything Marketing Teams Need
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon="👥"
              title="Team Collaboration"
              description="Real-time editing. Comment on videos. Share workspaces. Approval workflows."
            />
            <FeatureCard
              icon="📊"
              title="Campaign Organization"
              description="Organize by campaign, client, or platform. Tag and categorize. Find anything instantly."
            />
            <FeatureCard
              icon="🎯"
              title="Brand Consistency"
              description="Save brand assets. Reuse templates. Maintain visual identity across all campaigns."
            />
            <FeatureCard
              icon="📱"
              title="Multi-Platform Export"
              description="TikTok, Reels, YouTube, LinkedIn, Twitter. Auto-optimized formats for each platform."
            />
            <FeatureCard
              icon="⚡"
              title="Rapid Iteration"
              description="Generate variations in minutes. Test different hooks, CTAs, visuals. Find winners fast."
            />
            <FeatureCard
              icon="☁️"
              title="Cloud Storage"
              description="Export to Google Drive, Dropbox. Share with stakeholders. No storage limits."
            />
          </div>
        </section>

        {/* ROI Calculator */}
        <section id="roi" className="bg-base-200 py-16">
          <div className="max-w-6xl mx-auto px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Marketing Team ROI Calculator
              </h2>
              <p className="text-lg opacity-80">
                See your potential savings and productivity gains
              </p>
            </div>

            <div className="card bg-gradient-to-br from-primary/10 to-secondary/10">
              <div className="card-body">
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>Traditional</th>
                        <th className="text-success">With Wryda</th>
                        <th>Savings</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Monthly Software Cost</td>
                        <td className="text-error">$220</td>
                        <td className="text-success">$0</td>
                        <td className="font-bold">$220/mo</td>
                      </tr>
                      <tr>
                        <td>Video Production Time</td>
                        <td className="text-error">10 days</td>
                        <td className="text-success">20 minutes</td>
                        <td className="font-bold">720x faster</td>
                      </tr>
                      <tr>
                        <td>Cost Per Video</td>
                        <td className="text-error">$2,000-$5,000</td>
                        <td className="text-success">$10-$30</td>
                        <td className="font-bold">99% cheaper</td>
                      </tr>
                      <tr>
                        <td>Videos Per Month</td>
                        <td className="text-error">2-3</td>
                        <td className="text-success">50-100</td>
                        <td className="font-bold">30x more output</td>
                      </tr>
                      <tr className="font-bold">
                        <td>Annual Savings</td>
                        <td></td>
                        <td></td>
                        <td className="text-2xl text-success">$50,000+</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <Pricing />

        {/* Final CTA */}
        <section className="bg-gradient-to-r from-primary/20 to-secondary/20 py-16">
          <div className="max-w-4xl mx-auto px-8 text-center">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6">
              Launch Campaigns 720x Faster
            </h2>
            <p className="text-xl opacity-90 mb-8">
              A/B test everything. Multi-platform delivery. <strong>$0/month software.</strong>
            </p>
            <Link href="/sign-up" className="btn btn-primary btn-lg">
              Start Free - 100 Credits
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z" clipRule="evenodd" />
              </svg>
            </Link>
            <p className="text-sm opacity-60 mt-4">
              No credit card. Invite your marketing team. Launch faster.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}

function UseCaseCard({ icon, title, description, example, credits }) {
  return (
    <div className="card bg-base-200 hover:shadow-xl transition-shadow">
      <div className="card-body">
        <div className="text-3xl mb-2">{icon}</div>
        <h3 className="card-title text-lg">{title}</h3>
        <p className="text-sm opacity-80 mb-2">{description}</p>
        <div className="text-xs opacity-60 mb-2">Example: {example}</div>
        <div className="badge badge-primary">{credits} credits</div>
      </div>
    </div>
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

