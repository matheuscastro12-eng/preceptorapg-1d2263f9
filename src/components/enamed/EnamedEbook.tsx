import { useState, useRef } from 'react';
import { BookOpen, ArrowLeft, Sparkles, ChevronRight, Loader2, Copy, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import GenerationProgress from '@/components/GenerationProgress';
import { exportToPDF } from '@/utils/pdfExport';

interface Specialty {
  id: string;
  name: string;
  percentage: string;
  topics: string[];
  icon: string;
}

const ENAMED_SPECIALTIES: Specialty[] = [
  { id: 'pediatria', name: 'Pediatria', percentage: '14,90%', icon: '👶', topics: ['Puericultura e Imunizações', 'Neonatologia (Icterícia, Sepse Neonatal, Cuidados)', 'Pneumologia Pediátrica (Asma, Pneumonias)', 'Aleitamento Materno', 'Diarreia e Desidratação', 'Febre Reumática', 'Infecções Congênitas', 'Distúrbios Respiratórios do Período Neonatal'] },
  { id: 'cirurgia', name: 'Cirurgia', percentage: '13,57%', icon: '🔪', topics: ['Trauma (ATLS): Avaliação Inicial, Vias Aéreas, Trauma Torácico', 'Urgências Abdominais (Abdome Agudo)', 'Cirurgia Infantil', 'Urologia Cirúrgica', 'Complicações Pós-operatórias', 'Trauma Abdominal e Pélvico', 'Vesícula e Vias Biliares', 'Proctologia', 'Queimaduras e Trauma Elétrico'] },
  { id: 'preventiva', name: 'Preventiva / Saúde Coletiva', percentage: '11,40%', icon: '🏥', topics: ['Epidemiologia (Medidas de Saúde Coletiva, Estudos)', 'SUS (Políticas de Saúde, APS, Atenção Primária)', 'Ética Médica', 'Medicina de Família e Comunidade', 'Saúde do Trabalhador', 'Vigilância em Saúde', 'Saúde do Idoso', 'Sistemas de Informação em Saúde'] },
  { id: 'obstetricia', name: 'Obstetrícia', percentage: '9,92%', icon: '🤰', topics: ['Distúrbios Hipertensivos da Gestação (Pré-eclâmpsia, Eclâmpsia)', 'Sangramento da 1ª e 2ª Metade da Gestação', 'Pré-natal', 'Diabetes na Gestação', 'Sífilis na Gestação e Sífilis Congênita', 'Assistência ao Parto e Partograma', 'Vitalidade Fetal', 'Hemorragia Pós-parto (HPP)'] },
  { id: 'ginecologia', name: 'Ginecologia', percentage: '9,81%', icon: '♀️', topics: ['Rastreamento do Câncer de Colo Uterino', 'Planejamento Familiar e Contracepção', 'Vulvovaginites e ISTs', 'Sangramento Uterino Anormal (SUA)', 'Rastreamento do Câncer de Mama', 'Assistência à Vítima de Violência Sexual', 'Endometriose e Adenomiose', 'Climatério e Terapia Hormonal'] },
  { id: 'infectologia', name: 'Infectologia', percentage: '8,17%', icon: '🦠', topics: ['Arboviroses (Dengue, Chikungunya, Zika)', 'Tuberculose (Diagnóstico, Esquemas, Resistência)', 'HIV/AIDS', 'Meningites e Meningoencefalites', 'Parasitoses Intestinais', 'Pneumonias Bacterianas', 'Raiva, Tétano, Mordedura e Arranhadura', 'Hepatoesplenomegalias Crônicas'] },
  { id: 'gastroenterologia', name: 'Gastroenterologia', percentage: '4,45%', icon: '🫁', topics: ['Doença Ulcerosa Péptica e H. pylori', 'Neoplasias do Sistema Digestivo (Pâncreas, Estômago, Esôfago)', 'Doença Inflamatória Intestinal', 'Pancreatite Aguda e Crônica', 'DRGE e Esofagites', 'Hemorragia Digestiva Alta e Baixa', 'Pólipos e Neoplasias Intestinais'] },
  { id: 'endocrinologia', name: 'Endocrinologia', percentage: '3,71%', icon: '🧬', topics: ['Diabetes Mellitus (Insulinoterapia, Complicações Agudas CAD/EHH)', 'DM Tipo 2 (Tratamento, Complicações Crônicas)', 'Tireoide (Tireotoxicose, Hipotireoidismo)', 'Obesidade e Síndrome Metabólica', 'Osteoporose', 'Adrenal'] },
  { id: 'psiquiatria', name: 'Psiquiatria', percentage: '3,71%', icon: '🧠', topics: ['Dependência Química', 'Transtornos de Humor (Depressão, Bipolar)', 'Intoxicações Exógenas', 'Psiquiatria Infantil (TOD, TDAH)', 'Transtornos de Ansiedade', 'Psicofarmacologia', 'Reforma Psiquiátrica', 'Transtornos Alimentares'] },
  { id: 'cardiologia', name: 'Cardiologia', percentage: '3,45%', icon: '❤️', topics: ['HAS (Tratamento, Complicações, Metas)', 'Arritmias (FA, Flutter Atrial, Taquiarritmias)', 'Síndromes Coronarianas Agudas (IAM, SCASSST)', 'PCR (Parada Cardiorrespiratória)', 'Insuficiência Cardíaca', 'Valvopatias', 'Dislipidemia e Risco Cardiovascular'] },
  { id: 'neurologia', name: 'Neurologia', percentage: '2,44%', icon: '🧠', topics: ['Coma e Alterações da Consciência', 'Cefaleias', 'AVC (Isquêmico e Hemorrágico)', 'Traumatismo Cranioencefálico', 'Distúrbios do Movimento (Parkinson)', 'Epilepsias', 'Demências', 'Doenças Neuromusculares'] },
  { id: 'nefrologia', name: 'Nefrologia', percentage: '2,28%', icon: '🫘', topics: ['ITU (Infecção do Trato Urinário)', 'Glomerulopatias (Síndromes Nefrítica e Nefrótica)', 'Doença Renal Crônica', 'Lesão Renal Aguda', 'Distúrbios Ácido-base', 'Distúrbios do Potássio e Disnatremias', 'Nefrolitíase'] },
  { id: 'hematologia', name: 'Hematologia', percentage: '2,01%', icon: '🩸', topics: ['Anemias Hemolíticas e Hemoglobinopatias', 'Linfomas e Leucemias', 'Hemostasia e Coagulopatias', 'Anemias Macrocíticas e Microcíticas', 'Medicina Transfusional', 'Gamopatias Monoclonais'] },
  { id: 'pneumologia', name: 'Pneumologia', percentage: '1,70%', icon: '🫁', topics: ['Asma', 'DPOC', 'Derrame Pleural e Pneumotórax', 'Câncer de Pulmão', 'TEP (Tromboembolismo Pulmonar)', 'Pneumopatias Intersticiais'] },
  { id: 'reumatologia', name: 'Reumatologia', percentage: '1,48%', icon: '🦴', topics: ['LES (Lúpus Eritematoso Sistêmico)', 'Espondilite Anquilosante', 'Artrite Reumatoide', 'Artrites Infecciosas', 'Artrites Microcristalinas (Gota)', 'Vasculites', 'Fibromialgia'] },
  { id: 'dermatologia', name: 'Dermatologia', percentage: '1,48%', icon: '🧴', topics: ['Dermatoses Infecciosas', 'Câncer de Pele', 'Hanseníase', 'Dermatoses Eczematosas', 'Farmacodermias'] },
  { id: 'hepatologia', name: 'Hepatologia', percentage: '1,17%', icon: '🫁', topics: ['Hepatites Virais (A, B, C)', 'Complicações da Cirrose Hepática', 'Hepatopatias Autoimunes', 'Tumores Hepáticos', 'Hepatite Fulminante'] },
  { id: 'ortopedia', name: 'Ortopedia', percentage: '1,11%', icon: '🦴', topics: ['Doenças da Coluna Vertebral', 'Fraturas e Luxações', 'Politrauma Ortopédico', 'Ortopedia Pediátrica (Quadril, Coluna)', 'Osteomielite'] },
  { id: 'orl', name: 'Otorrinolaringologia', percentage: '1,11%', icon: '👂', topics: ['Infecções de Vias Aéreas Superiores (Sinusite, Otite, Faringite)', 'Epistaxe', 'Corpo Estranho Nasal', 'Linfadenites Cervicais'] },
  { id: 'oftalmologia', name: 'Oftalmologia', percentage: '0,90%', icon: '👁️', topics: ['Síndrome do Olho Vermelho', 'Glaucoma', 'Trauma Ocular', 'Distúrbios de Refração', 'Neuroftalmologia'] },
];

const EnamedEbook = ({ onBack }: { onBack: () => void }) => {
  const { toast } = useToast();
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null);
  const [resultado, setResultado] = useState('');
  const [generating, setGenerating] = useState(false);
  const [hasStartedReceiving, setHasStartedReceiving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [exporting, setExporting] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const generateEbook = async (specialty: Specialty) => {
    setSelectedSpecialty(specialty);
    setResultado('');
    setGenerating(true);
    setHasStartedReceiving(false);
    setIsComplete(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada.');

      const tema = `${specialty.name} — Preparatório ENAMED`;
      const objetivos = specialty.topics.join('\n');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-fechamento`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            tema,
            objetivos,
            mode: 'fechamento',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao gerar resumo');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let started = false;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              if (jsonStr === '[DONE]') continue;
              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  if (!started) { started = true; setHasStartedReceiving(true); }
                  fullText += content;
                  setResultado(fullText);
                }
              } catch { /* ignore */ }
            }
          }
        }
      }

      setIsComplete(true);

      // Save to fechamentos
      await supabase.from('fechamentos').insert({
        user_id: session.user.id,
        tema,
        objetivos,
        resultado: fullText,
        tipo: 'fechamento',
      });

    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível gerar.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!resultRef.current || !selectedSpecialty) return;
    setExporting(true);
    try {
      await exportToPDF(resultRef.current, `ENAMED_${selectedSpecialty.name}`);
      toast({ title: 'PDF exportado com sucesso!' });
    } catch {
      toast({ title: 'Erro ao exportar PDF', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  // Specialty selection view
  if (!selectedSpecialty) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-3">
            <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-600">E-Book ENAMED</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            Resumos por <span className="text-emerald-600">Especialidade</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-lg mx-auto">
            Gere resumos completos e detalhados para cada especialidade do ENAMED, com os temas mais cobrados pelo INEP
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {ENAMED_SPECIALTIES.map((spec) => (
            <button
              key={spec.id}
              onClick={() => generateEbook(spec)}
              className="group relative rounded-xl border border-border/40 bg-gradient-to-br from-muted/30 to-transparent p-4 text-left transition-all duration-300 hover:border-emerald-500/40 hover:shadow-[0_0_20px_hsl(150_50%_40%/0.1)] hover:bg-emerald-500/5"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg">{spec.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground truncate">{spec.name}</h3>
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">{spec.percentage}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 shrink-0 transition-colors" />
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-2">
                {spec.topics.slice(0, 3).join(' • ')}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Generation/result view
  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => { setSelectedSpecialty(null); setResultado(''); setIsComplete(false); }} className="gap-1">
          <ArrowLeft className="h-4 w-4" />Voltar
        </Button>
        <div className="h-5 w-px bg-border/50" />
        <div className="flex items-center gap-2">
          <span className="text-lg">{selectedSpecialty.icon}</span>
          <span className="text-sm font-bold">{selectedSpecialty.name}</span>
          <span className="text-[10px] font-medium text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">{selectedSpecialty.percentage}</span>
        </div>

        {isComplete && (
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(resultado); toast({ title: 'Copiado!' }); }} className="gap-1">
              <Copy className="h-3.5 w-3.5" />Copiar
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting} className="gap-1">
              <FileDown className="h-3.5 w-3.5" />{exporting ? 'Exportando...' : 'PDF'}
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 rounded-xl border border-border/30 bg-gradient-to-br from-card/80 to-card/40 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6" ref={resultRef}>
            {resultado ? (
              <MarkdownRenderer content={resultado} isTyping={generating} />
            ) : generating ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
                <p className="text-muted-foreground">Gerando resumo completo de <strong>{selectedSpecialty.name}</strong>...</p>
                <p className="text-xs text-muted-foreground">Isso pode levar alguns minutos devido à profundidade do conteúdo</p>
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </div>

      <GenerationProgress
        isGenerating={generating}
        hasStartedReceiving={hasStartedReceiving}
        isComplete={isComplete}
      />
    </div>
  );
};

export default EnamedEbook;
