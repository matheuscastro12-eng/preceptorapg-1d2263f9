import { useState, useRef, useEffect } from 'react';
import { BookOpen, ArrowLeft, ChevronRight, Loader2, Copy, FileDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { useSubscription } from '@/hooks/useSubscription';
import MarkdownRenderer from '@/components/MarkdownRenderer';
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
  const { isAdmin } = useAdmin();
  const { hasAccess } = useSubscription();
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null);
  const [savedContent, setSavedContent] = useState<Record<string, string>>({});
  const [loadingContent, setLoadingContent] = useState(true);
  const [resultado, setResultado] = useState('');
  const [exporting, setExporting] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadEbooks = async () => {
      setLoadingContent(true);
      const { data } = await supabase
        .from('enamed_ebooks')
        .select('specialty_id, content');
      
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((row: { specialty_id: string; content: string }) => {
          map[row.specialty_id] = row.content;
        });
        setSavedContent(map);
      }
      setLoadingContent(false);
    };
    loadEbooks();
  }, []);

  const openSpecialty = (spec: Specialty) => {
    const content = savedContent[spec.id];
    if (content) {
      setSelectedSpecialty(spec);
      setResultado(content);
    } else if (isAdmin) {
      setSelectedSpecialty(spec);
      setResultado('');
    } else {
      toast({
        title: 'Em breve',
        description: 'Este resumo ainda está sendo preparado. Volte em breve!',
      });
    }
  };

  const generateSingle = async (spec: Specialty, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isAdmin || generatingId) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: 'Sessão expirada', variant: 'destructive' });
      return;
    }

    setGeneratingId(spec.id);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-all-ebooks`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ specialty_ids: [spec.id], stream: false }),
        }
      );
      if (!response.ok) throw new Error('Erro na geração');
      const { results } = await response.json();
      if (results?.[0]?.status === 'done') {
        const { data } = await supabase.from('enamed_ebooks').select('content').eq('specialty_id', spec.id).maybeSingle();
        if (data) {
          setSavedContent(prev => ({ ...prev, [spec.id]: data.content }));
          setResultado(data.content);
        }
        toast({ title: `✅ ${spec.name} gerado com sucesso! (${results[0].content_length?.toLocaleString()} caracteres)` });
      } else {
        toast({ title: `Erro: ${results?.[0]?.error || 'Falha'}`, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Erro na geração', variant: 'destructive' });
    } finally {
      setGeneratingId(null);
    }
  };

  const handleExportPDF = async () => {
    if (!resultRef.current || !selectedSpecialty) return;
    setExporting(true);
    try {
      await exportToPDF({ tema: `ENAMED — ${selectedSpecialty.name}`, contentElement: resultRef.current });
      toast({ title: 'PDF exportado com sucesso!' });
    } catch {
      toast({ title: 'Erro ao exportar PDF', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const availableCount = Object.keys(savedContent).length;
  const canAccess = hasAccess || isAdmin;

  // Specialty selection view
  if (!selectedSpecialty) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-3">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">E-Book ENAMED</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            Resumos por <span className="text-primary">Especialidade</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-lg mx-auto">
            Resumos completos e detalhados para cada especialidade do ENAMED — {availableCount} de {ENAMED_SPECIALTIES.length} disponíveis
          </p>
        </div>

        {/* Admin generating indicator */}
        {generatingId && (
          <div className="flex items-center justify-center gap-3 p-3 rounded-xl border border-primary/30 bg-primary/5">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm font-medium text-foreground">
              Gerando {ENAMED_SPECIALTIES.find(s => s.id === generatingId)?.name}... (pode levar 1-2 min)
            </span>
          </div>
        )}

        {!canAccess && (
          <div className="text-center p-4 rounded-xl border border-destructive/30 bg-destructive/5">
            <p className="text-sm text-muted-foreground">
              🔒 Os resumos do E-Book ENAMED estão disponíveis apenas para assinantes.
            </p>
          </div>
        )}

        {loadingContent ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {ENAMED_SPECIALTIES.map((spec) => {
              const hasContent = !!savedContent[spec.id];
              const isGenerating = generatingId === spec.id;
              return (
                <button
                  key={spec.id}
                  onClick={() => canAccess && hasContent && openSpecialty(spec)}
                  disabled={(!canAccess || !hasContent) && !isAdmin}
                  className={`group relative rounded-xl border p-4 text-left transition-all duration-300 ${
                    hasContent && canAccess
                      ? 'border-primary/30 bg-gradient-to-br from-primary/10 to-transparent hover:border-primary/50 hover:shadow-md'
                      : 'border-border/20 bg-muted/10 opacity-50 cursor-not-allowed'
                  } ${isGenerating ? 'ring-2 ring-primary/50 animate-pulse' : ''}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">{spec.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-foreground truncate">{spec.name}</h3>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        hasContent ? 'text-primary bg-primary/10' : 'text-muted-foreground bg-muted/30'
                      }`}>{spec.percentage}</span>
                    </div>
                    {hasContent && <ChevronRight className="h-4 w-4 text-primary shrink-0" />}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {hasContent 
                        ? 'Resumo disponível — clique para ler'
                        : 'Ainda não gerado'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Content view
  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => { setSelectedSpecialty(null); setResultado(''); }} className="gap-1">
          <ArrowLeft className="h-4 w-4" />Voltar
        </Button>
        <div className="h-5 w-px bg-border/50" />
        <div className="flex items-center gap-2">
          <span className="text-lg">{selectedSpecialty.icon}</span>
          <span className="text-sm font-bold">{selectedSpecialty.name}</span>
          <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">{selectedSpecialty.percentage}</span>
        </div>

        <div className="ml-auto flex gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateSingle(selectedSpecialty)}
              disabled={!!generatingId}
              className="gap-1 border-primary/30 hover:bg-primary/10 text-primary"
            >
              {generatingId === selectedSpecialty.id ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" />Regenerando...</>
              ) : (
                <><RefreshCw className="h-3.5 w-3.5" />Regenerar</>
              )}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(resultado); toast({ title: 'Copiado!' }); }} className="gap-1">
            <Copy className="h-3.5 w-3.5" />Copiar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting} className="gap-1">
            <FileDown className="h-3.5 w-3.5" />{exporting ? 'Exportando...' : 'PDF'}
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 rounded-xl border border-border/30 bg-gradient-to-br from-card/80 to-card/40 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6" ref={resultRef}>
            <MarkdownRenderer content={resultado} isTyping={false} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default EnamedEbook;
