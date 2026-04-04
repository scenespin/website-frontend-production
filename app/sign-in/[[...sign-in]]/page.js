'use client'

import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'
import config from '@/config'
import { useSearchParams } from 'next/navigation'

const AUTH_ROUTE_PATHS = new Set(['/sign-in', '/sign-up', '/signin', '/signup'])

function sanitizeAuthRedirectUrl(rawRedirectUrl, fallbackPath = '/dashboard') {
  if (!rawRedirectUrl) return fallbackPath

  try {
    const parsed = new URL(rawRedirectUrl, 'https://wryda.ai')
    const normalizedPath = (parsed.pathname || '/').toLowerCase()

    if (AUTH_ROUTE_PATHS.has(normalizedPath)) {
      return fallbackPath
    }

    // Prevent open redirects to other origins.
    if (/^https?:\/\//i.test(rawRedirectUrl) && parsed.origin !== 'https://wryda.ai') {
      return fallbackPath
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallbackPath
  }
}

export default function SignInPage() {
  const searchParams = useSearchParams()
  // Get redirect_url from query params
  const rawRedirectUrl = searchParams?.get('redirect_url') || searchParams?.get('redirectUrl')
  const redirectUrl = sanitizeAuthRedirectUrl(rawRedirectUrl)
  const isPartnerFlow = searchParams?.get('partner') === '1'
  const signUpLink = isPartnerFlow
    ? `/sign-up?partner=1&redirect_url=${encodeURIComponent(redirectUrl)}`
    : '/sign-up'
  
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="p-3 md:p-4 max-w-7xl mx-auto flex justify-between items-center border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl font-extrabold text-white">
            {config.appName}<span className="text-[#DC143C]">.ai</span>
          </span>
        </Link>
        <Link href={signUpLink} className="text-sm md:text-base text-gray-300 hover:text-white transition-colors min-h-[44px] px-3 md:px-4 flex items-center">
          Create an account
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-6 md:py-8 w-full min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-[#141414] border border-white/10 rounded-lg shadow-2xl p-4 sm:p-6 md:p-8 mx-auto">
            {isPartnerFlow && (
              <div className="mb-4 p-3 rounded-lg border border-[#00D9FF]/30 bg-[#0A0A0A]">
                <p className="text-sm text-[#B3B3B3]">
                  You&apos;re applying to the Wryda Partner Program. Sign in or create your account to continue.
                </p>
              </div>
            )}
            <SignIn 
              routing="path"
              path="/sign-in"
              signUpUrl={signUpLink}
              fallbackRedirectUrl={redirectUrl}
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
                  rootBox: "!w-full !mx-auto !flex !justify-center",
                  card: "!bg-transparent !shadow-none !w-full !mx-auto",
                  headerTitle: "!text-white !text-center",
                  headerSubtitle: "!text-gray-400 !text-center",
                  socialButtonsBlockButton: "!bg-[#0A0A0A] hover:!bg-[#1F1F1F] !text-white !border-2 !border-white/20 hover:!border-white/40 !transition-all !duration-200 !w-full !relative",
                  socialButtonsBlockButtonText: "!font-medium",
                  socialButtonsProviderIcon: "!mr-2",
                  alternativeMethodsBlockButton: "!relative",
                  formButtonPrimary: "!bg-[#DC143C] hover:!bg-[#B8112F] !text-white !font-medium !shadow-lg hover:!shadow-xl !transition-all !duration-200 !w-full",
                  footerActionLink: "!text-[#DC143C] hover:!text-[#B8112F] !font-medium",
                  formFieldLabel: "!text-white !font-medium !mb-2",
                  formFieldInput: "!bg-[#0A0A0A] !text-white !border-2 !border-white/20 focus:!border-[#DC143C] hover:!border-white/40 !transition-all !duration-200 !px-4 !py-2 !w-full",
                  formFieldInputShowPasswordButton: "!text-gray-400 hover:!text-white",
                  identityPreviewText: "!text-white",
                  identityPreviewEditButton: "!text-[#DC143C] hover:!text-[#B8112F]",
                  dividerLine: "!bg-white/20",
                  dividerText: "!text-gray-400",
                  footer: "hidden",
                  formFieldRow: "!w-full",
                  form: "!w-full",
                  badge: "!absolute !-top-2 !right-2 !text-xs !bg-[#0A0A0A] !text-white !px-2 !py-0.5 !rounded",
                },
              }}
            />
          </div>
          
          {/* Additional Trust Signal Below Form */}
          <div className="mt-4 w-full flex justify-center">
            <p className="text-xs text-gray-500 text-center">
              🔒 Your data is encrypted and secure
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

