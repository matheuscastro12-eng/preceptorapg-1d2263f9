import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import logoIcon from '@/assets/logo-icon.png';

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

const LegalLayout = ({ title, lastUpdated, children }: LegalLayoutProps) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src={logoIcon} alt="PreceptorMED" className="h-7 w-7" />
            <span className="text-lg font-bold text-slate-900" style={{ fontFamily: "'Manrope', sans-serif" }}>
              PreceptorMED
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#006D5B] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-8 pb-8 border-b border-slate-100">
          <h1
            className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3"
            style={{ fontFamily: "'Manrope', sans-serif" }}
          >
            {title}
          </h1>
          <p className="text-sm text-slate-500">Última atualização: {lastUpdated}</p>
        </div>

        <article
          className="prose prose-slate max-w-none
            prose-headings:font-bold prose-headings:text-slate-900
            prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2
            prose-p:text-slate-600 prose-p:leading-relaxed prose-p:text-[15px]
            prose-li:text-slate-600 prose-li:text-[15px]
            prose-strong:text-slate-900
            prose-a:text-[#006D5B] prose-a:no-underline hover:prose-a:underline"
          style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
        >
          {children}
        </article>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-100 text-sm text-slate-500">
          <p>
            Em caso de dúvidas, entre em contato pelo e-mail{' '}
            <a href="mailto:contato@thepreceptor.com.br" className="text-[#006D5B] hover:underline">
              contato@thepreceptor.com.br
            </a>
            .
          </p>
          <div className="mt-4 flex gap-4">
            <Link to="/termos" className="text-[#006D5B] hover:underline">
              Termos de Uso
            </Link>
            <Link to="/privacidade" className="text-[#006D5B] hover:underline">
              Política de Privacidade
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LegalLayout;
