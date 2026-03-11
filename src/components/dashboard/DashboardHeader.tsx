import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ProfileDropdown from '@/components/ProfileDropdown';
import { Stethoscope, BookOpen, Zap, Dumbbell, ArrowLeft } from 'lucide-react';

interface DashboardHeaderProps {
  userEmail: string;
  onLogout: () => void;
}

const DashboardHeader = ({ userEmail, onLogout }: DashboardHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-border/20 backdrop-blur-xl bg-background/80">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/menu')} className="gap-1 px-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Menu</span>
            </Button>
            <div className="h-6 w-px bg-border/50 hidden sm:block" />
          <div className="relative group">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/40 to-accent/40 opacity-40 group-hover:opacity-70 transition-opacity hidden sm:block" />
            <div className="relative rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 p-2.5 ring-1 ring-primary/20">
              <Stethoscope className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div>
            <span className="font-display text-xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              PreceptorMED
            </span>
            <div className="flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-accent" />
              <p className="text-xs text-muted-foreground">Fechamentos com IA</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/library')}
            className="gap-2 hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Biblioteca</span>
          </Button>
          <ProfileDropdown userEmail={userEmail} onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
