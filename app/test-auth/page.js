'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

export default function AuthTestPage() {
  const { user, isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg mb-4"></div>
          <p>Loading auth state...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Auth Test Page</h1>

        {/* Auth Status */}
        <div className="card bg-base-200 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title">Authentication Status</h2>
            <div className="space-y-2">
              <p>
                <strong>Is Loaded:</strong>{' '}
                <span className={isLoaded ? 'text-success' : 'text-error'}>
                  {isLoaded ? '✅ Yes' : '❌ No'}
                </span>
              </p>
              <p>
                <strong>Is Signed In:</strong>{' '}
                <span className={isSignedIn ? 'text-success' : 'text-error'}>
                  {isSignedIn ? '✅ Yes' : '❌ No'}
                </span>
              </p>
              {user && (
                <>
                  <p>
                    <strong>User ID:</strong> <code>{user.id}</code>
                  </p>
                  <p>
                    <strong>Email:</strong> {user.primaryEmailAddress?.emailAddress}
                  </p>
                  <p>
                    <strong>Name:</strong> {user.firstName} {user.lastName}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Public Metadata */}
        {user && (
          <div className="card bg-base-200 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title">Public Metadata</h2>
              <pre className="bg-base-300 p-4 rounded-lg overflow-auto">
                {JSON.stringify(user.publicMetadata, null, 2)}
              </pre>
              <p className="mt-2">
                <strong>Is Admin:</strong>{' '}
                <span className={user.publicMetadata?.isAdmin ? 'text-success' : 'text-warning'}>
                  {user.publicMetadata?.isAdmin ? '✅ Yes' : '❌ No'}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Navigation Test */}
        <div className="card bg-base-200 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title">Navigation Test</h2>
            <p className="mb-4">Try navigating to these pages to test for loops:</p>
            <div className="space-y-2">
              <Link href="/dashboard" className="btn btn-primary btn-block">
                Go to Dashboard
              </Link>
              <Link href="/admin/analytics" className="btn btn-secondary btn-block">
                Go to Admin Analytics
              </Link>
              <Link href="/editor" className="btn btn-accent btn-block">
                Go to Editor
              </Link>
              <Link href="/" className="btn btn-ghost btn-block">
                Go to Homepage
              </Link>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="alert alert-info">
          <div>
            <h3 className="font-bold">How to use this test page:</h3>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Check that you&apos;re signed in (should show user info above)</li>
              <li>Click &quot;Go to Dashboard&quot; - should load without looping</li>
              <li>Click &quot;Go to Admin Analytics&quot; - should redirect if not admin</li>
              <li>Watch browser Network tab for redirect loops</li>
              <li>Check console for any errors</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

