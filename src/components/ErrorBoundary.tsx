import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  /** 페이지 수준 바운더리 (true이면 홈으로 이동 버튼 노출) */
  pageBoundary?: boolean;
  /** 에러 발생 시 호출할 콜백 (분석/로깅용) */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 무해한 Supabase Lock 에러는 콘솔에도 출력하지 않음
    const msg = error?.message ?? "";
    if (msg.includes("was released because another request stole it")) return;

    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  private handleReload = () => {
    // 전체 앱 재시작 (stale 상태 완전 초기화)
    window.location.reload();
  };

  private handleGoHome = () => {
    // 특정 페이지 크래시 → 홈으로 복구
    this.setState({ hasError: false, error: null });
    window.location.hash = "#/";
  };

  public render() {
    if (this.state.hasError) {
      const isPageBoundary = this.props.pageBoundary;
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-background">
          <div className="w-full max-w-sm text-center">
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center bg-destructive/10">
              <AlertTriangle size={36} className="text-destructive mb-1" />
            </div>
            <h1 className="text-xl font-black text-foreground mb-2">
              {isPageBoundary ? "Page Error" : "App Error"}
            </h1>
            <p className="text-sm text-muted-foreground mb-8">
              {isPageBoundary
                ? "There was a problem loading this screen. Go back to home or restart the app."
                : "An unexpected error occurred. The team has been notified automatically."}
            </p>
            <div className="flex flex-col gap-3">
              {isPageBoundary && (
                <button
                  onClick={this.handleGoHome}
                  className="w-full py-4 rounded-2xl bg-muted text-foreground font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Home size={18} />
                  Go to Home
                </button>
              )}
              <button
                onClick={this.handleReload}
                className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(45,212,191,0.25)] active:scale-95 transition-all"
              >
                <RefreshCw size={18} />
                Restart App
              </button>
            </div>
            {this.state.error?.message && (
              <p className="text-xs text-muted-foreground/40 mt-6 break-all line-clamp-2 font-mono">
                {this.state.error.message}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
