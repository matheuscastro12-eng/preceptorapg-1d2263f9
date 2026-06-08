// ============================================================
// Feature flags — foco de produto (Fase 2 do plano de virada)
// ============================================================
// FOCUS_MODE concentra a navegação nos 2 jobs que realmente têm uso
// (fechamentos + simulados/ENAMED) e esconde os módulos sem adoção,
// reduzindo dispersão e levando o aluno mais rápido ao momento "aha".
//
// IMPORTANTE: nada é deletado. As rotas continuam existindo e acessíveis
// por URL — só saem da sidebar. Para reverter, basta FOCUS_MODE = false.

// Desligado a pedido do dono: itens (Provas Importadas, Cronograma, Casos
// clínicos, PreceptorBook, Scribe, Curadoria) tinham sumido da sidebar e isso
// foi percebido como regressão. Sidebar volta completa. Para reativar o modo
// foco depois (tunado), basta voltar para true e ajustar FOCUS_NAV_PATHS.
export const FOCUS_MODE = false;

/**
 * Caminhos que permanecem na sidebar quando FOCUS_MODE está ligado.
 * Match é feito pela base do path (query string ignorada), então
 * '/enamed?area=true' é mantido porque '/enamed' está na lista.
 */
export const FOCUS_NAV_PATHS = new Set<string>([
  '/menu',        // Início
  '/dashboard',   // Estudo com PreceptorMED (fechamentos) — o core
  '/exam',        // Simulação normal
  '/enamed',      // ENAMED + Simulado por Área
  '/flashcards',  // Flashcards
  '/library',     // Biblioteca (onde os fechamentos ficam) — essencial p/ retorno
]);

/** True se o path (com ou sem query) deve aparecer no modo foco. */
export const isFocusPath = (path: string): boolean =>
  FOCUS_NAV_PATHS.has(path.split('?')[0]);
