import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'
import config from '@/config'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="p-3 md:p-4 max-w-7xl mx-auto flex justify-between items-center border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl font-extrabold text-white">
            {config.appName}<span className="text-[#DC143C]">.ai</span>
          </span>
        </Link>
        <Link href="/sign-up" className="text-sm md:text-base text-gray-300 hover:text-white transition-colors min-h-[44px] px-3 md:px-4 flex items-center">
          Create an account
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-6 md:py-8 w-full min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-md mx-auto">
          {/* ISE Badge */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#141414] border border-[#DC143C]/30 text-sm mb-4">
              <span className="font-semibold text-gray-300">✨ The First Integrated Screenwriting Environment</span>
            </div>
            <p className="text-sm text-gray-400">Write → Produce → Direct — All in one platform</p>
          </div>

          <div className="bg-[#141414] border border-white/10 rounded-lg shadow-2xl p-4 sm:p-6 md:p-8 mx-auto">
            <SignIn 
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

