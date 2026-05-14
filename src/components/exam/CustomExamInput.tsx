import { useRef, useState } from 'react';
import { Loader2, Sparkles, Paperclip, FileText, X, ArrowRight } from 'lucide-react';
import GenerationProgress from '@/components/GenerationProgress';
import { useToast } from '@/hooks/use-toast';
import type { ExamPdf, ExamConfig, DifficultyLevel, PracticeMode } from '@/hooks/useExamGenerator';

interface CustomExamInputProps {
  materias: string;
  setMaterias: (v: string) => void;
  pdfs: ExamPdf[];
  setPdfs: (v: ExamPdf[]) => void;
  config: ExamConfig;
  setConfig: (v: ExamConfig) => void;
  generating: boolean;
  hasStartedReceiving: boolean;
  isComplete: boolean;
  onGenerate: () => void;
}

const MAX_PDFS = 3;
const MAX_PDF_MB = 5;
const MAX_MATERIAS_LENGTH = 2000;

const QUANTIDADES = [5, 10, 20, 30, 50];

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export default function CustomExamInput({
  materias, setMaterias, pdfs, setPdfs,
  config, setConfig,
  generating, hasStartedReceiving, isComplete,
  onGenerate,
}: CustomExamInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const materiasList = materias.split('\n').map(s => s.trim()).filter(Boolean);
  const isReady = (materiasList.length > 0 || pdfs.length > 0) && !generating;

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const remaining = MAX_PDFS - pdfs.length;
    if (remaining <= 0) {
      toast({ title: 'Limite atingido', description: `Máximo ${MAX_PDFS} PDFs.`, variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const novos: ExamPdf[] = [];
      for (const file of Array.from(fileList).slice(0, remaining)) {
        if (file.type !== 'application/pdf') {
          toast({ title: 'Tipo inválido', description: `"${file.name}" não é PDF.`, variant: 'destructive' });
          continue;
        }
        if (file.size > MAX_PDF_MB * 1024 * 1024) {
          toast({ title: 'Muito grande', description: `"${file.name}" passa de ${MAX_PDF_MB}MB.`, variant: 'destructive' });
          continue;
        }
        const data = await fileToBase64(file);
        novos.push({ name: file.name, mimeType: file.type, data, sizeKB: Math.round(file.size / 1024) });
      }
      if (novos.length) setPdfs([...pdfs, ...novos]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative bg-white rounded-3xl border border-slate-200 shadow-[0_1px_2px_rgba(25,28,29,0.04)] overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-[#003D32] via-[#005344] via-[#006D5B] to-[#C9A84C]" />

      <div className="px-5 sm:px-8 md:px-10 py-7 sm:py-9 space-y-7">
        <header>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#005344] inline-flex items-center gap-2.5 mb-3">
            <span className="w-6 h-px bg-[#C9A84C]" />
            Simulado por tópicos
          </p>
          <h1 className="font-['Manrope'] font-bold text-[24px] sm:text-[30px] tracking-[-0.025em] leading-[1.08] text-[#191C1D]">
            Diga o que vai{' '}
            <em className="not-italic font-medium text-[#8a6f26]">
              cair na prova
            </em>
            .
          </h1>
          <p className="text-sm text-[#4a5568] mt-2 max-w-[56ch] leading-relaxed">
            Liste as matérias que você quer estudar. Anexe PDFs (resumos, slides, gabaritos) se quiser que a IA use como base do simulado.
          </p>
        </header>

        {/* ── Matérias ── */}
        <section>
          <div className="flex items-baseline justify-between mb-2">
            <label className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#4a5568] inline-flex items-center gap-2">
              ① Matérias
              <span className="text-[9.5px] font-medium normal-case tracking-normal text-[#94a3b8]">
                1 por linha
              </span>
            </label>
            {materiasList.length > 0 && (
              <span className="text-[10.5px] font-bold text-[#005344] inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#005344]" />
                {materiasList.length} matéria{materiasList.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <textarea
            placeholder={'Insuficiência cardíaca\nAVC isquêmico\nSepse pediátrica\nDiabetes tipo 2'}
            value={materias}
            onChange={(e) => setMaterias(e.target.value.slice(0, MAX_MATERIAS_LENGTH))}
            disabled={generating}
            rows={5}
            className="w-full px-4 py-3.5 bg-slate-50/60 border-2 border-slate-200 rounded-xl text-[#191C1D] placeholder:text-[#94a3b8] outline-none focus:border-[#005344] focus:ring-4 focus:ring-[#005344]/06 focus:bg-white transition-all text-[14px] leading-relaxed resize-y font-['DM_Sans'] disabled:opacity-50"
          />
          <p className="text-[11px] text-[#4a5568] mt-1.5 leading-relaxed">
            A IA distribui as questões entre as matérias proporcionalmente.
          </p>
        </section>

        {/* ── PDFs (opcional) ── */}
        <section>
          <div className="flex items-baseline justify-between mb-2">
            <label className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#4a5568] inline-flex items-center gap-2">
              ② Material de base
              <span className="text-[9.5px] font-medium normal-case tracking-normal text-[#94a3b8]">
                opcional · até {MAX_PDFS} PDFs, {MAX_PDF_MB}MB cada
              </span>
            </label>
            {pdfs.length > 0 && (
              <span className="text-[10.5px] font-bold text-[#005344]">
                {pdfs.length}/{MAX_PDFS} anexado{pdfs.length === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={generating || uploading || pdfs.length >= MAX_PDFS}
          />
          {pdfs.length === 0 ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={generating || uploading}
              className="w-full px-4 py-4 bg-slate-50/60 border-2 border-dashed border-slate-200 rounded-xl text-[#4a5568] hover:border-[#005344] hover:bg-white hover:text-[#005344] transition-all text-[13px] font-medium inline-flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processando…</> : <><Paperclip className="w-4 h-4" /> Anexar PDF (resumo, slide, gabarito…)</>}
            </button>
          ) : (
            <div className="space-y-1.5">
              {pdfs.map((p, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-white border border-slate-200 rounded-lg">
                  <FileText className="w-4 h-4 text-[#005344] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-semibold text-[#191C1D] truncate">{p.name}</div>
                    <div className="text-[10.5px] text-[#94a3b8] font-mono">
                      {p.sizeKB < 1024 ? `${p.sizeKB} KB` : `${(p.sizeKB / 1024).toFixed(1)} MB`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPdfs(pdfs.filter((_, idx) => idx !== i))}
                    disabled={generating}
                    className="p-1 rounded hover:bg-slate-100 text-[#94a3b8] hover:text-red-600 transition-colors disabled:opacity-40"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {pdfs.length < MAX_PDFS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={generating || uploading}
                  className="w-full px-3 py-2 border border-dashed border-slate-200 rounded-lg text-[11.5px] font-semibold text-[#4a5568] hover:border-[#005344] hover:text-[#005344] inline-flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                >
                  {uploading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processando…</> : <><Paperclip className="w-3.5 h-3.5" /> Adicionar outro</>}
                </button>
              )}
            </div>
          )}
        </section>

        {/* ── Quantidade + Nível ── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#4a5568] mb-2 block">
              ③ Quantidade
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUANTIDADES.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setConfig({ ...config, quantidade: q })}
                  disabled={generating}
                  className={`px-3 h-9 rounded-lg text-[12px] font-bold border-2 transition-all disabled:opacity-40 ${
                    config.quantidade === q
                      ? 'bg-[#005344] text-white border-[#005344] shadow-[0_2px_6px_-2px_rgba(0,83,68,0.4)]'
                      : 'bg-white text-[#4a5568] border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
            <p className="text-[10.5px] text-[#94a3b8] mt-1.5">questões no simulado</p>
          </div>
          <div>
            <label className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#4a5568] mb-2 block">
              ④ Nível
            </label>
            <div className="flex gap-1.5">
              {([
                { v: 'basico' as DifficultyLevel, label: 'Ciclo básico' },
                { v: 'residencia' as DifficultyLevel, label: 'Residência' },
              ]).map((n) => (
                <button
                  key={n.v}
                  type="button"
                  onClick={() => setConfig({ ...config, nivel: n.v })}
                  disabled={generating}
                  className={`flex-1 px-3 h-9 rounded-lg text-[12px] font-bold border-2 transition-all disabled:opacity-40 ${
                    config.nivel === n.v
                      ? 'bg-[#005344] text-white border-[#005344] shadow-[0_2px_6px_-2px_rgba(0,83,68,0.4)]'
                      : 'bg-white text-[#4a5568] border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {n.label}
                </button>
              ))}
            </div>
            <p className="text-[10.5px] text-[#94a3b8] mt-1.5">profundidade técnica</p>
          </div>
        </section>

        {/* ── Modo prática ── */}
        <section>
          <label className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#4a5568] mb-2 block">
            ⑤ Tipo
          </label>
          <div className="flex gap-1.5">
            {([
              { v: 'prova' as PracticeMode, label: 'Questões objetivas' },
              { v: 'caso_clinico' as PracticeMode, label: 'Caso clínico integrador' },
            ]).map((m) => (
              <button
                key={m.v}
                type="button"
                onClick={() => setConfig({ ...config, practiceMode: m.v })}
                disabled={generating}
                className={`flex-1 px-3 h-9 rounded-lg text-[12px] font-bold border-2 transition-all disabled:opacity-40 ${
                  config.practiceMode === m.v
                    ? 'bg-[#005344] text-white border-[#005344] shadow-[0_2px_6px_-2px_rgba(0,83,68,0.4)]'
                    : 'bg-white text-[#4a5568] border-slate-200 hover:border-slate-300'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section>
          <button
            onClick={onGenerate}
            disabled={!isReady}
            className="w-full h-[58px] rounded-xl font-['Manrope'] font-bold text-[15px] tracking-[-0.005em] text-white inline-flex items-center justify-center gap-2.5 transition-all disabled:cursor-not-allowed group relative overflow-hidden"
            style={{
              background: isReady
                ? 'linear-gradient(135deg, #003D32 0%, #005344 50%, #006D5B 100%)'
                : '#94a3b8',
              boxShadow: isReady
                ? '0 8px 24px -8px rgba(0,109,91,0.45)'
                : 'none',
            }}
          >
            {isReady && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C9A84C]/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
            )}
            <div className="relative flex items-center gap-2.5">
              {generating ? (
                <><Loader2 className="h-[18px] w-[18px] animate-spin" /> Gerando simulado…</>
              ) : !isReady ? (
                materiasList.length === 0 && pdfs.length === 0 ? 'Adicione matérias ou PDF' : 'Aguarde…'
              ) : (
                <><Sparkles className="w-[18px] h-[18px] text-[#C9A84C]" /> Gerar simulado <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" /></>
              )}
            </div>
          </button>

          {generating && (
            <div className="mt-5 pt-5 border-t border-slate-100">
              <GenerationProgress isGenerating={generating} hasStartedReceiving={hasStartedReceiving} isComplete={isComplete} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
