import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';
import logoPreceptor from '@/assets/logo-preceptor.png';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: 'Erro', description: 'As senhas não coincidem.', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Erro', description: 'A senha deve ter pelo menos 6 caracteres.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      setSuccess(true);
      toast({ title: 'Senha atualizada!', description: 'Sua senha foi redefinida com sucesso.' });
      setTimeout(() => navigate('/menu'), 2000);
    }
    setLoading(false);
  };

  if (!isRecovery) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4 max-w-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verificando link de recuperação...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[420px] space-y-8"
      >
        <div className="text-center">
          <div className="mb-4 inline-flex rounded-2xl bg-primary/10 p-3">
            <img src={logoPreceptor} alt="PreceptorMED" className="h-10 w-10 rounded-xl" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Redefinir senha</h1>
          <p className="text-sm text-muted-foreground mt-1">Escolha uma nova senha para sua conta</p>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4 py-8"
          >
            <div className="inline-flex rounded-full bg-primary/10 p-4">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <p className="text-foreground font-medium">Senha atualizada com sucesso!</p>
            <p className="text-sm text-muted-foreground">Redirecionando...</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm font-medium">Nova senha</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-11 rounded-xl bg-secondary/30 border-border/40 focus:border-primary/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password" className="text-sm font-medium">Confirmar nova senha</Label>
              <Input
                id="confirm-new-password"
                type="password"
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="h-11 rounded-xl bg-secondary/30 border-border/40 focus:border-primary/50"
              />
            </div>
            <Button type="submit" className="w-full h-11 rounded-xl font-medium" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Atualizando...</> : 'Redefinir senha'}
            </Button>
          </form>
        )}

        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="text-muted-foreground hover:text-foreground gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Voltar para login
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
