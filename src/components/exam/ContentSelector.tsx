import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Search, Loader2, Library, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Fechamento {
  id: string;
  tema: string;
  objetivos: string | null;
  resultado: string;
  favorito: boolean;
  created_at: string;
}

interface ContentSelectorProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  disabled?: boolean;
}

const ContentSelector = ({ selectedIds, onSelectionChange, disabled }: ContentSelectorProps) => {
  const { user } = useAuth();
  const [fechamentos, setFechamentos] = useState<Fechamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

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
      setFechamentos(data || []);
    } catch (error) {
      console.error('Error fetching fechamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = fechamentos.filter(f => {
    const matchesSearch = f.tema.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFavorites = showFavoritesOnly ? f.favorito : true;
    return matchesSearch && matchesFavorites;
  });

  const toggleItem = (id: string) => {
    if (disabled) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(x => x !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const toggleAll = () => {
    if (disabled) return;
    if (selectedIds.length === filtered.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filtered.map(f => f.id));
    }
  };

  const getSelectedContent = () => {
    return fechamentos
      .filter(f => selectedIds.includes(f.id))
      .map(f => `## ${f.tema}\n\n${f.resultado}`)
      .join('\n\n---\n\n');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Library className="h-4 w-4 text-primary" />
        <Label className="text-sm font-medium">
          Selecione o conteúdo da prova
        </Label>
        {selectedIds.length > 0 && (
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
            {selectedIds.length} selecionado{selectedIds.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por tema..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={disabled}
            className="pl-9 h-9 bg-background/60 border-border/40"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={showFavoritesOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            disabled={disabled}
            className="shrink-0 h-9"
          >
            <Star className={`mr-1.5 h-3.5 w-3.5 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            Favoritos
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAll}
            disabled={disabled}
            className="shrink-0 h-9"
          >
            {selectedIds.length === filtered.length && filtered.length > 0 ? 'Desmarcar' : 'Selecionar'} todos
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground text-sm">
          {fechamentos.length === 0
            ? 'Nenhum resumo salvo. Gere e salve conteúdo no Dashboard primeiro.'
            : 'Nenhum resultado encontrado.'}
        </div>
      ) : (
        <ScrollArea className="h-[280px] rounded-lg border border-border/30 bg-background/40">
          <div className="p-2 space-y-1">
            {filtered.map((f) => (
              <label
                key={f.id}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors hover:bg-accent/10 ${
                  selectedIds.includes(f.id) ? 'bg-primary/10 border border-primary/20' : 'border border-transparent'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Checkbox
                  checked={selectedIds.includes(f.id)}
                  onCheckedChange={() => toggleItem(f.id)}
                  disabled={disabled}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{f.tema}</span>
                    {f.favorito && <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 shrink-0" />}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(f.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default ContentSelector;
export type { Fechamento };
