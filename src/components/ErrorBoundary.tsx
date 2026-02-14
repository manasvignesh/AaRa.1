import React from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-secondary/30">
          <div className="max-w-md w-full text-center space-y-6 bg-card p-8 rounded-2xl shadow-lg border border-destructive/20">
            <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Something didn't load correctly</h1>
              <p className="text-muted-foreground leading-relaxed">
                We're sorry for the interruption. This is a safety layer catching a runtime error to prevent a blank screen.
              </p>
            </div>
            <Button 
              className="w-full h-12 text-lg font-semibold gap-2" 
              onClick={() => window.location.href = '/dashboard'}
            >
              <RotateCcw className="w-5 h-5" />
              Return to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
