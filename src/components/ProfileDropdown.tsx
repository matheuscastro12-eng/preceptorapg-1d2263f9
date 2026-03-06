import { User, LogOut, Star, FileText, Calendar, Sun, Moon, Shield, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useUserStats } from '@/hooks/useUserStats';
import { useTheme } from 'next-themes';
import { useAdmin } from '@/hooks/useAdmin';
import { useNavigate } from 'react-router-dom';

interface ProfileDropdownProps {
  userEmail: string;
  onLogout: () => void;
}

const ProfileDropdown = ({ userEmail, onLogout }: ProfileDropdownProps) => {
  const { stats } = useUserStats();
  const loading = stats.loading;
  const { theme, setTheme } = useTheme();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-secondary/50 hover:bg-secondary"
        >
          <User className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4 glass-strong" align="end">
        <div className="space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3 pb-3 border-b border-border/50 p-2 -m-1">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {userEmail}
              </p>
              <p className="text-xs text-muted-foreground">Conta ativa</p>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between py-2 px-1 border-b border-border/50">
            <div className="flex items-center gap-2">
              {theme === 'dark' ? (
                <Moon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Sun className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm text-foreground">Modo Claro</span>
            </div>
            <Switch
              checked={theme === 'light'}
              onCheckedChange={(checked) => setTheme(checked ? 'light' : 'dark')}
            />
          </div>

          {/* Stats */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Suas Estatísticas
            </p>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30">
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {loading ? '...' : stats.totalFechamentos}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Gerados</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30">
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Star className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {loading ? '...' : stats.totalFavoritos}
                  </p>
                  <p className="text-xs text-muted-foreground">Favoritos</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30">
                <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {loading ? '...' : stats.thisMonth}
                  </p>
                  <p className="text-xs text-muted-foreground">Este Mês</p>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Link */}
          {isAdmin && (
            <Button
              variant="ghost"
              className="w-full justify-start text-primary hover:text-primary hover:bg-primary/10"
              onClick={() => navigate('/admin')}
            >
              <Shield className="h-4 w-4 mr-2" />
              Painel Admin
            </Button>
          )}

          {/* Subscription Link */}
          <Button
            variant="ghost"
            className="w-full justify-start text-foreground hover:bg-secondary/50"
            onClick={() => navigate('/subscription')}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Minha Assinatura
          </Button>

          {/* Logout */}
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair da Conta
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ProfileDropdown;
