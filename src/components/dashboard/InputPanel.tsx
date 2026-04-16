import GenerationProgress from '@/components/GenerationProgress';
import type { GenerationMode } from './ModeToggle';
import { Loader2, Sparkles, Send, BookOpen, Target, Layers } from 'lucide-react';
import logoIcon from '@/assets/logo-icon.png';

interface InputPanelProps {
  tema: string;
  setTema: (value: string) => void;
  objetivos: string;
  setObjetivos: (value: string) => void;
  modo: GenerationMode;
  setModo: (value: GenerationMode) => void;
  secoes: Record<string, boolean>;
  setSecoes: (value: Record<string, boolean>) => void;
  generating: boolean;
  hasStartedReceiving: boolean;
  isComplete: boolean;
  onGenerate: () => void;
  canGenerate?: boolean;
  cooldown?: boolean;
}

const MAX_TEMA_LENGTH = 500;
const MAX_OBJETIVOS_LENGTH = 2000;

// Estrutura das seções — agrupadas
const SECTION_GROUPS: {
  title: string;
  items: { key: string; label: string }[];
}[] = [
  {
    title: 'Bases morfofuncionais',
    items: [
      { key: 'anatomia', label: 'Anatomia' },
      { key: 'histologia', label: 'Histologia' },
      { key: 'fisiologia', label: 'Fisiologia' },
      { key: 'embriologia', label: 'Embriologia' },
      { key: 'revisao_geral', label: 'Revisão geral' },
    ],
  },
  {
    title: 'Conteúdo clínico',
    items: [
      { key: 'nosologia', label: 'Classificação / Nosologia' },
      { key: 'epidemiologia', label: 'Epidemiologia' },
      { key: 'etiologia', label: 'Etiologia' },
      { key: 'fisiopatologia', label: 'Fisiopatologia' },
      { key: 'manifestacoes', label: 'Manifestações clínicas' },
      { key: 'diagnostico_exames', label: 'Diagnóstico e exames' },
      { key: 'tratamento', label: 'Tratamento' },
      { key: 'prognostico', label: 'Prognóstico / Complicações' },
      { key: 'prevencao', label: 'Prevenção' },
    ],
  },
];

