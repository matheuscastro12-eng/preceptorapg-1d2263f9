import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdmin } from '@/hooks/useAdmin';
import { Stethoscope } from 'lucide-react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import InputPanel from '@/components/dashboard/InputPanel';
import ResultPanel from '@/components/dashboard/ResultPanel';

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdmin();
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
      
      // H1 - Título principal (capa)
      const h1s = pdfContainer.querySelectorAll('h1');
      h1s.forEach((h1, index) => {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = index === 0 
          ? 'display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 200px; text-align: center; margin-bottom: 30px;'
          : 'display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 200px; text-align: center; margin-bottom: 30px; page-break-before: always;';
        (h1 as HTMLElement).style.cssText = 'color: #0d5c4d !important; font-size: 24pt !important; font-weight: bold !important; text-transform: uppercase !important; letter-spacing: 2px !important; border-bottom: 3px solid #0d5c4d !important; padding-bottom: 15px !important; margin: 0 !important;';
        h1.parentNode?.insertBefore(wrapper, h1);
        wrapper.appendChild(h1);
      });
      
      // H2 - Seções principais (capa de seção)
      const h2s = pdfContainer.querySelectorAll('h2');
      h2s.forEach((h2) => {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 180px; text-align: center; margin-bottom: 25px; page-break-before: always;';
        (h2 as HTMLElement).style.cssText = 'color: #0d5c4d !important; font-size: 20pt !important; font-weight: bold !important; text-transform: uppercase !important; letter-spacing: 1.5px !important; border-bottom: 2px solid #0d5c4d !important; padding-bottom: 12px !important; margin: 0 !important;';
        h2.parentNode?.insertBefore(wrapper, h2);
        wrapper.appendChild(h2);
      });
      
      // H3 - Subseções (não quebra página, mas destaca)
      const h3s = pdfContainer.querySelectorAll('h3');
      h3s.forEach((h3) => {
        (h3 as HTMLElement).style.cssText = 'color: #0d5c4d !important; font-size: 14pt !important; margin-top: 20px !important; margin-bottom: 10px !important; font-weight: bold !important; border-left: 4px solid #0d5c4d !important; padding-left: 12px !important; page-break-after: avoid !important;';
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
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-primary/3 to-accent/3 rounded-full blur-3xl" />
      </div>

      <DashboardHeader userEmail={user.email || ''} onLogout={signOut} />

      <main className="flex-1 container relative py-6 px-4">
        <div className="grid lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
          <InputPanel
            tema={tema}
            setTema={setTema}
            objetivos={objetivos}
            setObjetivos={setObjetivos}
            generating={generating}
            hasStartedReceiving={hasStartedReceiving}
            isComplete={isComplete}
            onGenerate={handleGenerate}
          />

          <ResultPanel
            resultado={resultado}
            generating={generating}
            saving={saving}
            exporting={exporting}
            resultRef={resultRef}
            onSave={handleSave}
            onCopy={handleCopy}
            onExportPDF={handleExportPDF}
          />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
