import { lazy as reactLazy, Suspense } from "react";

// Wraps React.lazy to auto-reload quando um chunk antigo sumiu pos-deploy.
//
// Estrategia: dois reloads tolerados antes de jogar erro real. O segundo
// reload usa cache-buster (?_cb=ts) na URL pra forcar o navegador a
// pegar um index.html novo do servidor (alguns navegadores agressivos
// servem index.html cached mesmo com Cache-Control no-store).
const lazy = <T extends { default: React.ComponentType<any> }>(
  factory: () => Promise<T>,
) =>
  reactLazy(() =>
    factory().catch((err) => {
      const msg = String(err?.message ?? err);
      const isChunkError =
        msg.includes("Failed to fetch dynamically imported module") ||
        msg.includes("Importing a module script failed") ||
        msg.includes("error loading dynamically imported module") ||
        msg.includes("Loading chunk") ||
        msg.includes("ChunkLoadError");

      if (!isChunkError) throw err;

      const attemptStr = sessionStorage.getItem("chunk-reload-attempt");
      const attempt = attemptStr ? parseInt(attemptStr, 10) : 0;

      if (attempt >= 2) {
        // Tentou 2 reloads e ainda falha. Limpa e propaga (ErrorBoundary mostra).
        sessionStorage.removeItem("chunk-reload-attempt");
        throw err;
      }

      sessionStorage.setItem("chunk-reload-attempt", String(attempt + 1));

      if (attempt === 0) {
        // 1ª tentativa: reload simples (deveria pegar novo index.html)
        window.location.reload();
      } else {
        // 2ª tentativa: cache-buster forçado na URL
        const url = new URL(window.location.href);
        url.searchParams.set("_cb", String(Date.now()));
        window.location.replace(url.toString());
      }
      return new Promise<T>(() => {});
    }),
  );

// Limpa o contador de reload quando a app monta com sucesso (Suspense
// resolveu pelo menos uma vez), pra que o próximo deploy também consiga
// 2 tentativas frescas.
if (typeof window !== "undefined") {
  window.addEventListener("load", () => {
    setTimeout(() => sessionStorage.removeItem("chunk-reload-attempt"), 2000);
  });
}
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./contexts/AuthContext";
import { CrmAuthProvider } from "./contexts/CrmAuthContext";
import { usePageTracking } from "./hooks/usePageTracking";
import PageSkeleton from "./components/PageSkeleton";

// Core pages (loaded eagerly — first paint)
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import MainMenu from "./pages/MainMenu";
import NotFound from "./pages/NotFound";

