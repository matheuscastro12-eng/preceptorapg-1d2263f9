import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { 
  Loader2, 
  Stethoscope, 
  LogOut, 
  Sparkles, 
  Copy, 
  BookOpen,
  FileText,
  Download
} from 'lucide-react';

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const [tema, setTema] = useState('');
  const [objetivos, setObjetivos] = useState('');
  const [resultado, setResultado] = useState('');
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
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

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-fechamento`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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
      
      // Create a styled clone for PDF
      const element = resultRef.current;
      const clonedElement = element.cloneNode(true) as HTMLElement;
      
      // Apply print-friendly styles
      clonedElement.style.cssText = `
        background: white !important;
        color: #1a1a1a !important;
        padding: 40px !important;
        font-family: 'Georgia', 'Times New Roman', serif !important;
        font-size: 12pt !important;
        line-height: 1.6 !important;
      `;
      
      // Style all text elements for print
      const allElements = clonedElement.querySelectorAll('*');
      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.color = '#1a1a1a';
        htmlEl.style.background = 'transparent';
      });
      
      // Style headings
      const h1s = clonedElement.querySelectorAll('h1');
      h1s.forEach((h1) => {
        (h1 as HTMLElement).style.cssText = 'color: #0d5c4d !important; font-size: 20pt !important; margin-bottom: 16px !important; font-weight: bold !important;';
      });
      
      const h2s = clonedElement.querySelectorAll('h2');
      h2s.forEach((h2) => {
        (h2 as HTMLElement).style.cssText = 'color: #1a1a1a !important; font-size: 16pt !important; margin-top: 24px !important; margin-bottom: 12px !important; font-weight: bold !important; border-bottom: 1px solid #ccc !important; padding-bottom: 8px !important;';
      });
      
      const h3s = clonedElement.querySelectorAll('h3');
      h3s.forEach((h3) => {
        (h3 as HTMLElement).style.cssText = 'color: #1a1a1a !important; font-size: 14pt !important; margin-top: 18px !important; margin-bottom: 8px !important; font-weight: bold !important;';
      });
      
      // Style bold/strong elements
      const strongs = clonedElement.querySelectorAll('strong');
      strongs.forEach((strong) => {
        (strong as HTMLElement).style.cssText = 'color: #0d5c4d !important; font-weight: bold !important;';
      });
      
      const opt = {
        margin: [15, 15, 15, 15] as [number, number, number, number],
        filename: `fechamento-${tema.trim().toLowerCase().replace(/\s+/g, '-')}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          logging: false,
        },
        jsPDF: { 
          unit: 'mm' as const, 
          format: 'a4' as const, 
          orientation: 'portrait' as const
        },
        pagebreak: { mode: 'avoid-all' as const }
      };
      
      await html2pdf().set(opt).from(clonedElement).save();
      
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

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Stethoscope className="h-6 w-6 text-primary" />
            </div>
            <span className="font-display text-xl font-bold text-gradient-medical">
              Castro's PBL
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:block">
              {user.email}
            </span>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Input Form */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Gerador de Fechamento
              </CardTitle>
              <CardDescription>
                Insira o tema e objetivos para gerar um fechamento completo com IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tema">
                  Tema Central <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="tema"
                  placeholder="Ex: Insuficiência Cardíaca Congestiva"
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                  disabled={generating}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="objetivos">
                  Objetivos de Aprendizado <span className="text-muted-foreground">(opcional)</span>
                </Label>
                <Textarea
                  id="objetivos"
                  placeholder="Ex: Compreender a fisiopatologia, identificar os principais sinais clínicos..."
                  value={objetivos}
                  onChange={(e) => setObjetivos(e.target.value)}
                  disabled={generating}
                  className="min-h-[120px]"
                />
              </div>
              
              <Button 
                className="w-full glow-medical" 
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando fechamento...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Gerar Fechamento com IA
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Result Area */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Resultado
                </CardTitle>
                {resultado && !generating && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleExportPDF}
                      disabled={exporting}
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
              <CardDescription>
                O fechamento gerado aparecerá aqui formatado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generating && !resultado ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      Gerando conteúdo com alta densidade técnica...
                    </p>
                  </div>
                </div>
              ) : resultado ? (
                <div 
                  ref={resultRef}
                  className="max-h-[600px] overflow-y-auto rounded-lg bg-background/50 p-4"
                >
                  <MarkdownRenderer content={resultado} />
                </div>
              ) : (
                <div className="flex items-center justify-center py-16 text-center">
                  <div>
                    <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-muted-foreground">
                      Insira um tema e clique em "Gerar" para criar seu fechamento
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
