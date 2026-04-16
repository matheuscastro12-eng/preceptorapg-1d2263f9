import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useVisitorTracking } from '@/hooks/useVisitorTracking';
import { Menu, X as XIcon } from 'lucide-react';
import { getEasyflowLink } from '@/utils/easyflow';
import ProfileDropdown from '@/components/ProfileDropdown';
import PixPaymentModal from '@/components/PixPaymentModal';
import logoIcon from '@/assets/logo-icon.png';
import { Loader2 } from 'lucide-react';

const MI = ({ name, fill = false, className = '' }: { name: string; fill?: boolean; className?: string }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{ fontVariationSettings: fill ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : undefined }}
  >
    {name}
  </span>
);

const Landing = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [pixModal, setPixModal] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  // CRM: Track visitor + capture UTM params
  useVisitorTracking();

  // Redirect logged-in users to menu
  if (!loading && user) {
    navigate('/menu', { replace: true });
    return null;
  }

  const handleSubscribe = (planType: 'monthly' | 'annual' | 'biannual') => {
    if (!user) {
      // Not logged in — send to signup first, then checkout opens after
      navigate(`/auth?tab=signup&plan=${planType}`);
      return;
    }
    const link = getEasyflowLink(planType, user.email ?? undefined);
    if (link) {
      window.open(link, '_blank');
    } else {
      toast({ title: 'Em breve', description: 'Plano bianual estará disponível em breve.' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col" style={{ fontFamily: 'var(--font-body)' }}>

      {/* ─── Header ───────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200/60">
        {/* Accent line — gold assinatura (mesma linguagem do sidebar + auth) */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-brand-gold/30 to-transparent" />

        <nav className="flex justify-between items-center w-full px-4 sm:px-6 md:px-10 py-3 sm:py-4 max-w-7xl mx-auto">
          {/* Logo + eyebrow */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 group"
          >
            <img
              src={logoIcon}
              alt="PreceptorMED"
              className="h-8 w-8 sm:h-9 sm:w-9 transition-transform group-hover:scale-105"
            />
            <div className="flex flex-col leading-none">
              <span
                className="text-base sm:text-lg font-bold text-brand-ink tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                PreceptorMED
              </span>
              <span className="hidden sm:inline-block text-[9px] font-semibold text-brand-gold/80 uppercase tracking-[0.16em] mt-1">
                Curadoria acadêmica
              </span>
            </div>
          </button>

          {/* Nav links — compact, gap separators */}
          <div className="hidden md:flex items-center divide-x divide-slate-200/60">
            {[
              { href: '#como-funciona', label: 'Como funciona' },
              { href: '#recursos',      label: 'Recursos' },
              { href: '#depoimentos',   label: 'Depoimentos' },
              { href: '#precos',        label: 'Planos' },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="px-5 text-[13px] font-medium text-brand-ink-2 hover:text-brand-primary-dark transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Right cluster */}
          {!loading && user ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => navigate('/menu')}
                className="px-3 sm:px-4 py-2 text-sm font-semibold text-brand-ink-2 hover:text-brand-primary-dark transition-colors"
              >
                Meu painel
              </button>
              <ProfileDropdown userEmail={user.email || ''} onLogout={signOut} />
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => navigate('/auth')}
                className="hidden sm:block px-3 py-2 text-[13px] font-semibold text-brand-ink-2 hover:text-brand-primary-dark transition-colors"
              >
                Entrar
              </button>
              <button
                onClick={() => navigate('/auth?tab=signup')}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-brand-primary-dark text-white text-[13px] font-semibold rounded-md hover:bg-brand-primary-darker transition-colors"
              >
                Começar
                <span className="text-brand-gold">→</span>
              </button>
              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileMenu(!mobileMenu)}
                className="md:hidden p-2 text-brand-ink-2 hover:text-brand-primary-dark transition-colors -mr-2"
                aria-label="Menu"
              >
                {mobileMenu ? <XIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          )}
        </nav>

        {/* Mobile menu dropdown */}
        {mobileMenu && !user && (
          <div className="md:hidden border-t border-slate-200/60 bg-white px-4 py-4 space-y-1 animate-fade-in">
            {[
              { href: '#como-funciona', label: 'Como funciona' },
              { href: '#recursos',      label: 'Recursos' },
              { href: '#depoimentos',   label: 'Depoimentos' },
              { href: '#precos',        label: 'Planos' },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileMenu(false)}
                className="block py-2.5 text-sm font-medium text-brand-ink-2 hover:text-brand-primary-dark"
              >
                {l.label}
              </a>
            ))}
            <div className="pt-3 mt-2 border-t border-slate-200/60 flex gap-2">
              <button
                onClick={() => navigate('/auth')}
                className="flex-1 py-2.5 text-sm font-semibold text-brand-primary-dark hover:bg-brand-primary/5 rounded-md transition-colors"
              >
                Entrar
              </button>
              <button
                onClick={() => navigate('/auth?tab=signup')}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold text-white bg-brand-primary-dark hover:bg-brand-primary-darker rounded-md transition-colors"
              >
                Começar
                <span className="text-brand-gold">→</span>
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">

        {/* ─── Hero ─────────────────────────────────────── */}
        <section className="relative flex items-center min-h-[calc(100vh-65px)] py-12 sm:py-20 px-4 sm:px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center gap-10 sm:gap-16">
            <div className="lg:w-1/2 animate-fade-up">
              <p className="mb-5 sm:mb-7 text-[11px] sm:text-xs font-semibold text-brand-primary-dark uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-8 h-px bg-brand-gold" />
                Para estudantes de medicina brasileiros
              </p>
              <h1
                className="text-3xl sm:text-5xl md:text-6xl font-bold leading-[1.1] mb-5 sm:mb-7 tracking-tight text-brand-ink"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                Estudo clínico que acompanha seu <span className="text-brand-primary">raciocínio</span>.
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 sm:mb-10 max-w-xl">
                Resumos de PBL com fisiopatologia integrada, simulados ENAMED no padrão INEP e chat com busca automática no PubMed. Em português, para a formação médica brasileira.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => navigate('/auth?tab=signup')}
                  className="px-6 sm:px-8 py-3.5 bg-[#005344] text-white text-sm font-semibold rounded-lg hover:bg-[#003d32] active:scale-[0.98] transition-colors text-center"
                >
                  Começar agora
                </button>
                <button
                  onClick={() => document.getElementById('como-funciona')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-6 sm:px-8 py-3.5 text-[#191c1d] text-sm font-semibold hover:text-[#005344] transition-colors text-center"
                >
                  Ver como funciona →
                </button>
              </div>
            </div>

            <div className="lg:w-1/2 relative animate-fade-up w-full" style={{ animationDelay: '0.2s' }}>
              <div className="relative z-10 rounded-lg overflow-hidden border border-slate-200 shadow-lg">
                <video
                  src="/video-lp.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="block w-full h-auto"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── Recursos — dark block verde ──────────────────── */}
        <section
          id="recursos"
          className="relative py-16 sm:py-28 overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #003326 0%, #00473c 45%, #005344 100%)' }}
        >
          {/* Decorações sutis — gold glow + noise */}
          <div className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-brand-gold/10 blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-32 -left-16 w-[360px] h-[360px] rounded-full bg-brand-primary/30 blur-[100px] pointer-events-none" />
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }}
          />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
            <div className="mb-12 sm:mb-16 max-w-2xl">
              <p className="text-[11px] font-semibold text-brand-gold uppercase tracking-[0.2em] mb-4">
                O que você recebe
              </p>
              <h2
                className="text-2xl sm:text-4xl font-bold leading-tight text-white"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                Ferramentas construídas para a<br className="hidden sm:block" />
                {' '}prática médica <span className="text-brand-gold/90">brasileira</span>.
              </h2>
              <div className="mt-5 h-px w-16 bg-gradient-to-r from-brand-gold to-transparent" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/10 border border-white/10 rounded-lg overflow-hidden">
              {[
                {
                  title: 'Fechamentos de PBL',
                  desc: 'Resumos com correlação clínico-básica obrigatória: fisiopatologia em cascata, mecanismos moleculares e anatomia aplicada ao caso.',
                  meta: 'Gerado em ~20 segundos',
                },
                {
                  title: 'Simulados ENAMED · REVALIDA',
                  desc: 'Questões no padrão INEP com vinhetas clínicas extensas, laboratórios numéricos e distratores plausíveis. 5 áreas cobertas.',
                  meta: 'Padrão INEP 2011–2025',
                },
                {
                  title: 'Chat com PubMed integrado',
                  desc: 'IA busca artigos na PubMed, resume em português e cita fontes inline. Não é busca cega. É síntese com evidência.',
                  meta: 'Gemini 2.5 + E-utilities',
                },
                {
                  title: 'Flashcards com SM-2',
                  desc: 'Repetição espaçada real (SuperMemo 2). Intervalos ajustam pela sua performance, sem fake streaks.',
                  meta: 'Algoritmo real, não gamificado',
                },
                {
                  title: 'Mentor Científico',
                  desc: 'Revisão de TCC e artigos com validação ABNT e coerência metodológica. Cada seção avaliada independentemente.',
                  meta: 'Estruturado em 7 seções',
                },
                {
                  title: 'Biblioteca pessoal',
                  desc: 'Todos os resumos, questões e flashcards ficam salvos e pesquisáveis. Exporte em PDF com formatação preservada.',
                  meta: 'Exportação PDF nativa',
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="relative bg-brand-primary-darker/80 hover:bg-brand-primary-dark/80 transition-colors p-6 sm:p-8 group"
                >
                  {/* Numbering sutil */}
                  <span className="absolute top-5 right-6 text-[11px] font-bold text-white/20 tabular-nums">
                    0{i + 1}
                  </span>
                  <h3
                    className="text-lg font-bold mb-2 text-white tracking-tight"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-sm text-white/70 leading-relaxed mb-4">{feature.desc}</p>
                  <p className="text-xs text-brand-gold font-semibold flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-brand-gold/60" />
                    {feature.meta}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Como funciona — Exemplo real ──────────────── */}
        <section id="como-funciona" className="relative py-16 sm:py-28 bg-white overflow-hidden">
          {/* Gold accent — assinatura sutil no topo */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-gold/30 to-transparent" />
          {/* Green wash decorativo canto */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-primary/5 blur-3xl pointer-events-none" />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
            <div className="mb-12 sm:mb-16 max-w-2xl">
              <p className="text-[11px] font-semibold text-brand-primary-dark uppercase tracking-[0.2em] mb-4">
                Exemplo real da plataforma
              </p>
              <h2
                className="text-2xl sm:text-4xl font-bold leading-tight text-brand-ink"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                Questões ENAMED no padrão INEP,<br className="hidden sm:block" />
                {' '}geradas <span className="text-brand-primary">sob demanda</span>.
              </h2>
              <p className="text-base text-slate-600 leading-relaxed mt-4">
                Vinhetas clínicas extensas, laboratórios com valores numéricos e distratores plausíveis — calibrados na distribuição histórica INEP 2011–2025.
              </p>
            </div>

            <div className="grid grid-cols-12 gap-6 lg:gap-10">
              {/* Questão real */}
              <div className="col-span-12 lg:col-span-7">
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200">
                    <span className="text-xs font-semibold text-slate-600">Clínica Médica · Nefrologia</span>
                    <span className="text-[10px] px-2 py-0.5 bg-[#005344] text-white font-semibold rounded">Alta dificuldade</span>
                  </div>
                  <div className="p-5 sm:p-7">
                    <p className="text-sm sm:text-[15px] text-slate-700 leading-relaxed mb-5">
                      Mulher de 58 anos, hipertensa e diabética há 12 anos, em uso irregular de losartana e metformina, comparece ao ambulatório com queixa de edema progressivo em membros inferiores há 3 semanas. Ao exame: PA 168/102 mmHg, edema ++/4+ simétrico até joelhos. Exames: creatinina 2,1 mg/dL (prévia 1,3 há 8 meses), ureia 78 mg/dL, albumina 2,8 g/dL, proteinúria de 24h 4,2 g, sedimento urinário com cilindros hialinos e granulosos, sem hematúria dismórfica.
                    </p>
                    <p className="text-sm font-semibold text-[#191c1d] mb-3">Qual a conduta mais apropriada?</p>
                    <div className="space-y-2 text-sm">
                      {[
                        { l: 'A', t: 'Iniciar corticoterapia em dose imunossupressora e solicitar biópsia renal de urgência.' },
                        { l: 'B', t: 'Suspender losartana, iniciar furosemida e manter controle pressórico com anlodipino.' },
                        { l: 'C', t: 'Otimizar bloqueio do SRAA, adicionar iSGLT2 e intensificar controle glicêmico e pressórico.', correct: true },
                        { l: 'D', t: 'Encaminhar para hemodiálise de início programado pelo estágio de doença renal crônica.' },
                      ].map(({ l, t, correct }) => (
                        <div
                          key={l}
                          className={`flex gap-3 p-3 rounded border ${
                            correct ? 'border-[#006D5B] bg-[#006D5B]/5' : 'border-slate-150 bg-white'
                          }`}
                        >
                          <span className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                            correct ? 'bg-[#006D5B] text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {l}
                          </span>
                          <span className={correct ? 'text-[#005344] font-medium' : 'text-slate-600'}>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-3 italic">
                  Uma de milhares de questões no padrão ENAMED/REVALIDA disponíveis na plataforma.
                </p>
              </div>

              {/* Pilares */}
              <div className="col-span-12 lg:col-span-5 space-y-7">
                <div className="border-l-2 border-[#006D5B] pl-5">
                  <h4
                    className="text-base font-bold mb-1.5 text-[#191c1d]"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    Resumos de PBL
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Fechamentos acadêmicos com correlação clínico-básica: fisiopatologia em cascata, mecanismos moleculares e anatomia aplicada.
                  </p>
                </div>

                <div className="border-l-2 border-slate-200 pl-5">
                  <h4
                    className="text-base font-bold mb-1.5 text-[#191c1d]"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    Chat com PubMed
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    IA acadêmica que busca, resume e cita artigos do PubMed em português — respostas baseadas em evidência, não em achismo.
                  </p>
                </div>

                <div className="border-l-2 border-slate-200 pl-5">
                  <h4
                    className="text-base font-bold mb-1.5 text-[#191c1d]"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    Flashcards com SM-2
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Repetição espaçada real, baseada no algoritmo SuperMemo. Questões e cards voltam quando você está prestes a esquecer.
                  </p>
                </div>

                <div className="border-l-2 border-slate-200 pl-5">
                  <h4
                    className="text-base font-bold mb-1.5 text-[#191c1d]"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    Mentor Científico
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Revisão estruturada de TCC e artigos: valida metodologia, ABNT e coerência de cada seção independentemente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Exemplo real — Resumo de PBL ──────────────── */}
        <section className="py-16 sm:py-28 bg-[#fafbfa] border-t border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="mb-12 sm:mb-16 max-w-2xl">
              <p className="text-sm text-[#006D5B] font-semibold mb-3">Exemplo real da plataforma</p>
              <h2
                className="text-2xl sm:text-4xl font-bold leading-tight text-[#191c1d]"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                Resumos de PBL com correlação clínico-básica, gerados em segundos.
              </h2>
              <p className="text-base text-slate-600 leading-relaxed mt-4">
                Não é "resumo de slides". Fisiopatologia em cascata, mecanismos moleculares e anatomia aplicada ao caso — no padrão do fechamento acadêmico que o PBL exige.
              </p>
            </div>

            <div className="grid grid-cols-12 gap-6 lg:gap-10">
              {/* Resumo real */}
              <div className="col-span-12 lg:col-span-8">
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200">
                    <span className="text-xs font-semibold text-slate-600">Endocrinologia · Emergência</span>
                    <span className="text-[10px] px-2 py-0.5 bg-[#005344] text-white font-semibold rounded">Gerado em 18s</span>
                  </div>
                  <div className="p-5 sm:p-7 space-y-5">
                    <div>
                      <h3
                        className="text-lg sm:text-xl font-bold text-[#191c1d] mb-1"
                        style={{ fontFamily: "'Manrope', sans-serif" }}
                      >
                        Cetoacidose Diabética (CAD)
                      </h3>
                      <p className="text-xs text-slate-500">Objetivo de aprendizagem · Fisiopatologia, diagnóstico e manejo inicial</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#005344] mb-2 uppercase tracking-wide">Fisiopatologia em cascata</h4>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        A deficiência absoluta ou relativa de <span className="font-semibold">insulina</span>, somada ao excesso de hormônios contrarreguladores (<span className="font-semibold">glucagon, cortisol, catecolaminas, GH</span>), desencadeia três vias simultâneas: (1) glicogenólise e gliconeogênese hepática → hiperglicemia; (2) lipólise em tecido adiposo → liberação de ácidos graxos livres → β-oxidação hepática → produção de corpos cetônicos (β-hidroxibutirato, acetoacetato); (3) proteólise muscular. A cetogênese é mediada pela ativação da <span className="font-semibold">CPT-1</span> (carnitina-palmitoil-transferase 1), normalmente inibida por malonil-CoA — que cai na ausência de insulina.
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#005344] mb-2 uppercase tracking-wide">Correlação clínico-básica</h4>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        A <span className="font-semibold">respiração de Kussmaul</span> (taquipneia profunda) é compensação respiratória à acidose metabólica — o centro bulbar responde à queda do pH arterial estimulando os quimiorreceptores periféricos. A <span className="font-semibold">dor abdominal</span> em CAD correlaciona com grau de acidose (pH &lt; 7,10 em 80% dos casos com dor), por irritação do plexo celíaco pelos cetoácidos circulantes. O <span className="font-semibold">hálito cetônico</span> reflete eliminação pulmonar de acetona volátil.
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#005344] mb-2 uppercase tracking-wide">Critérios diagnósticos (ADA 2024)</h4>
                      <ul className="text-sm text-slate-700 leading-relaxed space-y-1 list-disc list-inside">
                        <li>Glicemia &gt; 250 mg/dL (pode ser normal em <em>CAD euglicêmica</em> — uso de iSGLT2)</li>
                        <li>pH arterial &lt; 7,30 <span className="text-slate-500">ou</span> HCO₃⁻ &lt; 18 mEq/L</li>
                        <li>Cetonemia / cetonúria positiva (β-hidroxibutirato &gt; 3 mmol/L)</li>
                        <li>Anion gap &gt; 10–12 mEq/L</li>
                      </ul>
                    </div>

                    <div className="relative">
                      <h4 className="text-sm font-bold text-[#005344] mb-2 uppercase tracking-wide">Manejo inicial — primeiras 4 horas</h4>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        Prioridade em ordem: (1) <span className="font-semibold">reposição volêmica</span> com SF 0,9% 15–20 mL/kg na 1ª hora, reavaliando perfusão; (2) <span className="font-semibold">potássio</span> antes da insulina se K⁺ &lt; 3,3 mEq/L (insulina causa shift intracelular, risco de arritmia); (3) <span className="font-semibold">insulina regular</span> 0,1 U/kg/h em infusão contínua, meta de redução de glicemia 50–75 mg/dL/h;
                      </p>
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-3 italic">
                  Resumo com estrutura completa inclui ainda diagnóstico diferencial, complicações e referências Harrison/Goldman-Cecil.
                </p>
              </div>

              {/* O que difere */}
              <div className="col-span-12 lg:col-span-4 space-y-7">
                <div>
                  <p className="text-sm text-[#006D5B] font-semibold mb-4">O que faz diferente</p>
                </div>

                <div className="border-l-2 border-[#006D5B] pl-5">
                  <h4
                    className="text-base font-bold mb-1.5 text-[#191c1d]"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    Mecanismos moleculares
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Receptores, cascatas de sinalização e enzimas com nome — não só "aumenta insulina".
                  </p>
                </div>

                <div className="border-l-2 border-[#006D5B] pl-5">
                  <h4
                    className="text-base font-bold mb-1.5 text-[#191c1d]"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    Cada sintoma explicado
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Kussmaul, hálito cetônico, dor abdominal — cada sinal ligado ao mecanismo que o produz.
                  </p>
                </div>

                <div className="border-l-2 border-[#006D5B] pl-5">
                  <h4
                    className="text-base font-bold mb-1.5 text-[#191c1d]"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    Valores numéricos reais
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Cut-offs, doses, metas. ADA 2024, não "nível elevado". Pronto para prova e enfermaria.
                  </p>
                </div>

                <div className="border-l-2 border-[#006D5B] pl-5">
                  <h4
                    className="text-base font-bold mb-1.5 text-[#191c1d]"
                    style={{ fontFamily: "'Manrope', sans-serif" }}
                  >
                    Terminologia técnica
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Dispneia, cetogênese, anion gap — linguagem de médico, não leiga.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Depoimentos — dark green ─────────────────── */}
        <section
          id="depoimentos"
          className="relative py-16 sm:py-28 overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #003326 0%, #00473c 45%, #005344 100%)' }}
        >
          {/* Decorações sutis */}
          <div className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-brand-gold/10 blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-32 -left-16 w-[360px] h-[360px] rounded-full bg-brand-primary/30 blur-[100px] pointer-events-none" />
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }}
          />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
            <div className="mb-12 sm:mb-16 max-w-2xl">
              <p className="text-[11px] font-semibold text-brand-gold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <span className="w-8 h-px bg-brand-gold" />
                Depoimentos
              </p>
              <h2
                className="text-2xl sm:text-4xl font-bold leading-tight text-white"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                Estudantes que já usam<br className="hidden sm:block" />
                {' '}<span className="text-brand-gold/90">no dia a dia</span>.
              </h2>
              <div className="mt-5 h-px w-16 bg-gradient-to-r from-brand-gold to-transparent" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-10 divide-y divide-white/10 md:divide-y-0 [&>article]:pt-10 md:[&>article]:pt-0 first:[&>article]:pt-0">
              {/* Depoimento 1 — Alicia */}
              <article className="flex flex-col">
                <p className="text-[15px] text-white/85 leading-relaxed mb-6">
                  A plataforma PreceptorMED é uma ferramenta fantástica para o auxílio nos estudos. Os resumos são bem estruturados e direcionados para os objetivos de aprendizagem do tema, além de que as fontes utilizadas são sempre relevantes. Particularmente, minha função preferida é a de geração de questões com base nos conteúdos, o que ajuda a reforçar os conhecimentos.
                </p>
                <div className="flex items-center gap-3 mt-auto pt-6 border-t border-white/10">
                  <img
                    src="/alicia-cosendey.jpg"
                    alt="Alicia Cosendey"
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement | null;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div
                    className="w-10 h-10 rounded-full bg-brand-gold/20 border border-brand-gold/30 items-center justify-center text-brand-gold font-semibold text-xs"
                    style={{ display: 'none' }}
                  >
                    AC
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>
                      Alicia Cosendey
                    </p>
                    <p className="text-xs text-white/55">Estudante de Medicina</p>
                  </div>
                </div>
              </article>

              {/* Depoimento 2 — João */}
              <article className="flex flex-col">
                <p className="text-[15px] text-white/85 leading-relaxed mb-6">
                  Eu não tenho dúvidas que o PreceptorMED é o futuro da medicina. As respostas oferecidas pela IA são de longe as mais detalhadas. Não somente isso, a plataforma sempre utiliza referências nas quais eu confio. Me surpreende também a constante expansão das ferramentas, que além de me ajudar nos estudos, também me auxilia na realização de trabalhos científicos.
                  <br /><br />
                  <span className="font-semibold text-brand-gold">Se você tiver a oportunidade de assinar, assine.</span>
                </p>
                <div className="flex items-center gap-3 mt-auto pt-6 border-t border-white/10">
                  <div className="w-10 h-10 rounded-full bg-brand-gold/20 border border-brand-gold/30 flex items-center justify-center text-brand-gold font-semibold text-xs">
                    JM
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>
                      João Miyake
                    </p>
                    <p className="text-xs text-white/55">Estudante de Medicina</p>
                  </div>
                </div>
              </article>

              {/* Depoimento 3 — Matheus Milani */}
              <article className="flex flex-col">
                <p className="text-[15px] text-white/85 leading-relaxed mb-6">
                  Minha experiência com a plataforma tem sido extremamente positiva. Os conteúdos são organizados, objetivos e atualizados, com linguagem acessível e foco prático — ajudam tanto na revisão teórica quanto na preparação para provas e atendimentos clínicos.
                  <br /><br />
                  <span className="font-semibold text-brand-gold">O PreceptorMED se tornou uma ferramenta valiosa para minha formação médica.</span>
                </p>
                <div className="flex items-center gap-3 mt-auto pt-6 border-t border-white/10">
                  <img
                    src="/matheus-milani.jpg"
                    alt="Matheus Milani"
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement | null;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div
                    className="w-10 h-10 rounded-full bg-brand-gold/20 border border-brand-gold/30 items-center justify-center text-brand-gold font-semibold text-xs"
                    style={{ display: 'none' }}
                  >
                    MM
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>
                      Matheus Milani
                    </p>
                    <p className="text-xs text-white/55">Estudante de Medicina</p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ─── Pricing ──────────────────────────────────── */}
        <section id="precos" className="relative py-14 sm:py-24 bg-white overflow-hidden">
          {/* Gold line no topo da seção (assinatura) */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-gold/30 to-transparent" />
          {/* Green wash decorativo */}
          <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-brand-primary/[0.04] blur-3xl pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
            <div className="mb-12 sm:mb-16 max-w-2xl">
              <p className="text-[11px] font-semibold text-brand-primary-dark uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <span className="w-8 h-px bg-brand-gold" />
                Planos
              </p>
              <h2
                className="text-2xl sm:text-4xl font-bold leading-tight text-brand-ink"
                style={{ fontFamily: "'Manrope', sans-serif" }}
              >
                Preço único, sem trava <span className="text-brand-primary">de aulas extras</span>.
              </h2>
              <p className="text-base text-slate-600 leading-relaxed mt-4">
                Acesso completo à plataforma desde o primeiro dia. Cancele quando quiser.
              </p>
            </div>

            <div className="flex flex-col md:flex-row justify-center gap-4 sm:gap-8 max-w-5xl mx-auto">
              {/* Mensal */}
              <div className="flex-1 bg-white p-6 sm:p-10 rounded-2xl shadow-[0px_4px_20px_rgba(25,28,29,0.06)] border border-slate-200/30 hover:shadow-xl transition-all duration-300">
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-[#191c1d]" style={{ fontFamily: "'Manrope', sans-serif" }}>Plano Mensal</h3>
                <div className="mb-4 sm:mb-6">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#005344]">R$ 49,90</span>
                  <span className="text-slate-500">/mês</span>
                </div>
                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-10 text-sm text-[#191c1d]">
                  <li className="flex items-center gap-3">
                    <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                    Acesso completo à plataforma
                  </li>
                  <li className="flex items-center gap-3">
                    <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                    Resumos e simulados ilimitados
                  </li>
                  <li className="flex items-center gap-3">
                    <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                    Cancelamento a qualquer momento
                  </li>
                </ul>
                <button
                  onClick={() => handleSubscribe('monthly')}
                  disabled={loadingPlan !== null}
                  className="w-full py-3 sm:py-4 border border-slate-300 text-[#191c1d] text-sm font-semibold rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                >
                  {loadingPlan === 'monthly' && <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />}
                  Começar mensal
                </button>
              </div>

              {/* Anual — highlighted */}
              <div className="flex-1 bg-white p-6 sm:p-10 rounded-2xl shadow-xl border-2 border-brand-primary relative overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="absolute top-0 right-0 bg-brand-primary-dark text-white px-3 sm:px-4 py-1 text-[10px] font-bold uppercase tracking-wider rounded-bl-lg">
                  Mais Popular
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-3 text-[#191c1d]" style={{ fontFamily: "'Manrope', sans-serif" }}>Plano Anual</h3>
                <div className="mb-1">
                  <span className="text-sm text-slate-400 line-through">De R$ 598,80</span>
                </div>
                <div className="mb-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#005344]">R$ 350,90</span>
                  <span className="text-slate-500">/ano</span>
                </div>
                <p className="text-xs text-[#006D5B] font-semibold mb-6">Equivale a R$ 29,24/mês — Economia de 41%</p>
                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-10 text-sm text-[#191c1d]">
                  <li className="flex items-center gap-3 font-semibold">
                    <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                    Tudo do plano mensal
                  </li>
                  <li className="flex items-center gap-3">
                    <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                    Faça parte do grupo VIP
                  </li>
                  <li className="flex items-center gap-3">
                    <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                    Suporte prioritário
                  </li>
                  <li className="flex items-center gap-3">
                    <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                    Receba atualizações em primeira mão
                  </li>
                  <li className="flex items-center gap-3">
                    <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                    Oportunidade de se tornar embaixador
                  </li>
                </ul>
                <button
                  onClick={() => handleSubscribe('annual')}
                  disabled={loadingPlan !== null}
                  className="btn-shimmer relative overflow-hidden w-full py-3 sm:py-4 bg-[#005344] text-white text-sm font-semibold rounded-lg shadow-lg hover:bg-[#003d32] transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                >
                  {loadingPlan === 'annual' && <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />}
                  Começar anual
                </button>
              </div>

              {/* Bianual */}
              <div className="flex-1 bg-white p-6 sm:p-10 rounded-2xl shadow-[0px_4px_20px_rgba(25,28,29,0.06)] border border-slate-200/30 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-brand-gold text-white px-3 sm:px-4 py-1 text-[10px] font-bold uppercase tracking-wider rounded-bl-lg">
                  Maior Economia
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-3 text-[#191c1d]" style={{ fontFamily: "'Manrope', sans-serif" }}>Plano Bianual</h3>
                <div className="mb-1">
                  <span className="text-sm text-slate-400 line-through">De R$ 1.197,60</span>
                </div>
                <div className="mb-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#005344]">R$ 599,90</span>
                  <span className="text-slate-500">/2 anos</span>
                </div>
                <p className="text-xs text-[#006D5B] font-semibold mb-6">Equivale a R$ 24,99/mês — Economia de 50%</p>
                <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-10 text-sm text-[#191c1d]">
                  <li className="flex items-center gap-3 font-semibold">
                    <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                    Tudo do plano anual
                  </li>
                  <li className="flex items-center gap-3">
                    <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                    Maior economia possível
                  </li>
                  <li className="flex items-center gap-3">
                    <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                    Suporte prioritário VIP
                  </li>
                  <li className="flex items-center gap-3">
                    <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                    Acesso antecipado a novos recursos
                  </li>
                  <li className="flex items-center gap-3">
                    <MI name="check_circle" fill className="text-[#006D5B] text-lg" />
                    Seja embaixador PreceptorMED
                  </li>
                </ul>
                <button
                  onClick={() => handleSubscribe('biannual')}
                  disabled={loadingPlan !== null}
                  className="w-full py-3 sm:py-4 border-2 border-[#005344] text-[#005344] text-sm font-semibold rounded-lg hover:bg-[#005344] hover:text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                >
                  {loadingPlan === 'biannual' && <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />}
                  Começar bianual
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Final CTA ────────────────────────────────── */}
        <section
          className="relative py-16 sm:py-24 overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #003326 0%, #00473c 45%, #005344 100%)' }}
        >
          {/* Decorações sutis — mesma linguagem de Recursos e Depoimentos */}
          <div className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-brand-gold/10 blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-32 -left-16 w-[360px] h-[360px] rounded-full bg-brand-primary/30 blur-[100px] pointer-events-none" />
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '28px 28px',
            }}
          />

          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-[11px] font-semibold text-brand-gold uppercase tracking-[0.2em] mb-5 inline-flex items-center gap-2">
              <span className="w-8 h-px bg-brand-gold" />
              Pronto para começar
              <span className="w-8 h-px bg-brand-gold" />
            </p>
            <h2
              className="text-2xl sm:text-4xl font-bold mb-5 tracking-tight text-white"
              style={{ fontFamily: "'Manrope', sans-serif" }}
            >
              Comece seu próximo ciclo de PBL<br className="hidden sm:block" />
              {' '}com o <span className="text-brand-gold/90">PreceptorMED</span>.
            </h2>
            <p className="text-base sm:text-lg text-white/70 mb-8 sm:mb-10 leading-relaxed max-w-xl mx-auto">
              Criar conta é gratuito. Assine quando perceber que economiza horas por semana.
            </p>
            <button
              onClick={() => navigate('/auth?tab=signup')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-primary-dark rounded-lg text-sm font-semibold hover:bg-slate-50 active:scale-[0.98] transition-colors shadow-[0_8px_24px_-8px_rgba(0,0,0,0.3)]"
            >
              Criar conta gratuita
              <span className="text-brand-gold">→</span>
            </button>
          </div>
        </section>
      </main>

      {/* ─── Footer ───────────────────────────────────── */}
      <footer className="bg-slate-50 border-t border-slate-200/50 py-8 sm:py-12 px-4 sm:px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:justify-between items-start w-full max-w-7xl mx-auto gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <img src={logoIcon} alt="PreceptorMED" className="h-6 w-6" />
              <span className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Manrope', sans-serif" }}>PreceptorMED</span>
            </div>
            <p className="max-w-xs text-sm text-slate-500">
              © {new Date().getFullYear()} PreceptorMED. Plataforma de estudo médico com IA.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h5 className="font-bold text-xs uppercase tracking-widest text-slate-900">Legal</h5>
              <ul className="space-y-2">
                <li><a className="text-sm text-slate-500 hover:text-slate-800 hover:translate-x-1 transition-all duration-200 block" href="#">Termos de Uso</a></li>
                <li><a className="text-sm text-slate-500 hover:text-slate-800 hover:translate-x-1 transition-all duration-200 block" href="#">Privacidade</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="font-bold text-xs uppercase tracking-widest text-slate-900">Empresa</h5>
              <ul className="space-y-2">
                <li><a className="text-sm text-slate-500 hover:text-slate-800 hover:translate-x-1 transition-all duration-200 block" href="https://instagram.com/preceptor.med" target="_blank" rel="noopener noreferrer">Instagram</a></li>
                <li><a className="text-sm text-slate-500 hover:text-slate-800 hover:translate-x-1 transition-all duration-200 block" href="mailto:preceptormed@gmail.com">Contato</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="font-bold text-xs uppercase tracking-widest text-slate-900">Ajuda</h5>
              <ul className="space-y-2">
                <li><a className="text-sm text-slate-500 hover:text-slate-800 hover:translate-x-1 transition-all duration-200 block" href="mailto:preceptormed@gmail.com">Suporte</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

      <PixPaymentModal
        open={pixModal}
        onClose={() => setPixModal(false)}
        planLabel="Plano Mensal"
        planPrice="R$ 49,90"
      />
    </div>
  );
};

export default Landing;
