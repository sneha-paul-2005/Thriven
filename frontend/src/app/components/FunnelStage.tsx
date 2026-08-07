interface FunnelStageProps {
  label: string;
  count: number;
  percentage: number;
  dropoff?: number;
  color: string;
  isLast?: boolean;
}

export function FunnelStage({ label, count, percentage, dropoff = 0, color, isLast = false }: FunnelStageProps) {
  const severity = dropoff >= 50 ? 'high' : dropoff >= 20 ? 'medium' : 'low';

  const badgeStyles = {
    high: 'bg-destructive/10 border-destructive text-destructive',
    medium: 'bg-amber-500/10 border-amber-500 text-amber-600',
    low: 'bg-secondary border-border text-muted-foreground',
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-4 mb-2">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-foreground">{label}</h4>
            <span className="text-sm text-muted-foreground">{percentage}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${percentage}%`, backgroundColor: color }}
            />
          </div>
        </div>
        <div className="text-right min-w-[80px]">
          <p className="text-2xl font-semibold text-foreground">{count.toLocaleString()}</p>
        </div>
      </div>
      {!isLast && dropoff > 0 && (
        <div className={`ml-4 mb-4 p-2 border-l-2 rounded ${badgeStyles[severity]}`}>
          <p className="text-sm">
            {severity === 'high' && '⚠ '}
            Drop off: {dropoff.toFixed(1)}%
            {severity === 'high' && ' — needs attention'}
          </p>
        </div>
      )}
    </div>
  );
}