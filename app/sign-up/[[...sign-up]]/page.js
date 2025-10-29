import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'
import config from '@/config'
import { CheckCircle, Shield, Zap, Sparkles } from 'lucide-react'

export default function SignUpPage() {
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
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          
          {/* LEFT: Value Proposition */}
          <div className="space-y-6 order-2 md:order-1">
            {/* Main Headline */}
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
                Start Creating Professional Videos
              </h1>
              <p className="text-lg opacity-80">
                Join the future of AI-powered video production. Everything unlocked from day one.
              </p>
            </div>

            {/* What You Get */}
            <div className="bg-base-200 rounded-box p-6 space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#DC143C]" />
                What you get instantly:
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <div>
                    <strong>100 signup credits</strong>
                    <p className="text-sm opacity-70">Worth $1.00 - create ~2 professional videos</p>
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
                    <p className="text-sm opacity-70">42 AI workflows, timeline editor, screenplay tools, Hollywood transitions & compositions</p>
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
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-4 items-center text-sm">
              <div className="flex items-center gap-2 opacity-80">
                <Shield className="w-4 h-4 text-[#DC143C]" />
                <span>Secure signup</span>
              </div>
              <div className="flex items-center gap-2 opacity-80">
                <span className="text-xl">💳</span>
                <span>No card required</span>
              </div>
              <div className="flex items-center gap-2 opacity-80">
                <Zap className="w-4 h-4 text-[#DC143C]" />
                <span>Instant access</span>
              </div>
            </div>

            {/* Cost Comparison Highlight */}
            <div className="bg-gradient-to-r from-[#DC143C]/10 to-transparent rounded-box p-4 border-l-4 border-[#DC143C]">
              <p className="text-sm font-semibold mb-1">
                💰 Save $1,583+/year vs traditional tools
              </p>
              <p className="text-xs opacity-70">
                Compare: Final Draft ($149) + Premiere Pro ($263) + After Effects ($263) + Stock Footage ($500) + more
              </p>
            </div>

            {/* Footer Note */}
            <p className="text-xs opacity-60">
              By signing up, you agree to our <Link href="/tos" className="link">Terms of Service</Link> and <Link href="/privacy-policy" className="link">Privacy Policy</Link>.
            </p>
          </div>

          {/* RIGHT: Clerk Signup */}
          <div className="order-1 md:order-2">
            <div className="bg-base-100 rounded-box shadow-2xl p-6 md:p-8">
              <SignUp 
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "bg-transparent shadow-none"
                  }
                }}
              />
            </div>
            
            {/* Additional Trust Signal Below Form */}
            <div className="mt-4 text-center">
              <p className="text-xs opacity-60">
                🔒 Your data is encrypted and secure
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

