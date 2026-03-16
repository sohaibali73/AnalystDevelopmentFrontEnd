'use client';

import { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary component for catching errors in component tree
 * Use this to wrap critical features that shouldn't crash the entire app
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary]', error, errorInfo);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // TODO: Log to error monitoring service
  }

  render() {
    if (this.state.hasError) {
      // Render custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render default error UI
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
          <p className="text-sm text-muted-foreground mb-4">
            This component encountered an error
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre className="text-xs bg-muted p-3 rounded-md mb-4 text-left max-w-full overflow-auto">
              {this.state.error.message}
            </pre>
          )}
          <Button
            size="sm"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
