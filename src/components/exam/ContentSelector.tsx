import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Star, FileText, ArrowRight } from 'lucide-react';

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

const MI = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const ContentSelector = ({ selectedIds, onSelectionChange, disabled }: ContentSelectorProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fechamentos, setFechamentos] = useState<Fechamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filtered = fechamentos.filter(f =>
    f.tema.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleItem = (id: string) => {
    if (disabled) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(x => x !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <div className="bg-[#f3f4f5] p-6 sm:p-8 rounded-xl space-y-6">
      {/* Search */}
      <div className="relative">
        <MI name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6e7975] text-[20px]" />
        <input
          type="text"
          placeholder="Buscar nos meus resumos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={disabled}
          className="w-full pl-12 pr-4 py-3 bg-white border-none rounded-lg text-sm text-[#191c1d] placeholder:text-[#6e7975]/60 focus:outline-none focus:ring-2 focus:ring-[#006D5B]/20 shadow-sm disabled:opacity-50"
        />
      </div>

      {/* Content grid */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-[#006D5B]" />
        </div>
      ) : filtered.length === 0 ? (
        fechamentos.length === 0 ? (
          <div className="py-8 px-5 text-center bg-gradient-to-br from-[#FFF9E8] to-[#FEF3CD] border border-[#C9A84C]/30 rounded-xl">
            <div className="mx-auto w-12 h-12 rounded-full bg-[#C9A84C]/15 flex items-center justify-center mb-3">
              <FileText className="w-6 h-6 text-[#8a6f26]" />
            </div>
            <h3 className="text-base font-bold text-[#191c1d] mb-1 font-['Manrope']">
              Voce precisa gerar um resumo primeiro
            </h3>
            <p className="text-sm text-[#4a5568] max-w-md mx-auto mb-4 leading-relaxed">
              Os simulados sao construidos a partir dos resumos/fechamentos que voce salva na biblioteca. Gere pelo menos um em <strong>Estudos com IA</strong> antes de vir pra ca.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#006D5B] text-white text-sm font-bold rounded-lg hover:bg-[#005344] active:scale-95 transition-all shadow-md"
            >
              Ir para Estudos com IA
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="py-8 text-center text-[#6e7975] text-sm">
            Nenhum resultado encontrado.
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {filtered.map((f) => {
            const isSelected = selectedIds.includes(f.id);
            return (
              <label
                key={f.id}
                onClick={() => toggleItem(f.id)}
                className={`flex items-center gap-3 p-4 bg-white rounded-lg cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-2 border-[#005344] shadow-sm'
                    : 'border border-transparent hover:border-[#bec9c4]/30'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleItem(f.id)}
                  disabled={disabled}
                  className="border-[#bec9c4] data-[state=checked]:bg-[#005344] data-[state=checked]:border-[#005344]"
                />
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-semibold truncate block ${isSelected ? 'text-[#005344]' : 'text-[#3e4945]'}`}>
                    {f.tema}
                  </span>
                </div>
                {f.favorito && <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ContentSelector;
export type { Fechamento };
