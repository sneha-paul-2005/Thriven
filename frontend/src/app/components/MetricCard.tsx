import { LucideIcon } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
}

export function MetricCard({ icon: Icon, label, value, change, trend = 'neutral' }: MetricCardProps) {
  return (
    <div className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {change !== undefined && <StatusBadge value={change} trend={trend} />}
      </div>
      <div className="space-y-1">
        <p className="text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
