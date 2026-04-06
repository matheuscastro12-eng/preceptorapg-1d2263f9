import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { GraduationCap, Stethoscope, FileText, Loader2, Sparkles } from 'lucide-react';
import logoIcon from '@/assets/logo-icon.png';

const PHASES = [
  {
    value: 'graduacao',
    label: 'Graduação',
    description: 'Estou na faculdade de medicina',
    icon: GraduationCap,
    color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 hover:border-blue-400',
    iconColor: 'text-blue-400',
  },
  {
    value: 'residencia',
    label: 'Internato / Residência',
    description: 'Estou me preparando para residencia',
    icon: Stethoscope,
    color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 hover:border-emerald-400',
    iconColor: 'text-emerald-400',
  },
  {
    value: 'revalida',
    label: 'Revalida / ENAMED',
    description: 'Vou fazer Revalida ou ENAMED',
    icon: FileText,
    color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 hover:border-amber-400',
    iconColor: 'text-amber-400',
  },
];

export default function Welcome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (!selected || !user) return;
    setSaving(true);

    try {
      // Salvar no profile
      await supabase
        .from('profiles')
        .update({ fase_medica: selected })
        .eq('user_id', user.id);

      // Salvar no CRM lead (se existir)
      await supabase
        .from('crm_leads')
        .update({ fase_medica: selected })
        .eq('user_id', user.id);

      navigate('/menu', { replace: true });
    } catch (e) {
      console.error(e);
      navigate('/menu', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg space-y-8">
        {/* Logo + greeting */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center">
            <img src={logoIcon} alt="PreceptorMED" className="h-16 w-16" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground font-display">
              Bem-vindo ao PreceptorMED!
            </h1>
            <p className="text-muted-foreground mt-2">
              Para personalizar sua experiência, nos conte sobre você.
            </p>
          </div>
        </div>

        {/* Phase question */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Qual sua fase atual?</p>
          </div>

          <div className="space-y-3">
            {PHASES.map((phase) => {
              const Icon = phase.icon;
              const isSelected = selected === phase.value;

              return (
                <button
                  key={phase.value}
                  onClick={() => setSelected(phase.value)}
                  className={`
                    w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200
                    bg-gradient-to-r ${phase.color}
                    ${isSelected
                      ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]'
                      : 'opacity-80 hover:opacity-100'
                    }
                  `}
                >
                  <div className={`p-3 rounded-xl bg-background/50 ${phase.iconColor}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">{phase.label}</p>
                    <p className="text-sm text-muted-foreground">{phase.description}</p>
                  </div>
                  {isSelected && (
                    <div className="ml-auto">
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={!selected || saving}
          className={`
            w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-200
            flex items-center justify-center gap-2
            ${selected
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
            }
          `}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {saving ? 'Salvando...' : 'Continuar'}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          Você pode alterar isso depois no seu perfil.
        </p>
      </div>
    </div>
  );
}