const InputPanel = ({
  tema, setTema, objetivos, setObjetivos,
  modo, setModo, secoes, setSecoes,
  generating, hasStartedReceiving,
  isComplete, onGenerate, canGenerate = true, cooldown = false,
}: InputPanelProps) => {
  // Força modo sempre 'fechamento' (seminário removido)
  if (modo !== 'fechamento') {
    setModo('fechamento');
  }

  const objetivosCount = objetivos
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean).length;

  const totalSecoes = SECTION_GROUPS.reduce((acc, g) => acc + g.items.length, 0);
  const secoesAtivas = SECTION_GROUPS.reduce((acc, g) => {
    return acc + g.items.filter(i => secoes[i.key]).length;
  }, 0);

  const toggleSecao = (key: string) => {
    setSecoes({ ...secoes, [key]: !secoes[key] });
  };

  const toggleGrupo = (groupItems: { key: string }[], ativar: boolean) => {
    const patch: Record<string, boolean> = {};
    groupItems.forEach(i => { patch[i.key] = ativar; });
    setSecoes({ ...secoes, ...patch });
  };

  return (
    // Wrapper com fundo verde sutil para destacar o form
    <div
      className="relative rounded-2xl sm:rounded-3xl p-1 sm:p-1.5 md:p-2"
      style={{
        background: 'linear-gradient(135deg, rgba(0, 109, 91, 0.25) 0%, rgba(0, 83, 68, 0.15) 50%, rgba(201, 168, 76, 0.15) 100%)',
      }}
    >
      {/* Form Card principal */}
      <div className="relative bg-white rounded-xl sm:rounded-[20px] md:rounded-[22px] overflow-hidden shadow-[0_8px_24px_-12px_rgba(0,109,91,0.2)] sm:shadow-[0_12px_40px_-12px_rgba(0,109,91,0.25)]">
        {/* Decorações sutis no canto */}
        <div className="absolute -top-12 -right-12 w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-brand-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-brand-gold/5 blur-3xl pointer-events-none" />

        <div className="relative p-5 sm:p-7 md:p-10 space-y-6 sm:space-y-7 md:space-y-8">
          {/* Cabeçalho interno do form */}
          <div className="flex items-center gap-3 pb-4 sm:pb-5 border-b border-slate-100">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
              <img src={logoIcon} alt="PreceptorMED" className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] sm:text-base font-bold text-brand-ink leading-tight">Gerar Resumo com IA</h3>
              <p className="text-xs text-brand-ink-2 leading-snug mt-0.5">Preencha e deixe a IA estruturar para você.</p>
            </div>
          </div>

          {/* Step 1: Tema */}
          <div data-tour="tema-input">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-primary text-white flex items-center justify-center text-sm font-bold shadow-sm">
                1
              </div>
              <div className="flex-1 min-w-0">
                <label className="flex items-center gap-2 text-[15px] font-bold text-brand-ink mb-0.5">
                  <BookOpen className="w-4 h-4 text-brand-primary" />
                  Qual tema você quer estudar?
                </label>
                <p className="text-xs text-brand-ink-2">Nome do assunto principal. Seja específico.</p>
              </div>
            </div>
            <input
              type="text"
              placeholder="Ex: Insuficiência Cardíaca Congestiva"
              value={tema}
              onChange={(e) => setTema(e.target.value.slice(0, MAX_TEMA_LENGTH))}
              disabled={generating}
              className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-brand-ink placeholder:text-slate-400 focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 focus:bg-white transition-all text-[15px] font-medium disabled:opacity-50"
            />

            {tema.length > MAX_TEMA_LENGTH * 0.8 && (
              <p className="text-[10px] text-brand-ink-2 text-right mt-1">{tema.length}/{MAX_TEMA_LENGTH}</p>
            )}
          </div>

          {/* Divisória sutil */}
          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          {/* Step 2: Objetivos */}
          <div data-tour="objetivos-input">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-primary text-white flex items-center justify-center text-sm font-bold shadow-sm">
                2
              </div>
              <div className="flex-1 min-w-0">
                <label className="flex items-center gap-2 text-[15px] font-bold text-brand-ink mb-0.5">
                  <Target className="w-4 h-4 text-brand-primary" />
                  Objetivos específicos
                  <span className="text-[10px] text-slate-400 font-medium">opcional</span>
                </label>
                <p className="text-xs text-brand-ink-2 leading-relaxed">
                  Cada linha vira uma seção própria no resumo. A IA usa o <span className="font-semibold text-brand-primary-dark">texto exato que você escrever</span> como título da seção.
                </p>
              </div>
            </div>
            <textarea
              placeholder={"Um objetivo por linha. Ex:\nAtividade laboral em IC\nCritérios de Framingham\nFármacos de 1ª linha"}
              value={objetivos}
              onChange={(e) => setObjetivos(e.target.value.slice(0, MAX_OBJETIVOS_LENGTH))}
              disabled={generating}
              rows={4}
              className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl text-brand-ink placeholder:text-slate-400 focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 focus:bg-white transition-all text-sm font-medium resize-none disabled:opacity-50"
            />
            {objetivosCount > 0 && (
              <p className="text-xs text-brand-primary-dark font-semibold mt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                {objetivosCount} {objetivosCount === 1 ? 'objetivo identificado' : 'objetivos identificados'}
              </p>
            )}
          </div>

          {/* Divisória sutil */}
          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          {/* Step 3: Seções do resumo */}
          <div>
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-primary text-white flex items-center justify-center text-sm font-bold shadow-sm">
                3
              </div>
              <div className="flex-1 min-w-0">
                <label className="flex items-center gap-2 text-[15px] font-bold text-brand-ink mb-0.5">
                  <Layers className="w-4 h-4 text-brand-primary" />
                  Seções do resumo
                  <span className="text-[10px] text-slate-400 font-medium">ative/desative</span>
                </label>
                <p className="text-xs text-brand-ink-2 leading-relaxed">
                  Escolha o que vai aparecer. Seções desmarcadas são omitidas.{' '}
                  <span className="font-semibold text-brand-primary-dark">{secoesAtivas}/{totalSecoes} ativas</span>
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {SECTION_GROUPS.map((grupo) => {
                const todasAtivas = grupo.items.every(i => secoes[i.key]);
                const nenhumaAtiva = grupo.items.every(i => !secoes[i.key]);
                return (
                  <div key={grupo.title} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-brand-ink-2 uppercase tracking-wide">{grupo.title}</h4>
                      <button
                        type="button"
                        onClick={() => toggleGrupo(grupo.items, !todasAtivas)}
                        disabled={generating}
                        className="text-[11px] font-semibold text-brand-primary hover:text-brand-primary-dark transition-colors disabled:opacity-40"
                      >
                        {todasAtivas ? 'Desmarcar todas' : nenhumaAtiva ? 'Marcar todas' : 'Marcar todas'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {grupo.items.map((item) => {
                        const ativa = secoes[item.key];
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => toggleSecao(item.key)}
                            disabled={generating}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all disabled:opacity-40 ${
                              ativa
                                ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                                : 'bg-white text-brand-ink-2 border-slate-200 hover:border-brand-primary/40 hover:text-brand-primary-dark'
                            }`}
                          >
                            {ativa ? '✓ ' : ''}{item.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Divisória sutil */}
          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          {/* Step 4: Generate Button */}
          <div data-tour="generate-btn">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-brand-primary text-white flex items-center justify-center text-sm font-bold shadow-sm">
                4
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-brand-ink mb-0.5">Pronto para gerar</p>
                <p className="text-xs text-brand-ink-2">A IA leva cerca de 20 segundos para criar o resumo completo.</p>
              </div>
            </div>
            <button
              onClick={onGenerate}
              disabled={!canGenerate || secoesAtivas === 0}
              className="w-full py-4 sm:py-5 rounded-xl font-display font-bold text-[15px] text-white flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-xl group relative overflow-hidden"
              style={{ background: (canGenerate && secoesAtivas > 0) ? 'linear-gradient(135deg, #003D32 0%, #005344 50%, #006D5B 100%)' : '#94a3b8' }}
            >
              {/* Brilho decorativo no hover */}
              {canGenerate && secoesAtivas > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-gold/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
              )}
              <div className="relative flex items-center gap-2.5">
                {generating ? (
                  <><Loader2 className="h-5 w-5 animate-spin" />Gerando conteúdo...</>
                ) : cooldown ? (
                  <>Aguarde...</>
                ) : secoesAtivas === 0 ? (
                  <>Selecione ao menos 1 seção</>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-brand-gold" />
                    Gerar Resumo com IA
                    <Send className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </div>
            </button>

            {generating && (
              <div className="mt-4">
                <p className="text-[11px] text-brand-ink-2 text-center mb-2">
                  Não feche a página durante a geração.
                </p>
                <GenerationProgress
                  isGenerating={generating}
                  hasStartedReceiving={hasStartedReceiving}
                  isComplete={isComplete}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputPanel;
