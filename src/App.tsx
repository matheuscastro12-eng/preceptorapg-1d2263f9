import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "./contexts/AuthContext";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import Exam from "./pages/Exam";
import Pricing from "./pages/Pricing";
import Admin from "./pages/Admin";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/menu" element={<MainMenu />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/library" element={<Library />} />
              <Route path="/exam" element={<Exam />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/ai-chat" element={<AIChat />} />
              <Route path="/enamed" element={<Enamed />} />
              <Route path="/flashcards" element={<Flashcards />} />
              <Route path="/scientific-studio" element={<ScientificStudio />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              {/* Redirect old routes */}
              <Route path="/topics" element={<Navigate to="/profile" replace />} />
              <Route path="/evolution" element={<Navigate to="/profile" replace />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
