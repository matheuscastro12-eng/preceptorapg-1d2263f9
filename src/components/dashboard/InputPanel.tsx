import GenerationProgress from '@/components/GenerationProgress';
import type { GenerationMode } from './ModeToggle';
import { Loader2, Sparkles, Send, BookOpen, Target } from 'lucide-react';

interface InputPanelProps {
  tema: string;
  setTema: (value: string) => void;
  objetivos: string;
  setObjetivos: (value: string) => void;
  modo: GenerationMode;
  setModo: (value: GenerationMode) => void;
  generating: boolean;
  hasStartedReceiving: boolean;
  isComplete: boolean;
  onGenerate: () => void;
  canGenerate?: boolean;
  cooldown?: boolean;
}

const MAX_TEMA_LENGTH = 500;
const MAX_OBJETIVOS_LENGTH = 2000;

const suggestions = [
  { label: 'Insuficiência Cardíaca', icon: '🫀' },
  { label: 'Diabetes Mellitus Tipo 2', icon: '🩸' },
  { label: 'Hipertensão Arterial', icon: '💊' },
  { label: 'TDAH', icon: '🧠' },
];

const InputPanel = ({
  tema, setTema, objetivos, setObjetivos,
  modo, setModo, generating, hasStartedReceiving,
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

  return (
    <div className="relative">
      {/* Borda decorativa superior — barra verde gradiente */}
      <div className="absolute left-0 top-0 right-0 h-1 bg-gradient-to-r from-brand-primary via-brand-primary-dark to-brand-primary rounded-t-2xl" />

      {/* Form Card principal */}
      <div className="relative bg-white rounded-2xl border-2 border-brand-primary/15 overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,109,91,0.12)]">
        {/* Decoração — canto superior direito sutil */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand-primary/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-brand-gold/5 blur-3xl pointer-events-none" />

        <div className="relative p-5 sm:p-7 space-y-6">
          {/* Step 1: Tema */}
          <div data-tour="tema-input">
            <div className="flex items-start gap-3 mb-2.5">
              <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-brand-primary text-white flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div className="flex-1 min-w-0">
                <label className="flex items-center gap-2 text-sm font-bold text-brand-ink mb-0.5">
                  <BookOpen className="w-3.5 h-3.5 text-brand-primary" />
                  Qual tema você quer estudar?
                </label>
                <p className="text-xs text-brand-ink-2">Nome do assunto principal — seja específico.</p>
              </div>
            </div>
            <input
              type="text"
              placeholder="Ex: Insuficiência Cardíaca Congestiva"
              value={tema}
              onChange={(e) => setTema(e.target.value.slice(0, MAX_TEMA_LENGTH))}
              disabled={generating}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-brand-ink placeholder:text-slate-400 focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 focus:bg-white transition-all text-[15px] font-medium disabled:opacity-50"
            />

            {/* Suggestions */}
            {!tema && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide self-center mr-1">Sugestões:</span>
                {suggestions.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => setTema(s.label)}
                    disabled={generating}
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-brand-ink-2 hover:border-brand-primary/40 hover:text-brand-primary-dark hover:bg-brand-primary/5 transition-all disabled:opacity-40"
                  >
                    <span>{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {tema.length > MAX_TEMA_LENGTH * 0.8 && (
              <p className="text-[10px] text-brand-ink-2 text-right mt-1">{tema.length}/{MAX_TEMA_LENGTH}</p>
            )}
          </div>

          {/* Divisória sutil */}
          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          {/* Step 2: Objetivos */}
          <div data-tour="objetivos-input">
            <div className="flex items-start gap-3 mb-2.5">
              <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-brand-primary text-white flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div className="flex-1 min-w-0">
                <label className="flex items-center gap-2 text-sm font-bold text-brand-ink mb-0.5">
                  <Target className="w-3.5 h-3.5 text-brand-primary" />
                  Objetivos específicos
                  <span className="text-[10px] text-slate-400 font-medium">opcional</span>
                </label>
                <p className="text-xs text-brand-ink-2">
                  Cada linha vira uma seção própria — o resumo usa o <span className="font-semibold text-brand-primary-dark">texto exato que você escrever</span> como título.
                </p>
              </div>
            </div>
            <textarea
              placeholder={"Um objetivo por linha. Ex:\nAtividade laboral em IC\nCritérios de Framingham\nFármacos de 1ª linha"}
              value={objetivos}
              onChange={(e) => setObjetivos(e.target.value.slice(0, MAX_OBJETIVOS_LENGTH))}
              disabled={generating}
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-brand-ink placeholder:text-slate-400 focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 focus:bg-white transition-all text-sm font-medium resize-none disabled:opacity-50"
            />
            {objetivosCount > 0 && (
              <p className="text-[11px] text-brand-primary-dark font-semibold mt-1.5">
                {objetivosCount} {objetivosCount === 1 ? 'objetivo' : 'objetivos'} {objetivosCount === 1 ? 'identificado' : 'identificados'}
              </p>
            )}
          </div>

          {/* Divisória sutil */}
          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          {/* Step 3: Generate Button */}
          <div data-tour="generate-btn">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-brand-primary text-white flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-brand-ink mb-0.5">Pronto para gerar</p>
                <p className="text-xs text-brand-ink-2">A IA leva ~20s para criar seu resumo completo.</p>
              </div>
            </div>
            <button
              onClick={onGenerate}
              disabled={!canGenerate}
              className="w-full py-4 rounded-xl font-display font-bold text-sm text-white flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg group relative overflow-hidden"
              style={{ background: canGenerate ? 'linear-gradient(135deg, #003D32 0%, #005344 50%, #006D5B 100%)' : '#94a3b8' }}
            >
              {/* Brilho decorativo no hover */}
              {canGenerate && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-gold/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
              )}
              <div className="relative flex items-center gap-2.5">
                {generating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Gerando conteúdo...</>
                ) : cooldown ? (
                  <>Aguarde...</>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-brand-gold" />
                    Gerar Resumo com IA
                    <Send className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </div>
            </button>

            {generating && (
              <div className="mt-3">
                <p className="text-[10px] text-brand-ink-2 text-center mb-1.5">
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
