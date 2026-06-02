interface DashboardLayoutProps {
  children: React.ReactNode;
  mainClassName?: string;
  hideFooter?: boolean;
}

/**
 * Conteúdo de uma página do app (apenas `<main>` + footer).
 *
 * A sidebar e todo o chrome agora vivem no `DashboardShell` (layout route),
 * que fica montado de forma persistente — então trocar de aba só troca este
 * conteúdo, sem remontar a tela inteira (era o que causava o flash branco).
 *
 * As páginas continuam usando `<DashboardLayout mainClassName=… hideFooter>`
 * exatamente como antes; este componente renderiza dentro do `<Outlet/>` do
 * shell. Mantemos os mesmos `mainClassName`/`hideFooter` por página.
 */
const DashboardLayout = ({ children, mainClassName, hideFooter }: DashboardLayoutProps) => (
  <>
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
            <a href="/termos" className="text-xs text-slate-400 hover:text-[#006D5B] transition-colors duration-200">Termos de Uso</a>
            <a href="/privacidade" className="text-xs text-slate-400 hover:text-[#006D5B] transition-colors duration-200">Privacidade</a>
            <a href="mailto:contato@thepreceptor.com.br" className="text-xs text-slate-400 hover:text-[#006D5B] transition-colors duration-200">Suporte</a>
          </div>
        </div>
      </footer>
    )}
  </>
);

export default DashboardLayout;
