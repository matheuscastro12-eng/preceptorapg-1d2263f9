import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  Library, 
  Star, 
  Trash2, 
  Search, 
  Calendar,
  FileText,
  ClipboardList,
  Stethoscope,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface ExamConfigData {
  quantidade: number;
  nivel: string;
  simulationMode: boolean;
}

export interface Fechamento {
  id: string;
  tema: string;
  objetivos: string | null;
  resultado: string;
  favorito: boolean;
  created_at: string;
  tipo: 'fechamento' | 'prova' | 'caso_clinico';
  exam_config: ExamConfigData | null;
}

interface FechamentoLibraryProps {
  onSelect: (fechamento: Fechamento) => void;
}

const FechamentoLibrary = ({ onSelect }: FechamentoLibraryProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fechamentos, setFechamentos] = useState<Fechamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | 'fechamento' | 'prova' | 'caso_clinico'>('all');
  const [deleteTarget, setDeleteTarget] = useState<Fechamento | null>(null);

  useEffect(() => {
    if (user) fetchFechamentos();
  }, [user]);

  const fetchFechamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('fechamentos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const normalized: Fechamento[] = (data ?? []).map((item) => {
        const tipo = item.tipo === 'prova' || item.tipo === 'caso_clinico' ? item.tipo : 'fechamento';
        const config = item.exam_config;
        const examConfig =
          config && typeof config === 'object' && !Array.isArray(config) &&
          'quantidade' in config && 'nivel' in config && 'simulationMode' in config
            ? { quantidade: Number(config.quantidade), nivel: String(config.nivel), simulationMode: Boolean(config.simulationMode) }
            : null;

        return { id: item.id, tema: item.tema, objetivos: item.objetivos, resultado: item.resultado, favorito: item.favorito, created_at: item.created_at, tipo, exam_config: examConfig };
      });

      setFechamentos(normalized);
    } catch (error) {
      console.error('Error fetching fechamentos:', error);
      toast({ title: 'Erro', description: 'Não foi possível carregar a biblioteca.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent, id: string, currentValue: boolean) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.from('fechamentos').update({ favorito: !currentValue }).eq('id', id);
      if (error) throw error;
      setFechamentos(prev => prev.map(f => (f.id === id ? { ...f, favorito: !currentValue } : f)));
      toast({ title: currentValue ? 'Removido dos favoritos' : 'Adicionado aos favoritos' });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível atualizar o favorito.', variant: 'destructive' });
    }
  };

  const deleteFechamento = async (id: string) => {
    try {
      const { error } = await supabase.from('fechamentos').delete().eq('id', id);
      if (error) throw error;
      setFechamentos(prev => prev.filter(f => f.id !== id));
      toast({ title: 'Excluído', description: 'Item removido da biblioteca.' });
    } catch {
      toast({ title: 'Erro', description: 'Não foi possível excluir.', variant: 'destructive' });
    }
  };

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case 'prova': return <ClipboardList className="h-4 w-4" />;
      case 'caso_clinico': return <Stethoscope className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (tipo: string) => {
    switch (tipo) {
      case 'prova': return 'Prova';
      case 'caso_clinico': return 'Caso Clínico';
      default: return 'Resumo';
    }
  };

  const getTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'prova': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'caso_clinico': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const filteredFechamentos = fechamentos.filter(f => {
    const matchesSearch = f.tema.toLowerCase().includes(searchTerm.toLowerCase()) || f.objetivos?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFavorites = showFavoritesOnly ? f.favorito : true;
    const matchesType = selectedType === 'all' ? true : f.tipo === selectedType;
    return matchesSearch && matchesFavorites && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Library className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Biblioteca Pessoal</h2>
          <p className="text-sm text-muted-foreground">{fechamentos.length} itens salvos</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por tema..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <Button variant={showFavoritesOnly ? 'default' : 'outline'} size="sm" onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} className="shrink-0">
            <Star className={`mr-2 h-4 w-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            Favoritos
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'Todos' },
            { value: 'fechamento', label: 'Fechamentos' },
            { value: 'prova', label: 'Provas' },
            { value: 'caso_clinico', label: 'Casos Clínicos' }
          ].map((type) => (
            <Button key={type.value} variant={selectedType === type.value ? 'default' : 'outline'} size="sm" onClick={() => setSelectedType(type.value as typeof selectedType)} className="text-xs">
              {type.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-44 rounded-xl border border-border/20 bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : filteredFechamentos.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Library className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">
            {searchTerm || showFavoritesOnly || selectedType !== 'all' ? 'Nenhum conteúdo encontrado.' : 'Nenhum conteúdo salvo ainda.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFechamentos.map((fechamento, index) => (
            <motion.div
              key={fechamento.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03, duration: 0.3 }}
            >
              <Card
                className="group relative cursor-pointer border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 h-full flex flex-col"
                onClick={() => onSelect(fechamento)}
              >
                <div className="p-4 flex flex-col flex-1">
                  {/* Type badge */}
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className={`text-[10px] font-medium ${getTypeColor(fechamento.tipo)}`}>
                      {getTypeIcon(fechamento.tipo)}
                      <span className="ml-1">{getTypeLabel(fechamento.tipo)}</span>
                    </Badge>
                    {fechamento.favorito && (
                      <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-sm leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {fechamento.tema}
                  </h3>

                  {/* Preview text */}
                  <p className="text-xs text-muted-foreground line-clamp-3 flex-1 mb-3">
                    {fechamento.resultado.replace(/[#*`>-]/g, '').slice(0, 150)}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/30">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(fechamento.created_at), "dd MMM yyyy", { locale: ptBR })}
                    </div>
                    <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => toggleFavorite(e, fechamento.id, fechamento.favorito)}
                      >
                        <Star className={`h-3.5 w-3.5 ${fechamento.favorito ? 'fill-primary text-primary' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(fechamento); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover da biblioteca?</AlertDialogTitle>
            <AlertDialogDescription>
              O item "<span className="font-medium">{deleteTarget?.tema}</span>" será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { if (deleteTarget) { deleteFechamento(deleteTarget.id); setDeleteTarget(null); } }}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FechamentoLibrary;
