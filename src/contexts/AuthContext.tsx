import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { convertVisitorToSignup } from '@/hooks/useVisitorTracking';
import { applyFirstTouchToProfile, getFirstTouch } from '@/lib/attribution';
import { trackCompleteRegistration } from '@/lib/metaPixel';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, phone?: string, signupIntent?: 'paid_signup' | 'organic') => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Then check for existing session — clean up if CRM service account leaked
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user?.email === 'crm-service@thepreceptor.com.br') {
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string, phone?: string, signupIntent?: 'paid_signup' | 'organic') => {
    // First-touch capturado na 1ª visita (localStorage). Vai no
    // raw_user_meta_data para o trigger handle_new_user gravar em
    // profiles.first_utm_* na criação — caminho server-side, imune a RLS
    // e à corrida que antes deixava 100% dos cadastros como "Direto".
    const ft = getFirstTouch();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: name,
          phone: phone || '',
          // Quando 'paid_signup', o trigger pula o trial gratuito
          // (usuario veio do botao de assinatura — webhook EasyFlow cria sub paga)
          signup_intent: signupIntent ?? 'organic',
          // Atribuição first-touch (lida pelo trigger na criação do profile)
          first_utm_source: ft?.utm_source ?? null,
          first_utm_medium: ft?.utm_medium ?? null,
          first_utm_campaign: ft?.utm_campaign ?? null,
          first_landing_page: ft?.landing_page ?? null,
          first_touch_at: ft?.ts ?? null,
        },
      },
    });

    // CRM: converter visitor anonimo em lead com status "signup"
    if (!error && data.user) {
      convertVisitorToSignup({
        userId: data.user.id,
        email,
        fullName: name,
      });
      // Backup best-effort (caso haja sessão imediata): grava o first-touch
      // direto no profile. Idempotente com o trigger — não bloqueia o fluxo.
      applyFirstTouchToProfile(data.user.id);
      // Pixel: cadastro concluído — sinal de conversão de topo para o Meta.
      trackCompleteRegistration({ method: signupIntent === 'paid_signup' ? 'paid_intent' : 'organic' });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
