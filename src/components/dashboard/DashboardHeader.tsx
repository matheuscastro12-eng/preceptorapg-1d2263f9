import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ProfileDropdown from '@/components/ProfileDropdown';
import { BookOpen, ArrowLeft } from 'lucide-react';
import logoPreceptor from '@/assets/logo-preceptor.png';

interface DashboardHeaderProps {
  userEmail: string;
  onLogout: () => void;
}

const DashboardHeader = ({ userEmail, onLogout }: DashboardHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-border/30 bg-background/90 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/menu')}
            className="gap-1.5 px-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-xs">Menu</span>
          </Button>
          <div className="h-4 w-px bg-border/60 hidden sm:block" />
          <img
            src={logoPreceptor}
            alt="PreceptorMED"
            className="h-8 w-auto"
          />
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/library')}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <BookOpen className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span className="hidden sm:inline text-xs">Biblioteca</span>
          </Button>
          <ProfileDropdown userEmail={userEmail} onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
