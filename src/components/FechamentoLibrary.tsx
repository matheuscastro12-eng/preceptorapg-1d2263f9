import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Library, 
  Star, 
  Trash2, 
  Search, 
  Loader2,
  Calendar,
  Eye,
  FileText,
  ClipboardList,
  Stethoscope,
  Play
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExamConfigData {
  quantidade: number;
  nivel: string;
  simulationMode: boolean;
}

interface Fechamento {
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
  onFavoriteChange?: () => void;
  onRedoExam?: (fechamento: Fechamento) => void;
}

const FechamentoLibrary = ({ onSelect, onFavoriteChange, onRedoExam }: FechamentoLibraryProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fechamentos, setFechamentos] = useState<Fechamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | 'fechamento' | 'prova' | 'caso_clinico'>('all');

  useEffect(() => {
    if (user) {
      fetchFechamentos();
    }
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
          config &&
          typeof config === 'object' &&
          !Array.isArray(config) &&
          'quantidade' in config &&
          'nivel' in config &&
          'simulationMode' in config
            ? {
                quantidade: Number(config.quantidade),
                nivel: String(config.nivel),
                simulationMode: Boolean(config.simulationMode),
              }
            : null;

        return {
          id: item.id,
          tema: item.tema,
          objetivos: item.objetivos,
          resultado: item.resultado,
          favorito: item.favorito,
          created_at: item.created_at,
          tipo,
          exam_config: examConfig,
        };
      });

      setFechamentos(normalized);
    } catch (error) {
      console.error('Error fetching fechamentos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a biblioteca.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('fechamentos')
        .update({ favorito: !currentValue })
        .eq('id', id);

      if (error) throw error;

      setFechamentos(prev =>
        prev.map(f => (f.id === id ? { ...f, favorito: !currentValue } : f))
      );

      onFavoriteChange?.();

      toast({
        title: currentValue ? 'Removido dos favoritos' : 'Adicionado aos favoritos',
        description: currentValue 
          ? 'Fechamento removido dos favoritos.' 
          : 'Fechamento marcado como favorito.',
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o favorito.',
        variant: 'destructive',
      });
    }
  };

  const deleteFechamento = async (id: string) => {
    try {
      const { error } = await supabase
        .from('fechamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFechamentos(prev => prev.filter(f => f.id !== id));

      toast({
        title: 'Excluído',
        description: 'Fechamento removido da biblioteca.',
      });
    } catch (error) {
      console.error('Error deleting fechamento:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o fechamento.',
        variant: 'destructive',
      });
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
      default: return 'Fechamento';
    }
  };

  const filteredFechamentos = fechamentos.filter(f => {
    const matchesSearch = f.tema.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.objetivos?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFavorites = showFavoritesOnly ? f.favorito : true;
    const matchesType = selectedType === 'all' ? true : f.tipo === selectedType;
    return matchesSearch && matchesFavorites && matchesType;
  });

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Library className="h-5 w-5 text-primary" />
          Biblioteca Pessoal
        </CardTitle>
        <CardDescription>
          Seus conteúdos salvos ({fechamentos.length} itens)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por tema..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={showFavoritesOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className="shrink-0"
            >
              <Star className={`mr-2 h-4 w-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
              Favoritos
            </Button>
          </div>
          
          {/* Type Filter */}
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'Todos' },
              { value: 'fechamento', label: 'Fechamentos' },
              { value: 'prova', label: 'Provas' },
              { value: 'caso_clinico', label: 'Casos Clínicos' }
            ].map((type) => (
              <Button
                key={type.value}
                variant={selectedType === type.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(type.value as typeof selectedType)}
                className="text-xs"
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Fechamentos List */}
        {loading ? (
          <div className="space-y-2 py-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border/20 p-3 animate-pulse">
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-48 bg-muted rounded" />
                  <div className="h-3 w-28 bg-muted rounded" />
                </div>
                <div className="flex gap-1">
                  <div className="h-8 w-8 bg-muted rounded" />
                  <div className="h-8 w-8 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredFechamentos.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {searchTerm || showFavoritesOnly || selectedType !== 'all'
              ? 'Nenhum conteúdo encontrado.'
              : 'Nenhum conteúdo salvo ainda.'}
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {filteredFechamentos.map((fechamento) => (
                <div
                  key={fechamento.id}
                  className="group flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="truncate font-medium">{fechamento.tema}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {getTypeIcon(fechamento.tipo)}
                        <span className="ml-1">{getTypeLabel(fechamento.tipo)}</span>
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(fechamento.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                      {fechamento.exam_config && (
                        <>
                          <span>•</span>
                          <span>{fechamento.exam_config.quantidade}Q • {fechamento.exam_config.nivel}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {(fechamento.tipo === 'prova' || fechamento.tipo === 'caso_clinico') && onRedoExam && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary"
                        onClick={() => onRedoExam(fechamento)}
                        title="Refazer"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onSelect(fechamento)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleFavorite(fechamento.id, fechamento.favorito)}
                    >
                      <Star className={`h-4 w-4 ${fechamento.favorito ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive sm:opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => deleteFechamento(fechamento.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default FechamentoLibrary;
