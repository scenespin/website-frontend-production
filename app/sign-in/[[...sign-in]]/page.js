import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'
import config from '@/config'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-base-300 via-base-200 to-base-100">
      {/* Header */}
      <header className="p-4 max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-extrabold">
            {config.appName}<span className="text-[#DC143C]">.ai</span>
          </span>
        </Link>
        <Link href="/sign-up" className="btn btn-ghost">
          Create an account
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-base-100 rounded-box shadow-2xl p-6 md:p-8">
            <SignIn 
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
                  rootBox: "w-full",
                  card: "bg-transparent shadow-none",
                  headerTitle: "text-base-content",
                  headerSubtitle: "text-base-content/70",
                  socialButtonsBlockButton: "bg-base-200 hover:bg-base-300 text-base-content border-2 border-base-content/30 hover:border-base-content/50 transition-all duration-200",
                  socialButtonsBlockButtonText: "font-medium",
                  formButtonPrimary: "bg-[#DC143C] hover:bg-[#B8112F] text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200",
                  footerActionLink: "text-[#DC143C] hover:text-[#B8112F] font-medium",
                  formFieldLabel: "text-base-content font-medium mb-2",
                  formFieldInput: "bg-base-200 text-base-content border-2 border-base-content/30 focus:border-[#DC143C] hover:border-base-content/50 transition-all duration-200 px-4 py-2",
                  formFieldInputShowPasswordButton: "text-base-content/70 hover:text-base-content",
                  identityPreviewText: "text-base-content",
                  identityPreviewEditButton: "text-[#DC143C] hover:text-[#B8112F]",
                  dividerLine: "bg-base-content/20",
                  dividerText: "text-base-content/60",
                  footer: "hidden",
                },
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
  )
}

