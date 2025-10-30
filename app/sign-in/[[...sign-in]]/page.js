import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-base-300 via-base-200 to-base-100">
      <div className="w-full max-w-md p-8 bg-base-100 rounded-box shadow-2xl">
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
            },
            elements: {
              rootBox: "w-full",
              card: "bg-transparent shadow-none",
              headerTitle: "text-base-content",
              headerSubtitle: "text-base-content/70",
              socialButtonsBlockButton: "bg-base-200 hover:bg-base-300 text-base-content border border-base-content/20",
              formButtonPrimary: "bg-[#DC143C] hover:bg-[#B8112F] text-white",
              footerActionLink: "text-[#DC143C] hover:text-[#B8112F]",
              formFieldLabel: "text-base-content",
              formFieldInput: "bg-base-200 text-base-content border-base-content/20",
              footer: "hidden", // Hides "Secured by Clerk"
            }
          }}
        />
      </div>
    </div>
  )
}

