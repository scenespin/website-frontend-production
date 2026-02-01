'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import ButtonSupport from '@/components/ButtonSupport';

/**
 * Produce route error boundary.
 * Logs full error message + stack in dev to capture unminified React errors (e.g. #419).
 */
export default function ProduceError({ error, reset }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && error) {
      console.error('[ProduceError] FULL ERROR (dev) message:', error?.message);
      console.error('[ProduceError] FULL ERROR (dev) stack:', error?.stack);
    }
  }, [error]);

  return (
    <div className="h-screen w-full flex flex-col justify-center items-center text-center gap-6 p-6 bg-gray-950">
      <p className="font-medium md:text-xl md:font-semibold text-white">
        Something went wrong on the Produce page
      </p>
      <p className="text-red-400 text-sm max-w-lg">{error?.message}</p>
      <div className="flex flex-wrap gap-4 justify-center">
        <button
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          onClick={reset}
        >
          Try again
        </button>
        <ButtonSupport />
        <Link href="/produce" className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
          Back to Produce
        </Link>
      </div>
    </div>
  );
}
