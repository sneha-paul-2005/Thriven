import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatusBadgeProps {
  value: number;
  trend?: 'up' | 'down' | 'neutral';
}

export function StatusBadge({ value, trend = 'neutral' }: StatusBadgeProps) {
  const isPositive = trend === 'up' || (trend === 'neutral' && value > 0);
  const isNegative = trend === 'down' || (trend === 'neutral' && value < 0);

  const bgColor = isPositive ? 'bg-accent/10' : isNegative ? 'bg-destructive/10' : 'bg-muted';
  const textColor = isPositive ? 'text-accent' : isNegative ? 'text-destructive' : 'text-muted-foreground';

  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md ${bgColor} ${textColor}`}>
      <Icon className="w-3 h-3" />
      <span className="text-xs font-medium">{Math.abs(value)}%</span>
    </div>
  );
}
