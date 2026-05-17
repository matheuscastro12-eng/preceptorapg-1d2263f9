import { useEffect, useState } from 'react';
import { Brain, FileText, Sparkles, CheckCircle2, BookOpenCheck } from 'lucide-react';

interface GenerationProgressProps {
  isGenerating: boolean;
  hasStartedReceiving: boolean;
  isComplete: boolean;
}

/**
 * Loading editorial pmed.
 *
 * Diferente da versao Lovable antiga, este componente:
 *  - usa apenas progressao baseada em estado (sem timers concorrentes que
 *    causavam o "bug" de salto/regressao);
 *  - shows uma serie de etapas com checkmarks conforme avanca;
 *  - barra fina verde+ouro consistente com o resto do design system;
 *  - typografia Manrope + eyebrow tracking-wide;
 *  - sem motion library — animacao puramente CSS.
 */

type Stage = {
  key: 'connecting' | 'thinking' | 'writing' | 'finalizing';
  label: string;
  icon: typeof Brain;
  hint: string;
};

const STAGES: Stage[] = [
  { key: 'connecting', label: 'Conectando ao PreceptorMED', icon: BookOpenCheck, hint: 'Validando sessão e contexto' },
  { key: 'thinking',   label: 'Analisando o tema',           icon: Brain,         hint: 'Buscando literatura e diretrizes' },
  { key: 'writing',    label: 'Escrevendo o conteúdo',       icon: Sparkles,      hint: 'Composição editorial em tempo real' },
  { key: 'finalizing', label: 'Finalizando estrutura',       icon: FileText,      hint: 'Referências e formatação' },
];

const GenerationProgress = ({ isGenerating, hasStartedReceiving, isComplete }: GenerationProgressProps) => {
  const [tick, setTick] = useState(0);

  // Tick simples só pra animar pontos do estado ativo (sem bug de timers concorrentes)
  useEffect(() => {
    if (!isGenerating || isComplete) return;
    const t = setInterval(() => setTick(x => (x + 1) % 4), 400);
    return () => clearInterval(t);
  }, [isGenerating, isComplete]);

  if (!isGenerating && !isComplete) return null;

  // Calcula stage atual baseado SO em props — sem ms desconectados do estado real
  let activeIdx = 0;
  if (isComplete) activeIdx = STAGES.length; // tudo done
  else if (hasStartedReceiving) activeIdx = 2; // writing
  else if (isGenerating) activeIdx = 1; // thinking
  // connecting (0) so quando isGenerating ainda nao bateu — uso na entrada

  const dots = '.'.repeat(tick === 0 ? 0 : tick);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Ribbon top */}
      <div className="h-[3px] bg-gradient-to-r from-[#003D32] via-[#005344] via-50% to-[#C9A84C]" />

      <div className="px-5 sm:px-7 py-5 sm:py-6">
        {/* Eyebrow */}
        <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#005344] inline-flex items-center gap-2 mb-3">
          <span className="w-5 h-px bg-[#C9A84C]" />
          {isComplete ? 'Pronto' : 'Gerando agora'}
        </p>

        {/* Title */}
        <h3 className="font-['Manrope'] font-bold text-[18px] sm:text-[20px] tracking-[-0.015em] text-[#191C1D] mb-1 leading-tight">
          {isComplete
            ? 'Concluído.'
            : hasStartedReceiving
              ? <>Escrevendo seu conteúdo<span className="text-[#8a6f26]">{dots}</span></>
              : <>PreceptorMED pensando<span className="text-[#8a6f26]">{dots}</span></>}
        </h3>
        <p className="text-[12.5px] text-[#4a5568] mb-4">
          {isComplete
            ? 'Tudo certo — pode ler ou exportar.'
            : 'Geração em streaming. Você verá o texto aparecer em tempo real.'}
        </p>

        {/* Etapas */}
        <ol className="space-y-2">
          {STAGES.map((stage, i) => {
            const status: 'done' | 'active' | 'pending' =
              i < activeIdx ? 'done' :
              i === activeIdx && !isComplete ? 'active' :
              'pending';
            const Icon = status === 'done' ? CheckCircle2 : stage.icon;
            return (
              <li
                key={stage.key}
                className={`flex items-start gap-3 transition-opacity ${status === 'pending' ? 'opacity-40' : 'opacity-100'}`}
              >
                <span
                  className={`shrink-0 mt-0.5 h-7 w-7 rounded-lg flex items-center justify-center transition-all ${
                    status === 'done'   ? 'bg-[#005344] text-white' :
                    status === 'active' ? 'bg-[#C9A84C]/15 text-[#8a6f26] ring-2 ring-[#C9A84C]/30' :
                                          'bg-slate-100 text-[#94a3b8]'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${status === 'active' ? 'animate-pulse' : ''}`} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-[12.5px] font-bold leading-tight ${status === 'done' ? 'text-[#005344]' : status === 'active' ? 'text-[#191C1D]' : 'text-[#4a5568]'}`}>
                    {stage.label}
                  </p>
                  <p className="text-[11px] text-[#94a3b8] mt-0.5 leading-snug">
                    {stage.hint}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
};

export default GenerationProgress;
