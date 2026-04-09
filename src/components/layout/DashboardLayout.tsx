import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Menu, X, Loader2 } from 'lucide-react';
import GamificationWidget from '@/components/GamificationWidget';
import SupportWidget from '@/components/support/SupportWidget';
import NpsModal from '@/components/support/NpsModal';

interface DashboardLayoutProps {
  children: React.ReactNode;
  mainClassName?: string;
  hideFooter?: boolean;
}

const MI = ({ name, fill = false, className = '' }: { name: string; fill?: boolean; className?: string }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{ fontVariationSettings: fill ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : undefined }}
  >
    {name}
  </span>
);

interface NavItem {
  icon: string;
  label: string;
  path: string;
  matchPaths?: string[];
  children?: { icon: string; label: string; path: string; matchPaths?: string[] }[];
}

const sidebarNavItems: NavItem[] = [
  { icon: 'dashboard', label: 'Início', path: '/menu' },
  { icon: 'auto_awesome', label: 'Estudo com IA', path: '/dashboard' },
  {
    icon: 'shutter_speed', label: 'Simulações', path: '/exam',
    matchPaths: ['/exam', '/enamed', '/flashcards'],
    children: [
      { icon: 'assignment', label: 'Simulação Normal', path: '/exam' },
      { icon: 'history_edu', label: 'ENAMED', path: '/enamed' },
      { icon: 'target', label: 'Simulado por Área', path: '/enamed?area=true', matchPaths: ['/enamed?area'] },
      { icon: 'style', label: 'Flashcards', path: '/flashcards' },
    ],
  },
  { icon: 'library_books', label: 'Biblioteca', path: '/library' },
  { icon: 'science', label: 'Curadoria Científica', path: '/scientific-studio' },
];

