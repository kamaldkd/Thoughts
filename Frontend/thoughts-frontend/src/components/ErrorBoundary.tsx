import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught runtime error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 flex-col text-center">
          <h1 className="text-4xl font-bold mb-4">Oops, something went wrong.</h1>
          <p className="text-muted-foreground mb-8 max-w-lg">
            An unexpected error occurred in the application. We've logged the issue.
            Please try reloading the page.
          </p>
          <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-8 max-w-full overflow-auto text-left w-full sm:w-auto">
            <code className="text-sm">{this.state.error?.message}</code>
          </div>
          <Button onClick={this.handleReload} size="lg">
            Reload Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
