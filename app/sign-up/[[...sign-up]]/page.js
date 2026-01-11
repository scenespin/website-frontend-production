'use client'

import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import config from '@/config'
import { CheckCircle, Shield, Zap, Sparkles, Video, FileText, Image, Film } from 'lucide-react'

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
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="p-3 md:p-4 max-w-7xl mx-auto flex justify-between items-center border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl font-extrabold text-white">
            {config.appName}<span className="text-[#DC143C]">.ai</span>
          </span>
        </Link>
        <Link href="/sign-in" className="text-sm md:text-base text-gray-300 hover:text-white transition-colors min-h-[44px] px-3 md:px-4 flex items-center">
          Already have an account?
        </Link>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-start">
          
          {/* LEFT: Value Proposition - DYNAMIC BASED ON PLAN */}
          <div className="space-y-6 order-2 md:order-1">
            {/* ISE Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#141414] border border-[#DC143C]/30 text-sm">
              <span className="font-semibold text-gray-300">✨ The First Integrated Screenwriting Environment</span>
            </div>

            {/* Main Headline - Dynamic */}
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-3 text-white">
                {selectedPlan.signupHeadline || "Start Creating Professional Videos"}
              </h1>
              <p className="text-base sm:text-lg text-gray-300">
                {selectedPlan.signupSubheadline || "Join the future of AI-powered video production. Everything unlocked from day one."}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                The only Integrated Screenwriting Environment (ISE) that combines writing, production, and direction in one platform.
              </p>
            </div>

            {/* Trust Signals - Always show */}
            <div className="flex flex-wrap gap-4 items-center text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <Shield className="w-4 h-4 text-[#DC143C]" />
                <span>Secure signup</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Zap className="w-4 h-4 text-[#DC143C]" />
                <span>Instant access</span>
              </div>
              {!isPaidPlan && (
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-xl">💳</span>
                  <span>No card required</span>
                </div>
              )}
            </div>

            {/* Value Proposition Banner - Only for paid plans */}
            {isPaidPlan && selectedPlan.signupValueProp && (
              <div className="bg-gradient-to-r from-green-500/20 to-transparent rounded-lg p-4 border-l-4 border-green-500">
                <div className="flex items-start gap-3">
                  <Video className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-1 text-white">
                      {selectedPlan.signupValueProp}
                    </p>
                    <p className="text-sm text-gray-400">
                      Perfect for: {selectedPlan.targetAudience}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Your Complete Workflow */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-white">
                <Film className="w-5 h-5 text-[#DC143C]" />
                Your Complete Workflow
              </h3>
              
              {/* Step 1: CREATE */}
              <div className="bg-[#141414] border border-white/10 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    1
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-[#DC143C]" />
                      <h4 className="font-semibold text-white">CREATE</h4>
                    </div>
                    <ul className="text-sm text-gray-300 space-y-1 ml-6">
                      <li>• Write or import Fountain scripts</li>
                      <li>• AI agents help you write</li>
                      <li>• Auto-detect characters/locations</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Step 2: PRODUCE */}
              <div className="bg-[#141414] border border-white/10 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    2
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Image className="w-4 h-4 text-[#DC143C]" />
                      <h4 className="font-semibold text-white">PRODUCE</h4>
                    </div>
                    <ul className="text-sm text-gray-300 space-y-1 ml-6">
                      <li>• Generate AI characters/locations</li>
                      <li>• Create angle packages</li>
                      <li>• Match style from existing footage</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Step 3: DIRECT */}
              <div className="bg-[#141414] border border-white/10 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    3
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Video className="w-4 h-4 text-[#DC143C]" />
                      <h4 className="font-semibold text-white">DIRECT</h4>
                      <span className="text-xs font-semibold text-gray-400 bg-[#0A0A0A] px-2 py-0.5 rounded-full">
                        Beta
                      </span>
                    </div>
                    <ul className="text-sm text-gray-300 space-y-1 ml-6">
                      <li>• Scene Builder (Beta)</li>
                      <li>• Export 1080p & 4K videos</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* What You Get */}
            <div className="bg-[#141414] border border-white/10 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5 text-[#DC143C]" />
                {isPaidPlan ? `What's included in ${selectedPlan.name}:` : "What you get instantly:"}
              </h3>
              
              {/* Free Plan Benefits */}
              {!isPaidPlan && (
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">50 signup credits</strong>
                      <p className="text-sm text-gray-400">Try AI agents in the writing editor</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">10 credits every month forever</strong>
                      <p className="text-sm text-gray-400">On the Free plan, no strings attached</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">All features unlocked</strong>
                      <p className="text-sm text-gray-400">58 AI workflows, timeline editor, screenplay tools, Hollywood transitions & compositions</p>
                    </div>
                  </li>
                </ul>
              )}

              {/* Paid Plan Benefits */}
              {isPaidPlan && (
                <ul className="space-y-3">
                  {selectedPlan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">{feature.name}</strong>
                      </div>
                    </li>
                  ))}
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white">All features unlocked</strong>
                    </div>
                  </li>
                </ul>
              )}
            </div>

            {/* Cost Comparison Highlight */}
            <div className="bg-gradient-to-r from-[#DC143C]/10 to-transparent rounded-lg p-4 border-l-4 border-[#DC143C]">
              <p className="text-sm font-semibold mb-2 text-white">
                📊 vs Traditional Tools
              </p>
              <div className="space-y-2 text-xs text-gray-300 mb-3">
                <p className="font-medium text-white">Instead of paying separately for:</p>
                <ul className="space-y-1 ml-4">
                  <li>• Final Draft ($250) → <span className="text-green-400 font-semibold">✅ FREE Forever</span></li>
                  <li>• Manual asset organization → <span className="text-green-400 font-semibold">✅ Automated</span></li>
                  <li>• Maintaining character/location/prop consistency → <span className="text-green-400 font-semibold">✅ Built-in</span></li>
                </ul>
              </div>
              <p className="text-xs text-gray-300 mb-2">
                Create all your production assets with screenplay continuity. Download what you need, or use our Scene Builder.
              </p>
              <p className="text-sm font-semibold text-white">
                Save $250+/year + hours of manual work
              </p>
            </div>

            {/* Footer Note */}
            <p className="text-xs text-gray-500">
              By signing up, you agree to our <Link href="/tos" className="text-[#DC143C] hover:text-[#B8112F]">Terms of Service</Link> and <Link href="/privacy-policy" className="text-[#DC143C] hover:text-[#B8112F]">Privacy Policy</Link>.
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
            <div className="w-full max-w-md bg-[#141414] border border-white/10 rounded-lg shadow-2xl p-4 sm:p-6 md:p-8">
              <SignUp 
                fallbackRedirectUrl={isPaidPlan ? `/dashboard?plan=${planParam}` : '/dashboard'}
                forceRedirectUrl={isPaidPlan ? `/dashboard?plan=${planParam}` : undefined}
                appearance={{
                  baseTheme: undefined,
                variables: {
                  colorPrimary: '#DC143C',
                  colorBackground: '#141414',
                  colorInputBackground: '#0A0A0A',
                  colorInputText: '#FFFFFF',
                  colorText: '#FFFFFF',
                  colorTextSecondary: 'rgba(255, 255, 255, 0.7)',
                  colorNeutral: '#3F3F46',
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
                    headerTitle: "!text-white text-center",
                    headerSubtitle: "!text-gray-400 text-center",
                    socialButtonsBlockButton: "!bg-[#0A0A0A] hover:!bg-[#1F1F1F] !text-white !border-2 !border-white/20 hover:!border-white/40 transition-all duration-200",
                    socialButtonsBlockButtonText: "font-medium",
                    socialButtonsProviderIcon__google: "!mr-2",
                    formButtonPrimary: "!bg-[#DC143C] hover:!bg-[#B8112F] !text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200",
                    footerActionLink: "!text-[#DC143C] hover:!text-[#B8112F] font-medium",
                    formFieldLabel: "!text-white font-medium mb-2",
                    formFieldInput: "!bg-[#0A0A0A] !text-white !border-2 !border-white/20 focus:!border-[#DC143C] hover:!border-white/40 transition-all duration-200 !px-4 !py-2",
                    formFieldInputShowPasswordButton: "!text-gray-400 hover:!text-white",
                    identityPreviewText: "!text-white",
                    identityPreviewEditButton: "!text-[#DC143C] hover:!text-[#B8112F]",
                    otpCodeFieldInput: "!border-2 !border-white/20 focus:!border-[#DC143C]",
                    dividerLine: "!bg-white/20",
                    dividerText: "!text-gray-400",
                    footer: "hidden",
                  },
                }}
              />
              
              {/* Additional Trust Signal Below Form - Inside Container */}
              <div className="mt-4 w-full text-center">
                <p className="text-xs text-gray-500">
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
