import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Top-level error boundary. Prevents a single component crash
 * from taking down the entire app.
 *
 * Usage: Wrap <App /> or any subtree in <ErrorBoundary>
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Replace with your error monitoring service (e.g. Sentry) when ready
    console.error('[ErrorBoundary] Uncaught error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-background text-foreground gap-6 p-8">
          <span className="text-6xl">♚</span>
          <h1 className="font-display text-2xl font-bold text-primary">Something went wrong</h1>
          <p className="text-muted-foreground text-center max-w-sm text-sm font-body">
            An unexpected error occurred. Your game data is safe — please reload to continue.
          </p>
          {this.state.error && (
            <pre className="text-xs text-muted-foreground bg-muted px-4 py-2 rounded-lg max-w-md overflow-auto">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReset}
            className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors font-body"
          >
            Return to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
