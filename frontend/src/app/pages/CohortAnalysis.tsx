import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { api, getToken } from '../services/api';

type Granularity = 'weekly' | 'monthly';

type CohortRow = {
  cohort_label: string;
  cohort_size: number;
  retention: (number | null)[]; // null = no data for that period yet
};

export function CohortAnalysis() {
  const [granularity, setGranularity] = useState<Granularity>('weekly');
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const [rows, setRows] = useState<CohortRow[]>([]);
  const [periodLabels, setPeriodLabels] = useState<string[]>([]);

  const fetchCohorts = async (g: Granularity) => {
    setLoading(true);
    const token = getToken();
    if (!token) return;
    try {
      const data = await api.getCohorts(token, g);
      if (data.has_data) {
        setHasData(true);
        setRows(data.cohorts);
        setPeriodLabels(data.period_labels);
      } else {
        setHasData(false);
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchCohorts(granularity); }, [granularity]);

  const cellColor = (value: number | null) => {
    if (value === null) return 'bg-transparent';
    if (value >= 60) return 'bg-accent/30 text-foreground';
    if (value >= 30) return 'bg-amber-500/20 text-foreground';
    if (value > 0) return 'bg-destructive/15 text-foreground';
    return 'bg-secondary/50 text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Cohort Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Track how groups of users retain over time based on when they signed up
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setGranularity('weekly')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              granularity === 'weekly'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setGranularity('monthly')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              granularity === 'monthly'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading...</div>
      ) : !hasData ? (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 text-sm text-amber-700">
          No data uploaded yet. Upload a CSV from the Dashboard to see cohort retention.
        </div>
      ) : (
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border overflow-x-auto">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-semibold">
              {granularity === 'weekly' ? 'Weekly' : 'Monthly'} Retention by Signup Cohort
            </h3>
          </div>

          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Not enough data yet to form a cohort. Try uploading a larger dataset.
            </p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-sm font-medium text-muted-foreground pb-3 pr-4">Cohort</th>
                  <th className="text-left text-sm font-medium text-muted-foreground pb-3 pr-4">Size</th>
                  {periodLabels.map((label) => (
                    <th key={label} className="text-center text-sm font-medium text-muted-foreground pb-3 px-2">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.cohort_label} className="border-t border-border/50">
                    <td className="py-3 pr-4 text-sm font-medium text-foreground whitespace-nowrap">{row.cohort_label}</td>
                    <td className="py-3 pr-4 text-sm text-muted-foreground">{row.cohort_size}</td>
                    {row.retention.map((val, i) => (
                      <td key={i} className="py-3 px-2 text-center">
                        {val !== null ? (
                          <span className={`inline-block px-3 py-1 rounded-md text-sm font-medium ${cellColor(val)}`}>
                            {val}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <p className="text-xs text-muted-foreground mt-6">
            Each row is a group of users who first appeared in that {granularity === 'weekly' ? 'week' : 'month'}.
            Each column shows what percent of that group was still active {granularity === 'weekly' ? 'weeks' : 'months'} later.
          </p>
        </div>
      )}
    </div>
  );
}