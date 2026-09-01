import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  message: string | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { message: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { message: error instanceof Error ? error.message : 'Unexpected error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Unhandled error in Physics Lab', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.message === null) return this.props.children;
    return (
      <div className="card" style={{ margin: '2rem 1.5rem' }}>
        <h1>Something went wrong</h1>
        <p className="error">{this.state.message}</p>
        <p className="muted">
          The inputs in the address bar may describe an impossible scenario. Try removing the query
          string, or reload the page.
        </p>
        <button type="button" onClick={() => this.setState({ message: null })}>
          Try again
        </button>
      </div>
    );
  }
}
