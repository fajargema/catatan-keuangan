"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary — Menangkap error runtime React yang tidak tertangani.
 * Gunakan ini untuk wrap section atau halaman yang kritis.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console — bisa diganti dengan Sentry/logging service di produksi
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 24px",
            textAlign: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "rgba(244, 63, 94, 0.12)",
              border: "1px solid rgba(244, 63, 94, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
            }}
          >
            ⚠️
          </div>
          <div>
            <p
              style={{
                fontWeight: 700,
                fontSize: "1rem",
                color: "var(--text-primary)",
                marginBottom: 6,
              }}
            >
              Terjadi kesalahan
            </p>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--text-secondary)",
                maxWidth: 320,
                lineHeight: 1.5,
              }}
            >
              {this.state.error?.message || "Komponen ini mengalami error yang tidak terduga."}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="btn-secondary"
            style={{ fontSize: "0.8125rem" }}
          >
            Coba Lagi
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
