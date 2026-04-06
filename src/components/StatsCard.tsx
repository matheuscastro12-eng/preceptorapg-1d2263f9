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
  const accentColors = {
    default: 'text-muted-foreground',
    primary: 'text-primary',
    accent: 'text-accent',
  };

  const borderAccent = {
    default: '',
    primary: 'border-l-2 border-l-primary',
    accent: 'border-l-2 border-l-accent',
  };

  return (
    <div
      className={cn(
        'group relative rounded-lg border border-border/60 bg-card p-5 transition-all duration-200 hover:border-border hover:shadow-card',
        borderAccent[variant]
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest truncate">
            {title}
          </p>
          {loading ? (
            <div className="h-7 w-14 animate-pulse rounded bg-muted" />
          ) : (
            <p className="text-2xl font-bold tracking-tightest tabular-nums">{value}</p>
          )}
        </div>
        <div className={cn('shrink-0 mt-0.5', accentColors[variant])}>
          <Icon className="h-4.5 w-4.5 opacity-70 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
