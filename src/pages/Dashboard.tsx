import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import GenerationProgress from '@/components/GenerationProgress';
import ProfileDropdown from '@/components/ProfileDropdown';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdmin } from '@/hooks/useAdmin';
import { 
  Loader2, 
  Stethoscope, 
  Sparkles, 
  Copy, 
  BookOpen,
  Download,
  Save,
  FileText
} from 'lucide-react';

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [tema, setTema] = useState('');
  const [objetivos, setObjetivos] = useState('');
  const [resultado, setResultado] = useState('');
  const [generating, setGenerating] = useState(false);
  const [hasStartedReceiving, setHasStartedReceiving] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Auto-scroll result
  useEffect(() => {
    if (resultRef.current && generating) {
      const scrollArea = resultRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    }
  }, [resultado, generating]);

  if (authLoading || subLoading || adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
            <Stethoscope className="relative h-12 w-12 text-primary animate-float" />
          </div>
          <p className="text-muted-foreground animate-pulse">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Redirect to pricing if user doesn't have access and is not admin
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
      // Get user session token for authentication
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
          body: JSON.stringify({ tema, objetivos }),
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
    navigator.clipboard.writeText(resultado);
    toast({
      title: 'Copiado!',
      description: 'Fechamento copiado para a área de transferência.',
    });
  };

  const handleExportPDF = async () => {
    if (!resultRef.current || !resultado) return;
    
    setExporting(true);
    
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      const pdfContainer = document.createElement('div');
      pdfContainer.innerHTML = resultRef.current.innerHTML;
      
      pdfContainer.style.cssText = `
        background: white !important;
        color: #1a1a1a !important;
        padding: 20px 30px !important;
        font-family: 'Georgia', 'Times New Roman', serif !important;
        font-size: 11pt !important;
        line-height: 1.5 !important;
        width: 100% !important;
        max-width: none !important;
        overflow: visible !important;
      `;
      
      const allElements = pdfContainer.querySelectorAll('*');
      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.color = '#1a1a1a';
        htmlEl.style.background = 'transparent';
        htmlEl.style.maxHeight = 'none';
        htmlEl.style.overflow = 'visible';
      });
      
      const h1s = pdfContainer.querySelectorAll('h1');
      h1s.forEach((h1) => {
        (h1 as HTMLElement).style.cssText = 'color: #0d5c4d !important; font-size: 18pt !important; margin-bottom: 12px !important; font-weight: bold !important; page-break-after: avoid !important;';
      });
      
      const h2s = pdfContainer.querySelectorAll('h2');
      h2s.forEach((h2) => {
        (h2 as HTMLElement).style.cssText = 'color: #1a1a1a !important; font-size: 14pt !important; margin-top: 18px !important; margin-bottom: 10px !important; font-weight: bold !important; border-bottom: 1px solid #ccc !important; padding-bottom: 6px !important; page-break-after: avoid !important;';
      });
      
      const h3s = pdfContainer.querySelectorAll('h3');
      h3s.forEach((h3) => {
        (h3 as HTMLElement).style.cssText = 'color: #1a1a1a !important; font-size: 12pt !important; margin-top: 14px !important; margin-bottom: 6px !important; font-weight: bold !important; page-break-after: avoid !important;';
      });
      
      const strongs = pdfContainer.querySelectorAll('strong');
      strongs.forEach((strong) => {
        (strong as HTMLElement).style.cssText = 'color: #0d5c4d !important; font-weight: bold !important;';
      });

      const paragraphs = pdfContainer.querySelectorAll('p');
      paragraphs.forEach((p) => {
        (p as HTMLElement).style.cssText = 'color: #1a1a1a !important; margin-bottom: 8px !important; text-align: justify !important;';
      });

      const lists = pdfContainer.querySelectorAll('ul, ol');
      lists.forEach((list) => {
        (list as HTMLElement).style.cssText = 'color: #1a1a1a !important; margin-left: 20px !important; margin-bottom: 10px !important;';
      });

      const listItems = pdfContainer.querySelectorAll('li');
      listItems.forEach((li) => {
        (li as HTMLElement).style.cssText = 'color: #1a1a1a !important; margin-bottom: 4px !important;';
      });

      // Força cor preta em spans e outros elementos inline
      const spans = pdfContainer.querySelectorAll('span, em, code, a');
      spans.forEach((span) => {
        (span as HTMLElement).style.cssText = 'color: #1a1a1a !important;';
      });
      
      const opt = {
        margin: [10, 12, 10, 12] as [number, number, number, number],
        filename: `fechamento-${tema.trim().toLowerCase().replace(/\s+/g, '-')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.95 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
          windowWidth: 800,
        },
        jsPDF: { 
          unit: 'mm' as const, 
          format: 'a4' as const, 
          orientation: 'portrait' as const
        },
        pagebreak: { 
          mode: ['avoid-all', 'css', 'legacy'] as ('avoid-all' | 'css' | 'legacy')[],
          before: '.page-break-before',
          after: '.page-break-after',
          avoid: ['h1', 'h2', 'h3', 'h4', 'tr']
        }
      };
      
      await html2pdf().set(opt).from(pdfContainer).save();
      
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/30 glass-strong">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-primary/30 blur-lg" />
              <div className="relative rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 p-2.5">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div>
              <span className="font-display text-xl font-bold text-gradient-medical">
                PreceptorAPG
              </span>
              <p className="text-xs text-muted-foreground">Fechamentos com IA</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/library')}
              className="gap-2"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Biblioteca</span>
            </Button>
            <ProfileDropdown userEmail={user.email || ''} onLogout={signOut} />
          </div>
        </div>
      </header>

      {/* Main Content - Side by Side */}
      <main className="flex-1 container relative py-6 px-4">
        <div className="grid lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
          {/* Left Side - Input */}
          <div className="glass rounded-2xl p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Gerador de Fechamento</h2>
                <p className="text-sm text-muted-foreground">
                  Insira o tema e objetivos para gerar
                </p>
              </div>
            </div>

            <div className="space-y-4 flex-1">
              <div className="space-y-2">
                <Label htmlFor="tema" className="text-sm font-medium">
                  Tema Central <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="tema"
                  placeholder="Ex: Insuficiência Cardíaca Congestiva"
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                  disabled={generating}
                  className="h-12 bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
                />
              </div>
              
              <div className="space-y-2 flex-1">
                <Label htmlFor="objetivos" className="text-sm font-medium">
                  Objetivos <span className="text-muted-foreground text-xs">(opcional)</span>
                </Label>
                <Textarea
                  id="objetivos"
                  placeholder="Ex: Compreender a fisiopatologia, identificar sinais e sintomas, entender o tratamento..."
                  value={objetivos}
                  onChange={(e) => setObjetivos(e.target.value)}
                  disabled={generating}
                  className="min-h-[120px] resize-none bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <Button 
                className="w-full h-12 text-base font-semibold glow-medical hover-lift transition-all duration-300" 
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Estudando...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Estudar
                  </>
                )}
              </Button>

              {/* Progress Bar */}
              <GenerationProgress 
                isGenerating={generating}
                hasStartedReceiving={hasStartedReceiving}
                isComplete={isComplete}
              />
            </div>
          </div>

          {/* Right Side - Result */}
          <div className="glass rounded-2xl p-6 flex flex-col" ref={resultRef}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-accent/10 p-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-lg font-semibold">Resultado</h2>
              </div>
              
              {resultado && !generating && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSave}
                    disabled={saving}
                    className="hover-lift"
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Salvar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCopy}
                    className="hover-lift"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleExportPDF}
                    disabled={exporting}
                    className="hover-lift"
                  >
                    {exporting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    PDF
                  </Button>
                </div>
              )}
            </div>

            <ScrollArea className="flex-1 pr-4">
              {resultado ? (
                <MarkdownRenderer 
                  content={resultado} 
                  isTyping={generating && resultado.length > 0}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground">
                    Insira um tema e clique em "Gerar Fechamento"
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    O resultado aparecerá aqui com animação de typing
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
