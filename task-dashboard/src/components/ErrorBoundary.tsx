import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "2rem",
            background: "var(--bg-primary, #0f172a)",
            color: "var(--text-primary, #f1f5f9)",
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            textAlign: "center",
          }}
        >
          <div
            style={{
              maxWidth: 480,
              padding: "2.5rem",
              borderRadius: 16,
              background: "var(--bg-secondary, #1e293b)",
              border: "1px solid var(--border-color, #334155)",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>
              Something went wrong
            </h1>
            <p
              style={{
                fontSize: "0.95rem",
                color: "var(--text-secondary, #94a3b8)",
                marginBottom: "1.5rem",
                lineHeight: 1.6,
              }}
            >
              An unexpected error occurred. Please try reloading the page.
            </p>
            {this.state.error && (
              <pre
                style={{
                  fontSize: "0.8rem",
                  color: "#f87171",
                  background: "rgba(248,113,113,0.08)",
                  padding: "0.75rem 1rem",
                  borderRadius: 8,
                  marginBottom: "1.5rem",
                  overflow: "auto",
                  maxHeight: 120,
                  textAlign: "left",
                  border: "1px solid rgba(248,113,113,0.2)",
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              style={{
                padding: "0.65rem 1.75rem",
                fontSize: "0.95rem",
                fontWeight: 600,
                color: "#fff",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 4px 15px rgba(99,102,241,0.4)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
