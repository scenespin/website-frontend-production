'use client'

import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import config from '@/config'
import { CheckCircle, Shield, Zap, Sparkles, Video } from 'lucide-react'

export default function SignUpPage() {
  const searchParams = useSearchParams()
  const planParam = searchParams?.get('plan') || 'free'
  
  // Find matching plan (case-insensitive)
  const selectedPlan = config.stripe.plans.find(
    p => p.name.toLowerCase() === planParam.toLowerCase()
  ) || config.stripe.plans[0] // Default to Free
  
  // Determine if it's a paid plan
  const isPaidPlan = selectedPlan.price > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-300 via-base-200 to-base-100">
      {/* Header */}
      <header className="p-4 max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-extrabold">
            {config.appName}<span className="text-[#DC143C]">.ai</span>
          </span>
        </Link>
        <Link href="/sign-in" className="btn btn-ghost">
          Already have an account?
        </Link>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-16">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
          
          {/* LEFT: Value Proposition - DYNAMIC BASED ON PLAN */}
          <div className="space-y-6 order-2 md:order-1">
            {/* Main Headline - Dynamic */}
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
                {selectedPlan.signupHeadline || "Start Creating Professional Videos"}
              </h1>
              <p className="text-lg opacity-80">
                {selectedPlan.signupSubheadline || "Join the future of AI-powered video production. Everything unlocked from day one."}
              </p>
            </div>

            {/* Trust Signals - Always show */}
            <div className="flex flex-wrap gap-4 items-center text-sm">
              <div className="flex items-center gap-2 opacity-80">
                <Shield className="w-4 h-4 text-[#DC143C]" />
                <span>Secure signup</span>
              </div>
              <div className="flex items-center gap-2 opacity-80">
                <Zap className="w-4 h-4 text-[#DC143C]" />
                <span>Instant access</span>
              </div>
              {!isPaidPlan && (
                <div className="flex items-center gap-2 opacity-80">
                  <span className="text-xl">💳</span>
                  <span>No card required</span>
                </div>
              )}
            </div>

            {/* Value Proposition Banner - Only for paid plans */}
            {isPaidPlan && selectedPlan.signupValueProp && (
              <div className="bg-gradient-to-r from-success/20 to-transparent rounded-box p-4 border-l-4 border-success">
                <div className="flex items-start gap-3">
                  <Video className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1">
                      {selectedPlan.signupValueProp}
                    </p>
                    <p className="text-sm opacity-70">
                      Perfect for: {selectedPlan.targetAudience}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* What You Get */}
            <div className="bg-base-200 rounded-box p-6 space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#DC143C]" />
                {isPaidPlan ? `What's included in ${selectedPlan.name}:` : "What you get instantly:"}
              </h3>
              
              {/* Free Plan Benefits */}
              {!isPaidPlan && (
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    <div>
                      <strong>50 signup credits</strong>
                      <p className="text-sm opacity-70">Worth $0.50 - create ~2 professional videos</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    <div>
                      <strong>10 credits every month forever</strong>
                      <p className="text-sm opacity-70">On the Free plan, no strings attached</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    <div>
                      <strong>All features unlocked</strong>
                      <p className="text-sm opacity-70">58 AI workflows, timeline editor, screenplay tools, Hollywood transitions & compositions</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    <div>
                      <strong>Upload your own footage</strong>
                      <p className="text-sm opacity-70">Combine your camera footage with AI-generated shots - completely free</p>
                    </div>
                  </li>
                </ul>
              )}

              {/* Paid Plan Benefits */}
              {isPaidPlan && (
                <ul className="space-y-3">
                  {selectedPlan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                      <div>
                        <strong>{feature.name}</strong>
                      </div>
                    </li>
                  ))}
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    <div>
                      <strong>All features unlocked</strong>
                      <p className="text-sm opacity-70">58 AI workflows, timeline editor, screenplay tools, Hollywood transitions</p>
                    </div>
                  </li>
                </ul>
              )}
            </div>

            {/* Cost Comparison Highlight */}
            <div className="bg-gradient-to-r from-[#DC143C]/10 to-transparent rounded-box p-4 border-l-4 border-[#DC143C]">
              <p className="text-sm font-semibold mb-1">
                💰 Save $1,223+/year vs traditional tools
              </p>
              <p className="text-xs opacity-70">
                Compare: Final Draft ($149) + Premiere Pro ($263) + After Effects ($263) + Stock Footage ($500) + more
              </p>
            </div>

            {/* Footer Note */}
            <p className="text-xs opacity-60">
              By signing up, you agree to our <Link href="/tos" className="link">Terms of Service</Link> and <Link href="/privacy-policy" className="link">Privacy Policy</Link>.
            </p>

            {/* Social Proof Placeholder - Ready for when you have testimonials */}
            {/* Uncomment when you have real testimonials:
            <div className="bg-base-200 rounded-box p-4">
              <div className="flex items-start gap-3">
                <div className="avatar placeholder">
                  <div className="bg-gradient-to-br from-[#DC143C] to-purple-600 text-white rounded-full w-10">
                    <span className="text-sm">J</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm italic opacity-80">
                    "Created my first professional video in 5 minutes. This is incredible."
                  </p>
                  <p className="text-xs opacity-60 mt-2">
                    — Jane D., Content Creator
                  </p>
                </div>
              </div>
            </div>
            */}
          </div>

          {/* RIGHT: Clerk Signup */}
          <div className="order-1 md:order-2 flex flex-col items-center md:items-start">
            <div className="w-full max-w-md bg-base-100 rounded-box shadow-2xl p-6 md:p-8">
              <SignUp 
                appearance={{
                  baseTheme: undefined,
                  variables: {
                    colorPrimary: '#DC143C',
                    colorBackground: 'hsl(var(--b1))',
                    colorInputBackground: 'hsl(var(--b2))',
                    colorInputText: 'hsl(var(--bc))',
                    colorText: 'hsl(var(--bc))',
                    colorTextSecondary: 'hsl(var(--bc) / 0.7)',
                    colorNeutral: 'hsl(var(--b3))',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: {
                      normal: 400,
                      medium: 500,
                      semibold: 600,
                      bold: 700,
                    },
                  },
                  elements: {
                    rootBox: "w-full mx-auto",
                    card: "bg-transparent shadow-none w-full",
                    headerTitle: "text-base-content text-center",
                    headerSubtitle: "text-base-content/70 text-center",
                    socialButtonsBlockButton: "!bg-base-200 hover:!bg-base-300 !text-base-content !border-2 !border-base-content/30 hover:!border-base-content/50 transition-all duration-200",
                    socialButtonsBlockButtonText: "font-medium",
                    socialButtonsProviderIcon__google: "!mr-2",
                    formButtonPrimary: "!bg-[#DC143C] hover:!bg-[#B8112F] !text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200",
                    footerActionLink: "!text-[#DC143C] hover:!text-[#B8112F] font-medium",
                    formFieldLabel: "!text-base-content font-medium mb-2",
                    formFieldInput: "!bg-base-200 !text-base-content !border-2 !border-base-content/30 focus:!border-[#DC143C] hover:!border-base-content/50 transition-all duration-200 !px-4 !py-2",
                    formFieldInputShowPasswordButton: "!text-base-content/70 hover:!text-base-content",
                    identityPreviewText: "!text-base-content",
                    identityPreviewEditButton: "!text-[#DC143C] hover:!text-[#B8112F]",
                    otpCodeFieldInput: "!border-2 !border-base-content/30 focus:!border-[#DC143C]",
                    dividerLine: "!bg-base-content/20",
                    dividerText: "!text-base-content/60",
                    footer: "hidden",
                  },
                }}
              />
              
              {/* Additional Trust Signal Below Form - Inside Container */}
              <div className="mt-4 w-full text-center">
                <p className="text-xs opacity-60">
                  🔒 Your data is encrypted and secure
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