const DashboardLayout = ({ children, mainClassName, hideFooter }: DashboardLayoutProps) => {
  const { user, signOut } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const isFreeUser = !hasAccess && !isAdmin;
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Estudante';
  const userInitial = userName.charAt(0).toUpperCase();

  // Phone prompt for users without phone
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneSaving, setPhoneSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Check localStorage to persist across browser sessions
    if (localStorage.getItem('preceptor_phone_ok') === user.id) return;
    // Also check user_metadata — if phone already exists there, skip
    if (user.user_metadata?.phone) {
      localStorage.setItem('preceptor_phone_ok', user.id);
      return;
    }

    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('phone')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data?.phone) {
        localStorage.setItem('preceptor_phone_ok', user.id);
      } else {
        setShowPhonePrompt(true);
      }
    })();
  }, [user]);

  const handlePhoneSubmit = useCallback(async () => {
    if (!phoneInput.trim() || !user) return;
    setPhoneSaving(true);
    await supabase.auth.updateUser({ data: { phone: phoneInput.trim() } });
    await supabase.from('profiles').update({ phone: phoneInput.trim() }).eq('user_id', user.id);
    localStorage.setItem('preceptor_phone_ok', user.id);
    setShowPhonePrompt(false);
    setPhoneSaving(false);
  }, [phoneInput, user]);

  // Auto-expand submenu if currently on a child route
  useEffect(() => {
    sidebarNavItems.forEach(item => {
      if (item.children && checkActive(item)) {
        setExpandedMenu(item.path);
      }
    });
  }, [location.pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  const checkActive = (item: { path: string; matchPaths?: string[] }) => {
    if (item.matchPaths) {
      return item.matchPaths.some(p => location.pathname.startsWith(p));
    }
    return location.pathname === item.path;
  };

  const checkChildActive = (child: { path: string; matchPaths?: string[] }) => {
    const childUrl = new URL(child.path, 'http://x');
    const currentSearch = location.search;
    if (child.matchPaths) {
      return child.matchPaths.some(p => (location.pathname + location.search).includes(p));
    }
    if (childUrl.search) {
      return location.pathname === childUrl.pathname && currentSearch === childUrl.search;
    }
    return location.pathname === childUrl.pathname && !currentSearch;
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-6 mb-10">
        <button onClick={() => navigate('/menu')} className="group flex items-center gap-2.5">
          <img
            src="/favicon.png"
            alt="PreceptorMED"
            className="h-9 w-9 transition-opacity group-hover:opacity-80 brightness-0 invert"
          />
          <span className="font-['Manrope'] font-extrabold text-white text-lg tracking-tight transition-opacity group-hover:opacity-80">
            PreceptorMED
          </span>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-4">
        {sidebarNavItems.map((item) => {
          const active = checkActive(item);
          const hasChildren = !!item.children;
          const isExpanded = expandedMenu === item.path;

          return (
            <div key={item.path}>
              <button
                onClick={() => {
                  if (hasChildren) {
                    setExpandedMenu(isExpanded ? null : item.path);
                  } else {
                    navigate(item.path);
                  }
                }}
                className={`relative w-full flex items-center gap-3 py-3 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'text-white bg-white/15'
                    : 'text-white/70 hover:text-white hover:bg-white/10 hover:translate-x-0.5'
                }`}
              >
                {active && !hasChildren && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                )}
                <MI name={item.icon} fill={active} className="text-[22px]" />
                <span className="flex-1 text-left">{item.label}</span>
                {hasChildren && (
                  <MI
                    name="expand_more"
                    className={`text-[20px] text-white/50 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                )}
              </button>

              {/* Submenu */}
              {hasChildren && (
                <div
                  className="overflow-hidden transition-all duration-250 ease-in-out"
                  style={{
                    maxHeight: isExpanded ? `${(item.children!.length) * 42}px` : '0px',
                    opacity: isExpanded ? 1 : 0,
                  }}
                >
                  <div className="ml-4 pl-4 border-l border-white/10 py-1 space-y-0.5">
                    {item.children!.map((child) => {
                      const childActive = checkChildActive(child);
                      return (
                        <button
                          key={child.path}
                          onClick={() => navigate(child.path)}
                          className={`w-full flex items-center gap-2.5 py-2 px-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                            childActive
                              ? 'text-white bg-white/12'
                              : 'text-white/55 hover:text-white hover:bg-white/8'
                          }`}
                        >
                          <MI name={child.icon} fill={childActive} className="text-[18px]" />
                          <span>{child.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

      </nav>

      {/* Bottom section */}
      <div className="mt-auto pt-6 border-t border-white/15 px-4">
        {/* PRO Plan card */}
        {isFreeUser && !subLoading && (
          <div className="mb-5 px-3 py-4 rounded-xl bg-white/10 border border-white/10">
            <p className="text-xs font-bold text-white mb-1 uppercase tracking-wider">Upgrade to Pro</p>
            <p className="text-[10px] text-white/60 mb-3">Acesse resumos ilimitados e casos avançados.</p>
            <button
              onClick={() => navigate('/pricing')}
              className="btn-shimmer relative overflow-hidden w-full text-[10px] font-bold uppercase tracking-wider text-[#005344] bg-white py-2.5 rounded-lg hover:bg-white/90 transition-all active:scale-95"
            >
              Assinar
            </button>
          </div>
        )}

        {/* User profile — clickable to /profile */}
        <button
          onClick={() => navigate('/profile')}
          className="w-full flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-white/10 transition-all duration-200 group"
        >
          <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-sm shrink-0 group-hover:bg-white/30 transition-colors">
            {userInitial}
          </div>
          <div className="overflow-hidden text-left">
            <p className="text-sm font-bold text-white truncate">{userName}</p>
            <p className="text-[10px] text-white/50 truncate">{isFreeUser ? 'Plano Gratuito' : 'Plano PRO'}</p>
          </div>
          <MI name="chevron_right" className="text-[18px] text-white/40 ml-auto group-hover:text-white/70 group-hover:translate-x-0.5 transition-all" />
        </button>

        {/* Gamification stats */}
        <GamificationWidget variant="sidebar" />

        {/* Help & Logout */}
        <div className="mt-3 space-y-1 mb-2">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-support-widget'))}
            className="w-full text-white/60 text-xs font-medium flex items-center gap-2 py-2 px-3 rounded-lg hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer text-left"
          >
            <MI name="help" className="text-[18px]" />
            <span>Suporte</span>
          </button>
          <button
            onClick={signOut}
            className="w-full text-white/60 text-xs font-medium flex items-center gap-2 py-2 px-3 rounded-lg hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
          >
            <MI name="logout" className="text-[18px]" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#191c1d] antialiased font-['DM_Sans']">

      {/* Sidebar — Desktop */}
      <aside className="hidden lg:flex flex-col h-screen w-64 fixed left-0 top-0 z-40 py-8" style={{ background: 'linear-gradient(180deg, #003d32 0%, #005344 40%, #004a3c 100%)' }}>
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 shadow-2xl flex flex-col py-8 animate-slide-in-left" style={{ background: 'linear-gradient(180deg, #003d32 0%, #005344 40%, #004a3c 100%)' }}>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Content area (right of sidebar) */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-xl shadow-[0_4px_20px_rgba(25,28,29,0.06)] flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 -ml-2 hover:bg-slate-50 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5 text-slate-600" /> : <Menu className="h-5 w-5 text-slate-600" />}
            </button>
            <img src="/logo-new.png" alt="PreceptorMED" className="h-8 w-auto" />
          </div>
          <button onClick={() => navigate('/profile')} className="w-8 h-8 rounded-full bg-[#006D5B] text-white flex items-center justify-center font-bold text-xs">
            {userInitial}
          </button>
        </header>

        {/* Main */}
        <main className={`flex-1 ${mainClassName ?? "p-6 sm:p-10 max-w-7xl mx-auto w-full"}`}>
          <div className="flex-1 flex flex-col min-h-0">
            {children}
          </div>
        </main>

        {/* Footer — always at bottom */}
        {!hideFooter && (
          <footer className="bg-white border-t border-slate-100 py-4">
            <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-xs text-slate-400 font-medium">© {new Date().getFullYear()} PreceptorMED</span>
              <div className="flex gap-6">
                {['Termos de Uso', 'Privacidade', 'Suporte'].map((label) => (
                  <button key={label} className="text-xs text-slate-400 hover:text-[#006D5B] transition-colors duration-200">{label}</button>
                ))}
              </div>
            </div>
          </footer>
        )}
      </div>

      {/* Phone prompt modal */}
      {showPhonePrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-5 animate-fade-up">
            <div className="text-center space-y-2">
              <div className="inline-flex rounded-full bg-[#006D5B]/10 p-3 mb-1">
                <MI name="phone_iphone" fill className="text-[28px] text-[#006D5B]" />
              </div>
              <h2 className="text-xl font-bold text-[#191c1d]">Atualize seu telefone</h2>
              <p className="text-sm text-[#3e4945]/70 leading-relaxed">
                Para melhorar sua experiência e suporte, precisamos do seu número de WhatsApp.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#191c1d]">Telefone (WhatsApp)</label>
              <input
                type="tel"
                placeholder="(11) 99999-9999"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-[#006D5B] focus:ring-1 focus:ring-[#006D5B]/20 transition-colors"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter' && phoneInput.trim()) handlePhoneSubmit(); }}
              />
            </div>
            <button
              onClick={handlePhoneSubmit}
              disabled={!phoneInput.trim() || phoneSaving}
              className="w-full h-11 rounded-xl bg-[#006D5B] text-white font-semibold text-sm hover:bg-[#005344] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {phoneSaving ? <><Loader2 className="h-4 w-4 animate-spin" />Salvando...</> : 'Continuar'}
            </button>
          </div>
        </div>
      )}

      {/* Support widget + NPS modal (self-controlled; only render for authenticated users) */}
      <SupportWidget />
      <NpsModal />
    </div>
  );
};

export default DashboardLayout;
