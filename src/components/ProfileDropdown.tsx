import { User, LogOut, BarChart3, Star, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useUserStats } from '@/hooks/useUserStats';

interface ProfileDropdownProps {
  userEmail: string;
  onLogout: () => void;
}

const ProfileDropdown = ({ userEmail, onLogout }: ProfileDropdownProps) => {
  const { stats } = useUserStats();
  const loading = stats.loading;

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
          <div className="flex items-center gap-3 pb-3 border-b border-border/50">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {userEmail}
              </p>
              <p className="text-xs text-muted-foreground">Estudante de Medicina</p>
            </div>
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
