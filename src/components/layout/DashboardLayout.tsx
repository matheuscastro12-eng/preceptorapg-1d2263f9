import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdmin } from '@/hooks/useAdmin';
import { Menu, X } from 'lucide-react';

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

const sidebarNavItems = [
  { icon: 'dashboard', label: 'Início', path: '/menu' },
  { icon: 'auto_awesome', label: 'Estudo com IA', path: '/dashboard' },
  { icon: 'shutter_speed', label: 'Simulações', path: '/exam', matchPaths: ['/exam', '/enamed', '/flashcards'] },
  { icon: 'library_books', label: 'Biblioteca', path: '/library' },
];

const DashboardLayout = ({ children, mainClassName, hideFooter }: DashboardLayoutProps) => {
  const { user, signOut } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isFreeUser = !hasAccess && !isAdmin;
  const userName = user?.email?.split('@')[0] || 'Estudante';
  const userInitial = userName.charAt(0).toUpperCase();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  const checkActive = (item: typeof sidebarNavItems[0]) => {
    if (item.matchPaths) {
      return item.matchPaths.some(p => location.pathname.startsWith(p));
    }
    return location.pathname === item.path;
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
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative w-full flex items-center gap-3 py-3 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                active
                  ? 'text-white bg-white/15'
                  : 'text-white/70 hover:text-white hover:bg-white/10 hover:translate-x-0.5'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
              )}
              <MI name={item.icon} fill={active} className="text-[22px]" />
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Admin — only for admin users */}
        {isAdmin && (
          <>
            <div className="my-3 border-t border-white/10" />
            <button
              onClick={() => navigate('/admin')}
              className={`relative w-full flex items-center gap-3 py-3 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                location.pathname === '/admin'
                  ? 'text-white bg-white/15'
                  : 'text-white/70 hover:text-white hover:bg-white/10 hover:translate-x-0.5'
              }`}
            >
              {location.pathname === '/admin' && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
              )}
              <MI name="admin_panel_settings" fill={location.pathname === '/admin'} className="text-[22px]" />
              <span>Painel Admin</span>
            </button>
          </>
        )}
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

        {/* Help & Logout */}
        <div className="mt-3 space-y-1 mb-2">
          <button className="w-full text-white/60 text-xs font-medium flex items-center gap-2 py-2 px-3 rounded-lg hover:text-white hover:bg-white/10 transition-all duration-200">
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
      <aside className="hidden lg:flex flex-col h-screen w-64 fixed left-0 top-0 z-40 py-8" style={{ background: 'linear-gradient(180deg, #005344 0%, #006d5b 100%)' }}>
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 shadow-2xl flex flex-col py-8 animate-slide-in-left" style={{ background: 'linear-gradient(180deg, #005344 0%, #006d5b 100%)' }}>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Content area (right of sidebar) */}
      <div className="lg:ml-64">
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
        <main className={mainClassName ?? "p-6 sm:p-10 max-w-7xl mx-auto"}>
          {children}
        </main>

        {/* Footer */}
        {!hideFooter && (
          <footer className="bg-white border-t border-slate-100 py-6">
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
    </div>
  );
};

export default DashboardLayout;
