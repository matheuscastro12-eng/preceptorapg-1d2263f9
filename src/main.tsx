import { createRoot } from "react-dom/client";
import ErrorBoundary from "./components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";
import { captureFirstTouch } from "./lib/attribution";

// Captura a 1ª origem do visitante (UTM/referrer) o quanto antes — antes de
// uma navegação SPA limpar a URL. Persistido no cadastro p/ atribuir mídia.
captureFirstTouch();

// Global error handlers — pegam erros que escapam do React (TDZ em
// modules, promises rejeitadas, listeners fora do tree). Loga no console
// com stack completo pra debug.
window.addEventListener("error", (e) => {
  // eslint-disable-next-line no-console
  console.error("[window.error]", e.message, "\n@", e.filename + ":" + e.lineno + ":" + e.colno, "\n", e.error?.stack ?? "");
});
window.addEventListener("unhandledrejection", (e) => {
  // eslint-disable-next-line no-console
  console.error("[unhandledrejection]", e.reason);
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
