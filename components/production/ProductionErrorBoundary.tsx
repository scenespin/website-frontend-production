'use client';

import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary for Production Hub Components
 * 
 * Catches React errors (like #300) and shows a fallback UI
 * instead of crashing the entire page. This allows basic features
 * like deletion to still work even if one component has issues.
 * 
 * Note: This is a temporary solution until the Production Hub redesign.
 */
export class ProductionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const name = this.props.componentName || 'component';
    console.error(`[ProductionErrorBoundary] Error in ${name}:`, {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack
    });
    // In dev, log full unminified message/stack for debugging (e.g. React #419)
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ProductionErrorBoundary] FULL ERROR (dev) message:`, error?.message);
      console.error(`[ProductionErrorBoundary] FULL ERROR (dev) stack:`, error?.stack);
      console.error(`[ProductionErrorBoundary] FULL ERROR (dev) componentStack:`, errorInfo?.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-900 rounded-lg border border-red-500/20">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {this.props.componentName || 'Component'} Error
          </h3>
          <p className="text-sm text-gray-400 mb-4 text-center max-w-md">
            This component encountered an error. The rest of the Production Hub should still work.
            {this.state.error && (
              <span className="block mt-2 text-xs text-red-400">
                {this.state.error.message}
              </span>
            )}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

