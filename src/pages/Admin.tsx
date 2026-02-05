import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAdmin } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ProfileDropdown from '@/components/ProfileDropdown';
import { 
  Stethoscope, 
  Users, 
  Gift,
  CreditCard,
  Loader2,
  UserCheck,
  UserX,
  ArrowLeft
} from 'lucide-react';

interface UserWithSubscription {
  user_id: string;
  email: string;
  created_at: string;
  subscription?: {
    status: string;
    plan_type: string;
  };
}

const Admin = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<UserWithSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      // Fetch profiles with subscriptions
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, created_at');

      if (profilesError) throw profilesError;

      const { data: subscriptions, error: subsError } = await supabase
        .from('subscriptions')
        .select('user_id, status, plan_type');

      if (subsError) throw subsError;

      const usersWithSubs = profiles.map((profile) => ({
        ...profile,
        subscription: subscriptions.find(s => s.user_id === profile.user_id)
      }));

      setUsers(usersWithSubs);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  if (authLoading || adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const grantAccess = async (userId: string) => {
    setActionLoading(userId);
    try {
      // Check if subscription exists
      const { data: existing } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('subscriptions')
          .update({ 
            status: 'active', 
            plan_type: 'free_access',
            granted_by: user.id 
          })
          .eq('user_id', userId);
        
        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('subscriptions')
          .insert({ 
            user_id: userId,
            status: 'active', 
            plan_type: 'free_access',
            granted_by: user.id 
          });
        
        if (error) throw error;
      }

      toast({
        title: 'Acesso liberado!',
        description: 'O usuário agora tem acesso gratuito.',
      });
      
      fetchUsers();
    } catch (error) {
      console.error('Error granting access:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível liberar o acesso.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const revokeAccess = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'inactive', plan_type: 'none' })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Acesso revogado',
        description: 'O usuário não tem mais acesso.',
      });
      
      fetchUsers();
    } catch (error) {
      console.error('Error revoking access:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível revogar o acesso.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const stats = {
    total: users.length,
    paying: users.filter(u => u.subscription?.plan_type === 'monthly' || u.subscription?.plan_type === 'annual').length,
    freeAccess: users.filter(u => u.subscription?.plan_type === 'free_access').length,
    noAccess: users.filter(u => !u.subscription || u.subscription.status !== 'active').length,
  };

  const getStatusBadge = (subscription?: UserWithSubscription['subscription']) => {
    if (!subscription || subscription.status !== 'active') {
      return <Badge variant="secondary">Sem acesso</Badge>;
    }
    if (subscription.plan_type === 'free_access') {
      return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Gratuito</Badge>;
    }
    return <Badge className="bg-primary/20 text-primary border-primary/30">{subscription.plan_type}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/30 glass-strong">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-primary/30 blur-lg" />
              <div className="relative rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 p-2.5">
                <Stethoscope className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div>
              <span className="font-display text-xl font-bold text-gradient-medical">
                Painel Admin
              </span>
              <p className="text-xs text-muted-foreground">PreceptorAPG</p>
            </div>
          </div>
          
          <ProfileDropdown userEmail={user.email || ''} onLogout={signOut} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container relative py-6 px-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CreditCard className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.paying}</p>
                  <p className="text-sm text-muted-foreground">Pagantes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Gift className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.freeAccess}</p>
                  <p className="text-sm text-muted-foreground">Gratuitos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <UserX className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stats.noAccess}</p>
                  <p className="text-sm text-muted-foreground">Sem acesso</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Usuários</CardTitle>
            <CardDescription>Gerencie o acesso dos usuários ao sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-medium">{u.email}</TableCell>
                      <TableCell>{new Date(u.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>{getStatusBadge(u.subscription)}</TableCell>
                      <TableCell className="text-right">
                        {u.subscription?.status === 'active' && u.subscription?.plan_type === 'free_access' ? (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => revokeAccess(u.user_id)}
                            disabled={actionLoading === u.user_id}
                          >
                            {actionLoading === u.user_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <UserX className="h-4 w-4 mr-1" />
                                Revogar
                              </>
                            )}
                          </Button>
                        ) : u.subscription?.status !== 'active' || !u.subscription ? (
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => grantAccess(u.user_id)}
                            disabled={actionLoading === u.user_id}
                          >
                            {actionLoading === u.user_id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-1" />
                                Liberar
                              </>
                            )}
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">Pagante</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;
