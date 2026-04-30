import { lazy as reactLazy, Suspense } from "react";

// Wraps React.lazy to auto-reload quando um chunk antigo sumiu pos-deploy.
// Usa sessionStorage pra evitar loop infinito caso o problema seja real.
const lazy = <T extends { default: React.ComponentType<any> }>(
  factory: () => Promise<T>,
) =>
  reactLazy(() =>
    factory().catch((err) => {
      const msg = String(err?.message ?? err);
      const isChunkError =
        msg.includes("Failed to fetch dynamically imported module") ||
        msg.includes("Importing a module script failed") ||
        msg.includes("error loading dynamically imported module");
      const alreadyReloaded = sessionStorage.getItem("chunk-reload-attempt");
      if (isChunkError && !alreadyReloaded) {
        sessionStorage.setItem("chunk-reload-attempt", "1");
        window.location.reload();
        return new Promise<T>(() => {});
      }
      sessionStorage.removeItem("chunk-reload-attempt");
      throw err;
    }),
  );
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
const WhitebookAdmin = lazy(() => import("./pages/admin/WhitebookAdmin"));
const Scribe = lazy(() => import("./pages/Scribe"));
const ScribeNova = lazy(() => import("./pages/ScribeNova"));
const ScribeReview = lazy(() => import("./pages/ScribeReview"));
const ThankYou = lazy(() => import("./pages/ThankYou"));
const SubscriptionThankYou = lazy(() => import("./pages/SubscriptionThankYou"));

// CRM pages (lazy — admin only)
const CrmHub = lazy(() => import("./pages/crm/CrmHub"));
const CrmLayout = lazy(() => import("./pages/crm/CrmLayout"));
const CrmDashboard = lazy(() => import("./pages/crm/CrmDashboard"));
const CrmLeads = lazy(() => import("./pages/crm/CrmLeads"));
const CrmFunnel = lazy(() => import("./pages/crm/CrmFunnel"));
const CrmLandingFunnel = lazy(() => import("./pages/crm/CrmLandingFunnel"));
const CrmHealth = lazy(() => import("./pages/crm/CrmHealth"));
const CrmChurn = lazy(() => import("./pages/crm/CrmChurn"));
const CrmAutomations = lazy(() => import("./pages/crm/CrmAutomations"));
const CrmEmailTemplates = lazy(() => import("./pages/crm/CrmEmailTemplates"));
const CrmCohorts = lazy(() => import("./pages/crm/CrmCohorts"));
const CrmUsers = lazy(() => import("./pages/crm/CrmUsers"));
const CrmAnalytics = lazy(() => import("./pages/crm/CrmAnalytics"));

// CRM Admin pages (lazy — admin only)
const CrmAdminLayout = lazy(() => import("./pages/crm-admin/CrmAdminLayout"));
const AdminDashboard = lazy(() => import("./pages/crm-admin/AdminDashboard"));
const AdminReceita = lazy(() => import("./pages/crm-admin/AdminReceita"));
const AdminDespesas = lazy(() => import("./pages/crm-admin/AdminDespesas"));
const AdminFluxoCaixa = lazy(() => import("./pages/crm-admin/AdminFluxoCaixa"));
const AdminTime = lazy(() => import("./pages/crm-admin/AdminTime"));
const AdminSalarios = lazy(() => import("./pages/crm-admin/AdminSalarios"));
const AdminContratacoes = lazy(() => import("./pages/crm-admin/AdminContratacoes"));
const AdminMetas = lazy(() => import("./pages/crm-admin/AdminMetas"));
const AdminOneOnOne = lazy(() => import("./pages/crm-admin/AdminOneOnOne"));
const AdminPDI = lazy(() => import("./pages/crm-admin/AdminPDI"));
const AdminCarreira = lazy(() => import("./pages/crm-admin/AdminCarreira"));
const AdminRelatorio = lazy(() => import("./pages/crm-admin/AdminRelatorio"));
const AdminForecast = lazy(() => import("./pages/crm-admin/AdminForecast"));
const AdminDRE = lazy(() => import("./pages/crm-admin/AdminDRE"));
const AdminEasyflow = lazy(() => import("./pages/crm-admin/AdminEasyflow"));
const AdminWebhooks = lazy(() => import("./pages/crm-admin/AdminWebhooks"));
const AdminInadimplencia = lazy(() => import("./pages/crm-admin/AdminInadimplencia"));
const CrmSuporte = lazy(() => import("./pages/crm/CrmSuporte"));

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
                <Route path="/admin/whitebook" element={<WhitebookAdmin />} />
                <Route path="/scribe" element={<Scribe />} />
                <Route path="/scribe/nova" element={<ScribeNova />} />
                <Route path="/scribe/:id/review" element={<ScribeReview />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/obrigado" element={<SubscriptionThankYou />} />
                <Route path="/obrigado/:plano" element={<SubscriptionThankYou />} />
                <Route path="/inscricao" element={<ThankYou />} />
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
