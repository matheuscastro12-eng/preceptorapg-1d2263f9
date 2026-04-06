import GenerationProgress from '@/components/GenerationProgress';
import type { GenerationMode } from './ModeToggle';
import { Loader2, FileText, Presentation, Sparkles, Send } from 'lucide-react';

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
  const isSeminário = modo === 'seminario';

  return (
    <div className="space-y-5">
      {/* Mode Cards */}
      <div className="grid grid-cols-2 gap-3" data-tour="mode-toggle">
        <button
          onClick={() => setModo('fechamento')}
          disabled={generating}
          className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left group disabled:opacity-50 ${
            modo === 'fechamento'
              ? 'border-[#006D5B] bg-[#006D5B]/5 shadow-sm'
              : 'border-slate-200 bg-white hover:border-[#006D5B]/30 hover:shadow-sm'
          }`}
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 transition-colors ${
            modo === 'fechamento' ? 'bg-[#006D5B] text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-[#006D5B]/10 group-hover:text-[#006D5B]'
          }`}>
            <FileText className="w-4.5 h-4.5" />
          </div>
          <p className={`text-sm font-bold ${modo === 'fechamento' ? 'text-[#005344]' : 'text-[#191c1d]'}`}>Resumo</p>
          <p className="text-[11px] text-[#6e7975] mt-0.5">Conteúdo estruturado e completo</p>
          {modo === 'fechamento' && (
            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#006D5B]" />
          )}
        </button>

        <button
          onClick={() => setModo('seminario')}
          disabled={generating}
          className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left group disabled:opacity-50 ${
            modo === 'seminario'
              ? 'border-[#006D5B] bg-[#006D5B]/5 shadow-sm'
              : 'border-slate-200 bg-white hover:border-[#006D5B]/30 hover:shadow-sm'
          }`}
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 transition-colors ${
            modo === 'seminario' ? 'bg-[#006D5B] text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-[#006D5B]/10 group-hover:text-[#006D5B]'
          }`}>
            <Presentation className="w-4.5 h-4.5" />
          </div>
          <p className={`text-sm font-bold ${modo === 'seminario' ? 'text-[#005344]' : 'text-[#191c1d]'}`}>Seminário</p>
          <p className="text-[11px] text-[#6e7975] mt-0.5">Roteiro de slides pronto</p>
          {modo === 'seminario' && (
            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#006D5B]" />
          )}
        </button>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(25,28,29,0.04)] border border-slate-100">
        <div className="space-y-4">
          {/* Tema */}
          <div data-tour="tema-input">
            <label className="text-xs font-semibold text-[#191c1d] mb-1.5 block">
              Sobre o que você quer estudar?
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={isSeminário ? "Ex: Farmacologia dos Analgésicos" : "Ex: Insuficiência Cardíaca Congestiva"}
                value={tema}
                onChange={(e) => setTema(e.target.value.slice(0, MAX_TEMA_LENGTH))}
                disabled={generating}
                className="w-full px-4 py-3 bg-[#f8f9fa] border border-slate-200 rounded-xl text-[#191c1d] placeholder:text-slate-400 focus:outline-none focus:border-[#006D5B] focus:ring-2 focus:ring-[#006D5B]/10 focus:bg-white transition-all duration-200 text-sm font-medium disabled:opacity-50"
              />
            </div>

            {/* Suggestions */}
            {!tema && (
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => setTema(s.label)}
                    disabled={generating}
                    type="button"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-[#3e4945] hover:border-[#006D5B]/40 hover:text-[#005344] hover:shadow-sm transition-all duration-150 disabled:opacity-40"
                  >
                    <span>{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {tema.length > MAX_TEMA_LENGTH * 0.8 && (
              <p className="text-[10px] text-[#6e7975] text-right mt-1">{tema.length}/{MAX_TEMA_LENGTH}</p>
            )}
          </div>

          {/* Objetivos */}
          <div data-tour="objetivos-input">
            <label className="text-xs font-semibold text-[#191c1d] mb-1.5 flex items-center gap-1.5 block">
              Focos específicos
              <span className="text-[10px] text-slate-400 font-normal">(opcional)</span>
            </label>
            <textarea
              placeholder={isSeminário
                ? "Ex: Mecanismo de ação, efeitos adversos, interações medicamentosas..."
                : "Ex: Critérios de Framingham, Manejo na Emergência, Fármacos de 1ª linha..."
              }
              value={objetivos}
              onChange={(e) => setObjetivos(e.target.value.slice(0, MAX_OBJETIVOS_LENGTH))}
              disabled={generating}
              rows={3}
              className="w-full px-4 py-3 bg-[#f8f9fa] border border-slate-200 rounded-xl text-[#191c1d] placeholder:text-slate-400 focus:outline-none focus:border-[#006D5B] focus:ring-2 focus:ring-[#006D5B]/10 focus:bg-white transition-all duration-200 text-sm font-medium resize-none disabled:opacity-50"
            />
          </div>

          {/* Generate Button */}
          <div data-tour="generate-btn" className="pt-1">
            <button
              onClick={onGenerate}
              disabled={!canGenerate}
              className="w-full py-3.5 rounded-xl font-['Manrope'] font-bold text-sm text-white flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:-translate-y-0.5 group"
              style={{ background: canGenerate ? 'linear-gradient(135deg, #005344 0%, #007a63 100%)' : '#94a3b8' }}
            >
              {generating ? (
                <><Loader2 className="h-4 w-4 animate-spin" />{isSeminário ? 'Gerando roteiro...' : 'Gerando conteúdo...'}</>
              ) : cooldown ? (
                <>Aguarde...</>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  {isSeminário ? 'Gerar Roteiro de Slides' : 'Gerar Resumo com IA'}
                  <Send className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </>
              )}
            </button>

            {generating && (
              <div className="mt-3">
                <p className="text-[10px] text-[#6e7975] text-center mb-1.5">
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
