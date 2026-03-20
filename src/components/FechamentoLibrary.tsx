import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  ChevronRight,
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

  const getTypeConfig = (tipo: string) => {
    switch (tipo) {
      case 'prova':
        return { icon: <ClipboardList className="h-3.5 w-3.5" strokeWidth={1.5} />, label: 'Prova', color: 'text-blue-500', bg: 'bg-blue-500/8', border: 'border-l-blue-500' };
      case 'caso_clinico':
        return { icon: <Stethoscope className="h-3.5 w-3.5" strokeWidth={1.5} />, label: 'Caso Clínico', color: 'text-amber-500', bg: 'bg-amber-500/8', border: 'border-l-amber-500' };
      default:
        return { icon: <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />, label: 'Resumo', color: 'text-primary', bg: 'bg-primary/8', border: 'border-l-primary' };
    }
  };

  const filteredFechamentos = fechamentos.filter(f => {
    const matchesSearch = f.tema.toLowerCase().includes(searchTerm.toLowerCase()) || f.objetivos?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFavorites = showFavoritesOnly ? f.favorito : true;
    const matchesType = selectedType === 'all' ? true : f.tipo === selectedType;
    return matchesSearch && matchesFavorites && matchesType;
  });

  const typeFilters: { value: typeof selectedType; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'fechamento', label: 'Resumos' },
    { value: 'prova', label: 'Provas' },
    { value: 'caso_clinico', label: 'Casos' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Biblioteca Pessoal</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{fechamentos.length} itens salvos</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
            <Input
              placeholder="Buscar por tema..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm bg-background"
            />
          </div>
          <Button
            variant={showFavoritesOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className="gap-1.5 h-9 shrink-0"
          >
            <Star className={`h-3.5 w-3.5 ${showFavoritesOnly ? 'fill-current' : ''}`} strokeWidth={1.5} />
            <span className="hidden sm:inline">Favoritos</span>
          </Button>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {typeFilters.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`px-3 py-1.5 text-[12px] font-semibold rounded-lg transition-all duration-200 active:scale-95 ${
                selectedType === type.value
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-50 bg-white shadow-sm">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5 animate-pulse">
              <div className="h-8 w-8 rounded-lg bg-surface-container-high shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 rounded bg-surface-container-high" />
                <div className="h-2.5 w-1/2 rounded bg-surface-container" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredFechamentos.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <Library className="h-10 w-10 mx-auto mb-4 opacity-20" strokeWidth={1} />
          <p className="text-sm font-medium">
            {searchTerm || showFavoritesOnly || selectedType !== 'all'
              ? 'Nenhum conteúdo encontrado.'
              : 'Nenhum conteúdo salvo ainda.'}
          </p>
          {!searchTerm && !showFavoritesOnly && selectedType === 'all' && (
            <p className="text-xs text-muted-foreground/60 mt-1">Gere resumos ou simulados para começar.</p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-100 overflow-hidden divide-y divide-slate-50 bg-white shadow-sm">
          {filteredFechamentos.map((fechamento, index) => {
            const typeConfig = getTypeConfig(fechamento.tipo);
            return (
              <motion.div
                key={fechamento.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.3, ease: 'easeOut' }}
              >
                <div
                  className={`group relative flex items-center gap-4 px-4 py-3.5 hover:bg-emerald-50/40 transition-all duration-200 cursor-pointer border-l-2 ${typeConfig.border}`}
                  onClick={() => onSelect(fechamento)}
                >
                  {/* Icon */}
                  <div className={`h-8 w-8 rounded-lg ${typeConfig.bg} flex items-center justify-center shrink-0 ${typeConfig.color} transition-transform duration-200 group-hover:scale-110`}>
                    {typeConfig.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold truncate group-hover:text-emerald-700 transition-colors duration-200">
                        {fechamento.tema}
                      </p>
                      {fechamento.favorito && (
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className={`text-[11px] font-medium ${typeConfig.color}`}>{typeConfig.label}</span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(fechamento.created_at), "dd MMM yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground/60 mt-1 line-clamp-1 hidden sm:block">
                      {fechamento.resultado.replace(/[#*`>-]/g, '').slice(0, 120)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0">
                    <button
                      className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-amber-400 hover:bg-amber-50 transition-all duration-200 active:scale-95"
                      onClick={(e) => toggleFavorite(e, fechamento.id, fechamento.favorito)}
                    >
                      <Star className={`h-3.5 w-3.5 transition-transform duration-200 hover:scale-110 ${fechamento.favorito ? 'fill-amber-400 text-amber-400' : ''}`} />
                    </button>
                    <button
                      className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all duration-200 active:scale-95"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(fechamento); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-slate-400 group-hover:translate-x-0.5 shrink-0 transition-all duration-200" />
                </div>
              </motion.div>
            );
          })}
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
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteTarget) { deleteFechamento(deleteTarget.id); setDeleteTarget(null); } }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FechamentoLibrary;
