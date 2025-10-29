import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp 
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-base-200 shadow-xl"
          }
        }}
        localization={{
          formFieldLabel__emailAddress: 'Email address',
          signUp: {
            start: {
              title: 'Create your account',
              subtitle: 'Get started with App today',
            },
          },
        }}
      />
    </div>
  )
}

