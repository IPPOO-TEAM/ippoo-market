import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { key: number; error: Error | null; errorCount: number; lastErrorAt: number };

const TRANSIENT_PATTERNS = [
  /NotFoundError.*removeChild/i,
  /Failed to execute 'removeChild'/i,
  /The node to be removed is not a child/i,
];

function isTransientDomError(err: unknown): boolean {
  const msg = String((err as { message?: string })?.message ?? err);
  return TRANSIENT_PATTERNS.some((rx) => rx.test(msg));
}

/**
 * ErrorBoundary qui :
 *  - Tente une réhydratation silencieuse pour les erreurs DOM transitoires
 *    (race React/lib tierce — ex. NotFoundError removeChild).
 *  - Affiche un fallback lisible pour toute autre erreur, au lieu de
 *    re-monter en boucle et de produire un écran blanc.
 */
export class SafeBoundary extends Component<Props, State> {
  state: State = { key: 0, error: null, errorCount: 0, lastErrorAt: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: unknown) {
    const now = Date.now();
    const isBurst = now - this.state.lastErrorAt < 1000;
    const nextCount = isBurst ? this.state.errorCount + 1 : 1;

    // eslint-disable-next-line no-console
    console.error("[SafeBoundary]", error);

    if (isTransientDomError(error) && nextCount < 3) {
      this.setState((s) => ({
        key: s.key + 1,
        error: null,
        errorCount: nextCount,
        lastErrorAt: now,
      }));
      return;
    }

    this.setState({ error: error as Error, errorCount: nextCount, lastErrorAt: now });
  }

  handleReset = () => {
    this.setState((s) => ({ key: s.key + 1, error: null, errorCount: 0, lastErrorAt: 0 }));
  };

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: "system-ui, sans-serif", color: "#111" }}>
          <h1 style={{ fontSize: 18, marginBottom: 8 }}>Une erreur est survenue</h1>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              background: "#FEF2F2",
              border: "1px solid #FCA5A5",
              borderRadius: 8,
              padding: 12,
              fontSize: 12,
              color: "#7F1D1D",
              maxHeight: 280,
              overflow: "auto",
            }}
          >
            {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
          </pre>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              marginTop: 12,
              padding: "8px 14px",
              borderRadius: 8,
              background: "#E11D2E",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      );
    }
    return <div key={this.state.key}>{this.props.children}</div>;
  }
}