// Lazy-loaded pages (split into separate chunks)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Library = lazy(() => import("./pages/Library"));
const Exam = lazy(() => import("./pages/Exam"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Subscription = lazy(() => import("./pages/Subscription"));
const Profile = lazy(() => import("./pages/Profile"));
const AIChat = lazy(() => import("./pages/AIChat"));
const Enamed = lazy(() => import("./pages/Enamed"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Flashcards = lazy(() => import("./pages/Flashcards"));
const ScientificStudio = lazy(() => import("./pages/ScientificStudio"));
const Provas = lazy(() => import("./pages/Provas"));
const ProvaReview = lazy(() => import("./pages/ProvaReview"));
const ProvaSimulado = lazy(() => import("./pages/ProvaSimulado"));
const Whitebook = lazy(() => import("./pages/Whitebook"));
const WhitebookCalculator = lazy(() => import("./pages/WhitebookCalculator"));
const WhitebookDrug = lazy(() => import("./pages/WhitebookDrug"));
const WhitebookProtocol = lazy(() => import("./pages/WhitebookProtocol"));
const WhitebookPrescription = lazy(() => import("./pages/WhitebookPrescription"));
const WhitebookAdmin = lazy(() => import("./pages/admin/WhitebookAdmin"));
const CasosClinicos = lazy(() => import("./pages/CasosClinicos"));
const CasosClinicosNovo = lazy(() => import("./pages/CasosClinicosNovo"));
const CasoClinico = lazy(() => import("./pages/CasoClinico"));
const Cronograma = lazy(() => import("./pages/Cronograma"));
const CronogramaNovo = lazy(() => import("./pages/CronogramaNovo"));
const CronogramaDia = lazy(() => import("./pages/CronogramaDia"));
const Scribe = lazy(() => import("./pages/Scribe"));
const ScribeNova = lazy(() => import("./pages/ScribeNova"));
const ScribeReview = lazy(() => import("./pages/ScribeReview"));
const ScribeAudit = lazy(() => import("./pages/ScribeAudit"));
const ThankYou = lazy(() => import("./pages/ThankYou"));
const SubscriptionThankYou = lazy(() => import("./pages/SubscriptionThankYou"));
const Termos = lazy(() => import("./pages/Termos"));
const Privacidade = lazy(() => import("./pages/Privacidade"));
const SemanaItajuba = lazy(() => import("./pages/SemanaItajuba"));

// CRM pages (lazy — admin only)
const CrmHub = lazy(() => import("./pages/crm/v3/HubV3"));
const CrmLayout = lazy(() => import("./pages/crm/CrmLayout"));
const CrmDashboard = lazy(() => import("./pages/crm/v3/DashboardV3"));
const CrmLeads = lazy(() => import("./pages/crm/v3/LeadsV3"));
const CrmFunnel = lazy(() => import("./pages/crm/v3/FunnelV3"));
const CrmLandingFunnel = lazy(() => import("./pages/crm/v3/MarketingPagesV3").then((m) => ({ default: m.LandingFunnelV3 })));
const CrmHealth = lazy(() => import("./pages/crm/v3/MarketingPagesV3").then((m) => ({ default: m.HealthV3 })));
const CrmChurn = lazy(() => import("./pages/crm/v3/MarketingPagesV3").then((m) => ({ default: m.ChurnV3 })));
const CrmAutomations = lazy(() => import("./pages/crm/v3/MarketingPagesV3").then((m) => ({ default: m.AutomationsV3 })));
const CrmEmailTemplates = lazy(() => import("./pages/crm/v3/MarketingPagesV3").then((m) => ({ default: m.EmailTemplatesV3 })));
const CrmCohorts = lazy(() => import("./pages/crm/v3/MarketingPagesV3").then((m) => ({ default: m.CohortsV3 })));
const CrmUsers = lazy(() => import("./pages/crm/v3/MarketingPagesV3").then((m) => ({ default: m.UsersV3 })));
const CrmAnalytics = lazy(() => import("./pages/crm/v3/MarketingPagesV3").then((m) => ({ default: m.AnalyticsV3 })));
const CrmSuporte = lazy(() => import("./pages/crm/v3/MarketingPagesV3").then((m) => ({ default: m.SuporteV3 })));
const CrmRoleta = lazy(() => import("./pages/crm/v3/MarketingPagesV3").then((m) => ({ default: m.RoletaV3 })));

// CRM Admin pages (lazy — admin only) — todos v3
const CrmAdminLayout = lazy(() => import("./pages/crm-admin/CrmAdminLayout"));
const AdminDashboard = lazy(() => import("./pages/crm-admin/v3/AdminFinancasV3").then((m) => ({ default: m.AdminDashboardV3 })));
const AdminReceita = lazy(() => import("./pages/crm-admin/v3/AdminFinancasV3").then((m) => ({ default: m.ReceitaV3 })));
const AdminDespesas = lazy(() => import("./pages/crm-admin/v3/AdminFinancasV3").then((m) => ({ default: m.DespesasV3 })));
const AdminFluxoCaixa = lazy(() => import("./pages/crm-admin/v3/AdminFinancasV3").then((m) => ({ default: m.FluxoCaixaV3 })));
const AdminInadimplencia = lazy(() => import("./pages/crm-admin/v3/AdminFinancasV3").then((m) => ({ default: m.InadimplenciaV3 })));
const AdminForecast = lazy(() => import("./pages/crm-admin/v3/AdminFinancasV3").then((m) => ({ default: m.ForecastV3 })));
const AdminMetas = lazy(() => import("./pages/crm-admin/v3/AdminFinancasV3").then((m) => ({ default: m.MetasV3 })));
const AdminRelatorio = lazy(() => import("./pages/crm-admin/v3/AdminFinancasV3").then((m) => ({ default: m.RelatorioV3 })));
const AdminTime = lazy(() => import("./pages/crm-admin/v3/AdminTimeV3"));
const AdminOneOnOne = lazy(() => import("./pages/crm-admin/v3/AdminPeopleSistemaV3").then((m) => ({ default: m.OneOnOneV3 })));
const AdminPDI = lazy(() => import("./pages/crm-admin/v3/AdminPeopleSistemaV3").then((m) => ({ default: m.PDIV3 })));
const AdminCarreira = lazy(() => import("./pages/crm-admin/v3/AdminPeopleSistemaV3").then((m) => ({ default: m.CarreiraV3 })));
const AdminContratacoes = lazy(() => import("./pages/crm-admin/v3/AdminPeopleSistemaV3").then((m) => ({ default: m.ContratacoesV3 })));
const AdminSalarios = lazy(() => import("./pages/crm-admin/v3/AdminPeopleSistemaV3").then((m) => ({ default: m.SalariosV3 })));
const AdminEasyflow = lazy(() => import("./pages/crm-admin/v3/AdminPeopleSistemaV3").then((m) => ({ default: m.EasyflowV3 })));
const AdminWebhooks = lazy(() => import("./pages/crm-admin/v3/AdminPeopleSistemaV3").then((m) => ({ default: m.WebhooksV3 })));
const AdminDRE = lazy(() => import("./pages/crm-admin/v3/AdminDREv3"));

const queryClient = new QueryClient();

function PageTracker({ children }: { children: React.ReactNode }) {
  usePageTracking();
  return <>{children}</>;
}

const LazyFallback = () => <PageSkeleton variant="menu" />;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
      <TooltipProvider>
        <AuthProvider>
        <CrmAuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <PageTracker>
            <Suspense fallback={<LazyFallback />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/login" element={<Navigate to="/auth" replace />} />
                <Route path="/welcome" element={<Navigate to="/inscricao" replace />} />
                <Route path="/menu" element={<MainMenu />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/library" element={<Library />} />
                <Route path="/exam" element={<Exam />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/subscription" element={<Subscription />} />
                <Route path="/admin" element={<Navigate to="/admin/crm" replace />} />
                <Route path="/admin/crm" element={<CrmHub />} />
                <Route path="/admin/crm-mkt" element={<CrmLayout />}>
                  <Route index element={<CrmDashboard />} />
                  <Route path="leads" element={<CrmLeads />} />
                  <Route path="funnel" element={<CrmFunnel />} />
                  <Route path="landing-funnel" element={<CrmLandingFunnel />} />
                  <Route path="health" element={<CrmHealth />} />
                  <Route path="churn" element={<CrmChurn />} />
                  <Route path="automations" element={<CrmAutomations />} />
                  <Route path="templates-email" element={<CrmEmailTemplates />} />
                  <Route path="cohorts" element={<CrmCohorts />} />
                  <Route path="users" element={<CrmUsers />} />
                  <Route path="analytics" element={<CrmAnalytics />} />
                  <Route path="roleta" element={<CrmRoleta />} />
                  <Route path="suporte" element={<CrmSuporte />} />
                </Route>
                <Route path="/admin/crm-admin" element={<CrmAdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="receita" element={<AdminReceita />} />
                  <Route path="despesas" element={<AdminDespesas />} />
                  <Route path="fluxo-caixa" element={<AdminFluxoCaixa />} />
                  <Route path="time" element={<AdminTime />} />
                  <Route path="salarios" element={<AdminSalarios />} />
                  <Route path="contratacoes" element={<AdminContratacoes />} />
                  <Route path="one-on-one" element={<AdminOneOnOne />} />
                  <Route path="pdi" element={<AdminPDI />} />
                  <Route path="carreira" element={<AdminCarreira />} />
                  <Route path="metas" element={<AdminMetas />} />
                  <Route path="relatorio" element={<AdminRelatorio />} />
                  <Route path="forecast" element={<AdminForecast />} />
                  <Route path="dre" element={<AdminDRE />} />
                  <Route path="easyflow" element={<AdminEasyflow />} />
                  <Route path="webhooks" element={<AdminWebhooks />} />
                  <Route path="inadimplencia" element={<AdminInadimplencia />} />
                </Route>
                <Route path="/profile" element={<Profile />} />
                <Route path="/ai-chat" element={<AIChat />} />
                <Route path="/enamed" element={<Enamed />} />
                <Route path="/flashcards" element={<Flashcards />} />
                <Route path="/scientific-studio" element={<ScientificStudio />} />
                <Route path="/provas" element={<Provas />} />
                <Route path="/provas/:id/review" element={<ProvaReview />} />
                <Route path="/provas/:id/simulado" element={<ProvaSimulado />} />
                <Route path="/whitebook" element={<Whitebook />} />
                <Route path="/whitebook/calculator/:slug" element={<WhitebookCalculator />} />
                <Route path="/whitebook/drug/:slug" element={<WhitebookDrug />} />
                <Route path="/whitebook/protocol/:slug" element={<WhitebookProtocol />} />
                <Route path="/whitebook/prescription/:slug" element={<WhitebookPrescription />} />
                <Route path="/admin/whitebook" element={<WhitebookAdmin />} />
                <Route path="/casos-clinicos" element={<CasosClinicos />} />
                <Route path="/casos-clinicos/novo" element={<CasosClinicosNovo />} />
                <Route path="/casos-clinicos/:id" element={<CasoClinico />} />
                <Route path="/cronograma" element={<Cronograma />} />
                <Route path="/cronograma/novo" element={<CronogramaNovo />} />
                <Route path="/cronograma/dia/:date" element={<CronogramaDia />} />
                <Route path="/scribe" element={<Scribe />} />
                <Route path="/scribe/nova" element={<ScribeNova />} />
                <Route path="/scribe/:id/review" element={<ScribeReview />} />
                <Route path="/scribe/:id/audit" element={<ScribeAudit />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/obrigado" element={<SubscriptionThankYou />} />
                <Route path="/obrigado/:plano" element={<SubscriptionThankYou />} />
                <Route path="/inscricao" element={<ThankYou />} />
                <Route path="/termos" element={<Termos />} />
                <Route path="/privacidade" element={<Privacidade />} />
                <Route path="/semana-itajuba" element={<SemanaItajuba />} />
                {/* Legacy redirects */}
                <Route path="/topics" element={<Navigate to="/profile" replace />} />
                <Route path="/evolution" element={<Navigate to="/profile" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </PageTracker>
          </BrowserRouter>
        </CrmAuthProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
