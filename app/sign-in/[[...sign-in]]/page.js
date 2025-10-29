import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-base-200 shadow-xl"
          }
        }}
        localization={{
          formFieldLabel__emailAddress: 'Email address',
          signIn: {
            start: {
              title: 'Sign in to App',
              subtitle: 'Welcome back! Please sign in to continue',
            },
          },
        }}
      />
    </div>
  )
}

