import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./contexts/AuthContext";
import { CrmAuthProvider } from "./contexts/CrmAuthContext";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import Exam from "./pages/Exam";
import Pricing from "./pages/Pricing";
import Landing from "./pages/Landing";
import MainMenu from "./pages/MainMenu";
import Subscription from "./pages/Subscription";
import Profile from "./pages/Profile";
import AIChat from "./pages/AIChat";
import Enamed from "./pages/Enamed";
import ResetPassword from "./pages/ResetPassword";
import Flashcards from "./pages/Flashcards";
import ScientificStudio from "./pages/ScientificStudio";
import NotFound from "./pages/NotFound";
import CrmHub from "./pages/crm/CrmHub";
import CrmLayout from "./pages/crm/CrmLayout";
import CrmDashboard from "./pages/crm/CrmDashboard";
import CrmLeads from "./pages/crm/CrmLeads";
import CrmFunnel from "./pages/crm/CrmFunnel";
import CrmHealth from "./pages/crm/CrmHealth";
import CrmChurn from "./pages/crm/CrmChurn";
import CrmAutomations from "./pages/crm/CrmAutomations";
import CrmUsers from "./pages/crm/CrmUsers";
import CrmAnalytics from "./pages/crm/CrmAnalytics";
import CrmAdminLayout from "./pages/crm-admin/CrmAdminLayout";
import AdminDashboard from "./pages/crm-admin/AdminDashboard";
import AdminReceita from "./pages/crm-admin/AdminReceita";
import AdminDespesas from "./pages/crm-admin/AdminDespesas";
import AdminFluxoCaixa from "./pages/crm-admin/AdminFluxoCaixa";
import AdminTime from "./pages/crm-admin/AdminTime";
import AdminSalarios from "./pages/crm-admin/AdminSalarios";
import AdminContratacoes from "./pages/crm-admin/AdminContratacoes";
import AdminMetas from "./pages/crm-admin/AdminMetas";
import AdminOneOnOne from "./pages/crm-admin/AdminOneOnOne";
import AdminPDI from "./pages/crm-admin/AdminPDI";
import AdminCarreira from "./pages/crm-admin/AdminCarreira";
import AdminRelatorio from "./pages/crm-admin/AdminRelatorio";
import AdminForecast from "./pages/crm-admin/AdminForecast";
import AdminDRE from "./pages/crm-admin/AdminDRE";
import AdminEasyflow from "./pages/crm-admin/AdminEasyflow";
import AdminInadimplencia from "./pages/crm-admin/AdminInadimplencia";
import Welcome from "./pages/Welcome";
import { usePageTracking } from "./hooks/usePageTracking";

const queryClient = new QueryClient();

function PageTracker({ children }: { children: React.ReactNode }) {
  usePageTracking();
  return <>{children}</>;
}

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
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/welcome" element={<Welcome />} />
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
                <Route path="health" element={<CrmHealth />} />
                <Route path="churn" element={<CrmChurn />} />
                <Route path="automations" element={<CrmAutomations />} />
                <Route path="users" element={<CrmUsers />} />
                <Route path="analytics" element={<CrmAnalytics />} />
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
                <Route path="inadimplencia" element={<AdminInadimplencia />} />
              </Route>
              <Route path="/profile" element={<Profile />} />
              <Route path="/ai-chat" element={<AIChat />} />
              <Route path="/enamed" element={<Enamed />} />
              <Route path="/flashcards" element={<Flashcards />} />
              <Route path="/scientific-studio" element={<ScientificStudio />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              {/* Legacy redirects */}
              <Route path="/topics" element={<Navigate to="/profile" replace />} />
              <Route path="/evolution" element={<Navigate to="/profile" replace />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PageTracker>
          </BrowserRouter>
        </CrmAuthProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
