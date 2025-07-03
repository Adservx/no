import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      // Error details to help debugging
      const errorMessage = this.state.error?.message || 'Unknown error';
      const errorStack = this.state.error?.stack || '';
      const errorName = this.state.error?.name || 'Error';
      
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{errorName}: {errorMessage}</p>
          <div className="error-actions">
            <button onClick={() => window.location.reload()}>
              Refresh Page
            </button>
            <button onClick={() => this.setState({ hasError: false })}>
              Try Again
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <details>
              <summary>Error Details</summary>
              <pre>{errorStack}</pre>
              <pre>{this.state.errorInfo?.componentStack}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
