import { useState, useRef, useEffect } from 'react';
import PageTransition from '@/components/PageTransition';
import PageSkeleton from '@/components/PageSkeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdmin } from '@/hooks/useAdmin';
import { useGenerationGuard } from '@/hooks/useGenerationGuard';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import InputPanel from '@/components/dashboard/InputPanel';
import ResultPanel from '@/components/dashboard/ResultPanel';
import ContextChat from '@/components/ContextChat';
import { exportToPDF } from '@/utils/pdfExport';
import type { GenerationMode } from '@/components/dashboard/ModeToggle';
import OnboardingTour, { type TourStep } from '@/components/OnboardingTour';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const dashboardTourSteps: TourStep[] = [
  {
    target: '[data-tour="tema-input"]',
    title: 'Tema do Resumo',
    description: 'Digite o tema central do seu resumo. Use os chips de sugestão abaixo para temas comuns ou digite livremente.',
    placement: 'right',
  },
  {
    target: '[data-tour="objetivos-input"]',
    title: 'Objetivos (Opcional)',
    description: 'Liste os objetivos específicos que você quer abordar. Deixe em branco para a IA sugerir automaticamente.',
    placement: 'right',
  },
  {
    target: '[data-tour="mode-toggle"]',
    title: 'Tipo de Conteúdo',
    description: 'Escolha entre Resumo (conteúdo focado) ou Seminário (apresentação completa).',
    placement: 'right',
  },
  {
    target: '[data-tour="generate-btn"]',
    title: 'Gerar Conteúdo',
    description: 'Clique para iniciar a geração. O conteúdo aparecerá em tempo real no painel ao lado.',
    placement: 'right',
  },
];

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { hasAccess, loading: subLoading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  
  const [tema, setTema] = useState('');
  const [objetivos, setObjetivos] = useState('');
  const [modo, setModo] = useState<GenerationMode>('fechamento');
  const [resultado, setResultado] = useState('');
  const [generating, setGenerating] = useState(false);
  const [hasStartedReceiving, setHasStartedReceiving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const { canGenerate, cooldown } = useGenerationGuard(generating);

  // Auto-scroll result
  useEffect(() => {
    if (resultRef.current && generating) {
      const scrollArea = resultRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    }
  }, [resultado, generating]);

  // Switch to full-width result view when generation starts receiving
  useEffect(() => {
    if (hasStartedReceiving && !showResult) {
      setShowResult(true);
    }
  }, [hasStartedReceiving, showResult]);

  if (authLoading || subLoading || adminLoading) {
    return <PageSkeleton variant="dashboard" />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!hasAccess && !isAdmin) {
    return <Navigate to="/pricing" replace />;
  }

  const handleGenerate = async () => {
    if (!tema.trim()) {
      toast({
        title: 'Tema obrigatório',
        description: 'Por favor, insira o tema central para gerar o fechamento.',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    setResultado('');
    setHasStartedReceiving(false);
    setIsComplete(false);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-fechamento`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ tema, objetivos, modo }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao gerar fechamento');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

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
                  if (!hasStartedReceiving) {
                    setHasStartedReceiving(true);
                  }
                  fullText += content;
                  setResultado(fullText);
                }
              } catch {
                // Ignore parse errors for partial chunks
              }
            }
          }
        }
      }
      
      setIsComplete(true);
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Não foi possível gerar o fechamento. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    const cleanText = resultado
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*\*(.*?)\*\*\*/g, '$1')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/`{1,3}(.*?)`{1,3}/gs, '$1')
      .replace(/^\s*[-*+]\s+/gm, '• ')
      .replace(/^\s*\d+\.\s+/gm, (m) => m.trim() + ' ')
      .replace(/^>\s+/gm, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^---+$/gm, '')
      .replace(/\n{3,}/g, '\n\n');

    navigator.clipboard.writeText(cleanText.trim());
    toast({
      title: 'Copiado!',
      description: 'Fechamento copiado para a área de transferência.',
    });
  };

  const handleExportPDF = async () => {
    if (!resultRef.current || !resultado) return;
    
    setExporting(true);
    
    try {
      await exportToPDF({
        tema: tema.trim(),
        contentElement: resultRef.current
      });
      
      toast({
        title: 'PDF exportado!',
        description: 'O fechamento foi salvo como PDF.',
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível exportar o PDF. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleSave = async () => {
    if (!resultado || !user) return;
    
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('fechamentos')
        .insert({
          user_id: user.id,
          tema: tema.trim(),
          objetivos: objetivos.trim() || null,
          resultado,
        });

      if (error) throw error;

      toast({
        title: 'Salvo!',
        description: 'Fechamento salvo na sua biblioteca.',
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o fechamento. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateExam = async () => {
    if (!resultado || !user) return;
    
    try {
      const { error } = await supabase
        .from('fechamentos')
        .insert({
          user_id: user.id,
          tema: tema.trim(),
          objetivos: objetivos.trim() || null,
          resultado,
        })
        .select('id')
        .single();

      if (error) throw error;

      toast({
        title: 'Salvo!',
        description: 'Fechamento salvo. Redirecionando para o Modo Prática...',
      });

      navigate('/exam');
    } catch (error) {
      console.error('Save before exam error:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar antes de gerar a prova.',
        variant: 'destructive',
      });
    }
  };

  const handleBackToInput = () => {
    setShowResult(false);
  };

  const handleNewGeneration = () => {
    setShowResult(false);
    setResultado('');
    setIsComplete(false);
    setHasStartedReceiving(false);
    setTema('');
    setObjetivos('');
  };

  return (
    <PageTransition className="min-h-screen bg-background flex flex-col">
      <OnboardingTour steps={dashboardTourSteps} tourKey="dashboard" />
      
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 hidden md:block">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-primary/3 rounded-full opacity-50 will-change-transform" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/3 rounded-full opacity-50 will-change-transform" />
      </div>

      <DashboardHeader userEmail={user.email || ''} onLogout={signOut} />

      <main className="flex-1 container relative py-6 px-4">
        {showResult ? (
          /* Full-width result view with chat sidebar */
          <div className="flex gap-0 lg:gap-4 lg:h-[calc(100vh-8rem)]">
            <div className="flex-1 flex flex-col min-w-0">
              {/* Back button */}
              <div className="flex items-center gap-3 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToInput}
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Novo Fechamento
                </Button>
                {isComplete && (
                  <span className="text-xs text-muted-foreground">
                    Tema: <span className="font-medium text-foreground">{tema}</span>
                  </span>
                )}
              </div>

              <div className="flex-1 min-h-0">
                <ResultPanel
                  resultado={resultado}
                  generating={generating}
                  saving={saving}
                  exporting={exporting}
                  resultRef={resultRef}
                  modo={modo}
                  tema={tema}
                  onSave={handleSave}
                  onCopy={handleCopy}
                  onExportPDF={handleExportPDF}
                  onGenerateExam={handleGenerateExam}
                />
              </div>
            </div>

            {/* Chat sidebar */}
            {resultado && (
              <ContextChat context={resultado} contextLabel="fechamento" />
            )}
          </div>
        ) : (
          /* Two-column input view */
          <div className="grid lg:grid-cols-2 gap-6 lg:h-[calc(100vh-8rem)]">
            <InputPanel
              tema={tema}
              setTema={setTema}
              objetivos={objetivos}
              setObjetivos={setObjetivos}
              modo={modo}
              setModo={setModo}
              generating={generating}
              hasStartedReceiving={hasStartedReceiving}
              isComplete={isComplete}
              onGenerate={handleGenerate}
              canGenerate={canGenerate}
              cooldown={cooldown}
            />

            <ResultPanel
              resultado={resultado}
              generating={generating}
              saving={saving}
              exporting={exporting}
              resultRef={resultRef}
              modo={modo}
              tema={tema}
              onSave={handleSave}
              onCopy={handleCopy}
              onExportPDF={handleExportPDF}
              onGenerateExam={handleGenerateExam}
            />
          </div>
        )}
      </main>
    </PageTransition>
  );
};

export default Dashboard;
