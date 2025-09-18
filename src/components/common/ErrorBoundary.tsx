import React, { Component, ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="p-6 m-4 border-destructive/50 bg-destructive/5">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-semibold text-destructive">Something went wrong</h2>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            An unexpected error occurred. This might be due to a development environment issue or missing dependencies.
          </p>
          
          {this.state.error && (
            <details className="mb-4">
              <summary className="text-sm font-medium cursor-pointer mb-2">Error details</summary>
              <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-32">
                {this.state.error.stack || this.state.error.message}
              </pre>
            </details>
          )}
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => this.setState({ hasError: false, error: undefined })}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try again
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Reload page
            </Button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}