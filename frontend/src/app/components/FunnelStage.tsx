interface FunnelStageProps {
  label: string;
  count: number;
  percentage: number;
  color: string;
  isLast?: boolean;
}

export function FunnelStage({ label, count, percentage, color, isLast = false }: FunnelStageProps) {
  const dropOff = isLast ? 0 : 100 - percentage;

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
      {!isLast && dropOff > 0 && (
        <div className="ml-4 mb-4 p-2 bg-destructive/10 border-l-2 border-destructive rounded">
          <p className="text-sm text-destructive">
            Drop off: {dropOff.toFixed(1)}%
          </p>
        </div>
      )}
    </div>
  );
}
