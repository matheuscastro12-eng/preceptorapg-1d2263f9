import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: 'default' | 'primary' | 'accent';
  loading?: boolean;
}

const StatsCard = ({ title, value, icon: Icon, variant = 'default', loading }: StatsCardProps) => {
  const variants = {
    default: 'from-secondary/80 to-secondary/40 border-border/50',
    primary: 'from-primary/20 to-primary/5 border-primary/30',
    accent: 'from-accent/20 to-accent/5 border-accent/30',
  };

  const iconVariants = {
    default: 'text-muted-foreground',
    primary: 'text-primary',
    accent: 'text-accent',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg',
        variants[variant]
      )}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          {loading ? (
            <div className="h-8 w-12 animate-pulse rounded bg-muted/50" />
          ) : (
            <p className="text-2xl font-bold tracking-tight">{value}</p>
          )}
        </div>
        <div
          className={cn(
            'rounded-lg bg-background/50 p-2.5 backdrop-blur-sm',
            iconVariants[variant]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      
      {/* Decorative gradient orb */}
      <div
        className={cn(
          'absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-20 blur-2xl',
          variant === 'primary' && 'bg-primary',
          variant === 'accent' && 'bg-accent',
          variant === 'default' && 'bg-muted-foreground'
        )}
      />
    </div>
  );
};

export default StatsCard;
