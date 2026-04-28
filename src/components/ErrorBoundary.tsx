import React from "react";
import logoIcon from "@/assets/logo-icon.png";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  componentStack: string | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, componentStack: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, componentStack: null };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error.message, "\n", error.stack, "\n", info.componentStack);
    this.setState({ componentStack: info.componentStack ?? null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <img src={logoIcon} alt="PreceptorMED" className="h-14 w-14 mx-auto mb-5 opacity-50" />
            <h1 className="text-xl font-bold text-slate-800 mb-2" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Algo deu errado
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              Ocorreu um erro inesperado. Tente recarregar a pagina.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-[#006D5B] text-white text-sm font-bold rounded-lg hover:bg-[#005344] transition-colors"
              >
                Recarregar
              </button>
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.history.back(); }}
                className="px-6 py-2.5 border border-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors"
              >
                Voltar
              </button>
            </div>
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-slate-400 cursor-pointer">Detalhes do erro</summary>
                <pre className="mt-2 p-3 bg-slate-100 rounded-lg text-[10.5px] text-slate-600 overflow-auto max-h-72 leading-relaxed font-mono whitespace-pre-wrap break-all">
{`> ${this.state.error.message}

— STACK —
${this.state.error.stack ?? "(sem stack)"}${this.state.componentStack ? "\n\n— COMPONENT TREE —\n" + this.state.componentStack : ""}`}
                </pre>
                <button
                  onClick={() => {
                    const txt =
                      `${this.state.error?.message}\n\n${this.state.error?.stack ?? ""}\n\n${this.state.componentStack ?? ""}`;
                    void navigator.clipboard?.writeText(txt);
                  }}
                  className="mt-2 text-[11px] text-[#005344] hover:underline font-semibold"
                >
                  Copiar tudo
                </button>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
