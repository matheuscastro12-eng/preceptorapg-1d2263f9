import { User, LogOut, Sun, Moon, Shield, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTheme } from 'next-themes';
import { useAdmin } from '@/hooks/useAdmin';
import { useNavigate } from 'react-router-dom';

interface ProfileDropdownProps {
  userEmail: string;
  onLogout: () => void;
}

const ProfileDropdown = ({ userEmail, onLogout }: ProfileDropdownProps) => {
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
      <PopoverContent className="w-64 p-2 glass-strong" align="end">
        <div className="space-y-1">
          {/* User Info */}
          <div className="px-3 py-2.5 border-b border-border/30 mb-1">
            <p className="text-sm font-medium text-foreground truncate">
              {userEmail}
            </p>
            <p className="text-[11px] text-muted-foreground">Conta ativa</p>
          </div>

          {/* Profile Link */}
          <Button
            variant="ghost"
            className="w-full justify-start text-sm h-9 px-3 text-foreground hover:bg-secondary/50"
            onClick={() => navigate('/profile')}
          >
            <User className="h-4 w-4 mr-2.5 text-muted-foreground" />
            Meu Perfil
          </Button>

          {/* Subscription Link */}
          <Button
            variant="ghost"
            className="w-full justify-start text-sm h-9 px-3 text-foreground hover:bg-secondary/50"
            onClick={() => navigate('/subscription')}
          >
            <CreditCard className="h-4 w-4 mr-2.5 text-muted-foreground" />
            Minha Assinatura
          </Button>

          {/* Admin Link */}
          {isAdmin && (
            <Button
              variant="ghost"
              className="w-full justify-start text-sm h-9 px-3 text-foreground hover:bg-secondary/50"
              onClick={() => navigate('/admin')}
            >
              <Shield className="h-4 w-4 mr-2.5 text-muted-foreground" />
              Painel Admin
            </Button>
          )}

          {/* Theme Toggle */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-border/30 mt-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {theme === 'dark' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
              Modo Claro
            </div>
            <Switch
              checked={theme === 'light'}
              onCheckedChange={(checked) => setTheme(checked ? 'light' : 'dark')}
            />
          </div>

          {/* Logout */}
          <div className="border-t border-border/30 pt-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-sm h-9 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4 mr-2.5" />
              Sair da Conta
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ProfileDropdown;
