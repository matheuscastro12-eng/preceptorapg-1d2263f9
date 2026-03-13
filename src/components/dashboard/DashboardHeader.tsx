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
    <header className="sticky top-0 z-50 border-b border-border/20 backdrop-blur-xl bg-background/80">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/menu')} className="gap-1 px-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Menu</span>
            </Button>
            <div className="h-6 w-px bg-border/50 hidden sm:block" />
          <div className="flex items-center gap-2">
            <img 
              src={logoPreceptor} 
              alt="PreceptorMED" 
              className="h-10 w-auto"
            />
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
