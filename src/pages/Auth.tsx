import { useState, useEffect } from 'react';
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, BookOpen, Brain, FileText, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { motion, AnimatePresence } from 'framer-motion';
import logoPreceptor from '@/assets/logo-preceptor.png';

const Auth = () => {
  const { user, loading: authLoading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [redirectingToCheckout, setRedirectingToCheckout] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';
  const planType = searchParams.get('plan') as 'monthly' | 'annual' | null;

  useEffect(() => {
    const redirectToCheckout = async () => {
      if (user && planType && !redirectingToCheckout) {
        setRedirectingToCheckout(true);
        try {
          const { data, error } = await supabase.functions.invoke('create-checkout', {
            body: { planType }
          });
          if (error) throw error;
          if (data?.url) window.location.href = data.url;
        } catch (error) {
          console.error('Checkout error:', error);
          toast({ title: 'Erro', description: 'Não foi possível iniciar o checkout.', variant: 'destructive' });
          setRedirectingToCheckout(false);
        }
      }
    };
    redirectToCheckout();
  }, [user, planType, redirectingToCheckout, toast]);

  if (authLoading || redirectingToCheckout) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          {redirectingToCheckout && <p className="text-muted-foreground">Redirecionando para o checkout...</p>}
        </div>
      </div>
    );
  }

  if (user && !planType) return <Navigate to="/menu" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    if (error) toast({ title: 'Erro ao entrar', description: error.message, variant: 'destructive' });
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPassword !== signupConfirmPassword) {
      toast({ title: 'Erro', description: 'As senhas não coincidem', variant: 'destructive' });
      return;
    }
    if (signupPassword.length < 6) {
      toast({ title: 'Erro', description: 'A senha deve ter pelo menos 6 caracteres', variant: 'destructive' });
      return;
    }
    setLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName);
    if (error) {
      toast({ title: 'Erro ao criar conta', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Conta criada!', description: 'Verifique seu email para confirmar o cadastro.' });
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Email enviado!', description: 'Verifique sua caixa de entrada para redefinir a senha.' });
      setShowForgotPassword(false);
    }
    setForgotLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast({ title: 'Erro ao entrar com Google', description: error.message, variant: 'destructive' });
      setLoading(false);
    }
  };

  const features = [
    { icon: FileText, text: 'Resumos estruturados com IA' },
    { icon: Brain, text: 'Simulados no estilo residência' },
    { icon: BookOpen, text: 'Biblioteca pessoal organizada' },
  ];

  return (
    <div className="flex min-h-screen relative overflow-hidden">
      {/* Left Panel - Visual Branding */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center p-12 overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(168,76%,22%) 0%, hsl(168,76%,36%) 50%, hsl(160,60%,30%) 100%)' }}>
        {/* Animated background shapes — all green tones */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-20 -left-20 w-72 h-72 rounded-full"
            style={{ background: 'radial-gradient(circle, hsla(168,76%,50%,0.2) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-10 right-10 w-96 h-96 rounded-full"
            style={{ background: 'radial-gradient(circle, hsla(160,70%,40%,0.12) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.15, 1], x: [0, -20, 0], y: [0, 20, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />
          <motion.div
            className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full"
            style={{ background: 'radial-gradient(circle, hsla(168,60%,45%,0.1) 0%, transparent 70%)' }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
        </div>

        <div className="relative z-10 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-6">
              <img src={logoPreceptor} alt="PreceptorMED" className="h-12 w-12 rounded-xl" />
              <span className="text-2xl font-bold text-white font-display tracking-tight">PreceptorMED</span>
            </div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Estude medicina de forma{' '}
              <span className="relative">
                inteligente
                <motion.span
                  className="absolute -bottom-1 left-0 h-1 rounded-full bg-white/40"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                />
              </span>
            </h2>
            <p className="text-lg text-white/80 leading-relaxed">
              Fechamentos, simulados e casos clínicos gerados por IA — tudo integrado para a metodologia PBL.
            </p>
          </motion.div>

          <div className="space-y-4">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }}
                className="flex items-center gap-4 rounded-xl bg-white/10 backdrop-blur-sm px-5 py-4 border border-white/10"
              >
                <div className="flex-shrink-0 rounded-lg bg-white/15 p-2.5">
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-white/90 font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-10 flex items-center gap-3 text-white/50 text-sm"
          >
            <img 
              src={logoPreceptor} 
              alt="PreceptorMED" 
              className="h-4 w-auto opacity-50"
            />
            <span>Usado por estudantes de medicina em todo o Brasil</span>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-[45%] bg-background relative">
        {/* Back button */}
        <div className="absolute top-6 left-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>

        {/* Mobile branding */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center lg:hidden"
        >
          <div className="mb-3 inline-flex rounded-2xl bg-primary/10 p-3">
            <img src={logoPreceptor} alt="PreceptorMED" className="h-10 w-10 rounded-xl" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gradient-medical">PreceptorMED</h1>
          <p className="text-sm text-muted-foreground mt-1">Fechamentos com IA para medicina</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-[420px]"
        >
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 h-12 p-1 bg-secondary/50 rounded-xl">
              <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-medium text-sm">
                Entrar
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-medium text-sm">
                Criar Conta
              </TabsTrigger>
            </TabsList>

            {/* Login */}
            <TabsContent value="login" className="mt-0 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Bem-vindo de volta</h2>
                <p className="text-muted-foreground text-sm mt-1">Entre para acessar sua biblioteca de estudos</p>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-sm font-medium border-border/60 hover:bg-secondary/50 rounded-xl"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="mr-2.5 h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar com Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/40" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-3 text-muted-foreground">ou com email</span>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-11 rounded-xl bg-secondary/30 border-border/40 focus:border-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm font-medium">Senha</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-11 rounded-xl bg-secondary/30 border-border/40 focus:border-primary/50"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Button type="submit" className="flex-1 h-11 rounded-xl font-medium" disabled={loading}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Entrando...</> : 'Entrar'}
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors w-fit"
                >
                  Esqueci minha senha
                </button>
              </form>

              {/* Forgot password modal */}
              <AnimatePresence>
                {showForgotPassword && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border border-border/40 bg-secondary/20 p-5 space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Recuperar senha</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Enviaremos um link para redefinir sua senha.</p>
                      </div>
                      <form onSubmit={handleForgotPassword} className="space-y-3">
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          required
                          disabled={forgotLoading}
                          className="h-10 rounded-xl bg-background border-border/40 focus:border-primary/50"
                        />
                        <div className="flex gap-2">
                          <Button type="button" variant="ghost" size="sm" onClick={() => setShowForgotPassword(false)} className="rounded-lg">
                            Cancelar
                          </Button>
                          <Button type="submit" size="sm" disabled={forgotLoading} className="rounded-lg flex-1">
                            {forgotLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar link'}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            {/* Signup */}
            <TabsContent value="signup" className="mt-0 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Crie sua conta grátis</h2>
                <p className="text-muted-foreground text-sm mt-1">Comece agora — sem cartão de crédito</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 rounded-full px-3 py-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />2 perguntas/dia grátis
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 rounded-full px-3 py-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />Acesso imediato
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-sm font-medium border-border/60 hover:bg-secondary/50 rounded-xl"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="mr-2.5 h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Criar conta com Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/40" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-3 text-muted-foreground">ou com email</span>
                </div>
              </div>

              <form onSubmit={handleSignup} className="space-y-3.5">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-sm font-medium">Nome completo</Label>
                  <Input id="signup-name" type="text" placeholder="Seu nome" value={signupName} onChange={(e) => setSignupName(e.target.value)} required disabled={loading} className="h-11 rounded-xl bg-secondary/30 border-border/40 focus:border-primary/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                  <Input id="signup-email" type="email" placeholder="seu@email.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required disabled={loading} className="h-11 rounded-xl bg-secondary/30 border-border/40 focus:border-primary/50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium">Senha</Label>
                    <Input id="signup-password" type="password" placeholder="Mín. 6 caracteres" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required disabled={loading} className="h-11 rounded-xl bg-secondary/30 border-border/40 focus:border-primary/50" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm" className="text-sm font-medium">Confirmar</Label>
                    <Input id="signup-confirm" type="password" placeholder="Repita a senha" value={signupConfirmPassword} onChange={(e) => setSignupConfirmPassword(e.target.value)} required disabled={loading} className="h-11 rounded-xl bg-secondary/30 border-border/40 focus:border-primary/50" />
                  </div>
                </div>
                <Button type="submit" className="w-full h-11 rounded-xl font-medium" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando conta...</> : 'Criar Conta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-center text-xs text-muted-foreground/60 mt-8">
            Ao continuar, você concorda com os termos de uso e política de privacidade.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
