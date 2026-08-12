import { useState, useEffect } from 'react';
import { Award, TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api, getToken } from '../services/api';

type MetricKey = 'conversion_rate' | 'retention_rate' | 'dau_mau_ratio';

type DriftDelta = { since_yesterday: number | null; since_week: number | null };

const METRIC_LABELS: Record<MetricKey, string> = {
  conversion_rate: 'Conversion Rate',
  retention_rate: 'Retention Rate',
  dau_mau_ratio: 'DAU/MAU Ratio',
};

export function Benchmark() {
  const [loading, setLoading] = useState(true);
  const [hasBenchmark, setHasBenchmark] = useState(false);
  const [yourMetrics, setYourMetrics] = useState<Record<MetricKey, number> | null>(null);
  const [current, setCurrent] = useState<Record<MetricKey, number> | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [drift, setDrift] = useState<Record<MetricKey, DriftDelta> | null>(null);

  const [form, setForm] = useState({ conversion_rate: '', retention_rate: '', dau_mau_ratio: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchBenchmarks = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const data = await api.getBenchmarks(token);
      if (data.has_benchmark) {
        setHasBenchmark(true);
        setYourMetrics(data.your_metrics);
        setCurrent(data.current);
        setHistory(data.history || []);
        setDrift(data.drift || null);
      } else {
        setHasBenchmark(false);
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchBenchmarks(); }, []);

  const handleSetBaseline = async () => {
    setError('');
    const cr = parseFloat(form.conversion_rate);
    const rr = parseFloat(form.retention_rate);
    const dm = parseFloat(form.dau_mau_ratio);

    if (isNaN(cr) || isNaN(rr) || isNaN(dm)) {
      setError('Please enter valid numbers for all three fields.');
      return;
    }

    setSaving(true);
    try {
      const token = getToken();
      const result = await api.setBenchmarks(token, {
        conversion_rate: cr,
        retention_rate: rr,
        dau_mau_ratio: dm,
      });
      if (result.detail) {
        setError(result.detail);
      } else {
        await fetchBenchmarks();
      }
    } catch (_) {
      setError('Something went wrong saving your baseline.');
    }
    setSaving(false);
  };

  const renderTrendIcon = (yourVal: number, benchmarkVal: number) => {
    if (yourVal > benchmarkVal) return <TrendingUp className="w-5 h-5 text-accent" />;
    if (yourVal < benchmarkVal) return <TrendingDown className="w-5 h-5 text-destructive" />;
    return <Minus className="w-5 h-5 text-muted-foreground" />;
  };

  const renderDriftLine = (label: string, value: number | null) => {
    if (value === null || value === 0) return null;
    const isUp = value > 0;
    const Icon = isUp ? ArrowUp : ArrowDown;
    const colorClass = isUp ? 'text-accent' : 'text-destructive';
    return (
      <div className={`flex items-center gap-1 text-xs ${colorClass}`}>
        <Icon className="w-3 h-3" />
        <span>{Math.abs(value)}% {label}</span>
      </div>
    );
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Competitor Benchmark</h1>
        <p className="text-muted-foreground mt-1">
          See how your metrics compare to industry benchmarks that drift over time
        </p>
      </div>

      {!hasBenchmark ? (
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-semibold">Set Your Baseline</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Enter industry benchmark figures you've researched (e.g. from a report or public data).
            These aren't live competitor data — they're a reference point that will drift slightly
            over time to simulate real market conditions.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Industry avg conversion rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={form.conversion_rate}
                onChange={(e) => setForm({ ...form, conversion_rate: e.target.value })}
                placeholder="e.g. 4.0"
                className="w-full px-4 py-2 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Industry avg retention rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={form.retention_rate}
                onChange={(e) => setForm({ ...form, retention_rate: e.target.value })}
                placeholder="e.g. 35.0"
                className="w-full px-4 py-2 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Industry avg DAU/MAU ratio (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={form.dau_mau_ratio}
                onChange={(e) => setForm({ ...form, dau_mau_ratio: e.target.value })}
                placeholder="e.g. 20.0"
                className="w-full px-4 py-2 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              onClick={handleSetBaseline}
              disabled={saving}
              className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Set Baseline'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {(Object.keys(METRIC_LABELS) as MetricKey[]).map((key) => {
              const yourVal = yourMetrics?.[key] ?? 0;
              const benchmarkVal = current?.[key] ?? 0;
              const metricDrift = drift?.[key];
              return (
                <div key={key} className="bg-card rounded-xl p-6 shadow-sm border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-foreground">{METRIC_LABELS[key]}</h4>
                    {renderTrendIcon(yourVal, benchmarkVal)}
                  </div>
                  <p className="text-3xl font-bold text-foreground mb-1">{yourVal}%</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Industry benchmark today: <span className="font-medium">{benchmarkVal}%</span>
                  </p>
                  {metricDrift && (
                    <div className="space-y-1 pt-2 border-t border-border/50">
                      {renderDriftLine('since yesterday', metricDrift.since_yesterday)}
                      {renderDriftLine('this week', metricDrift.since_week)}
                      {metricDrift.since_yesterday === 0 && metricDrift.since_week === 0 && (
                        <p className="text-xs text-muted-foreground">No market movement yet</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Trend Chart */}
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <h3 className="text-xl font-semibold mb-6">Benchmark Trend</h3>
            <p className="text-sm text-muted-foreground mb-4">
              How the industry benchmark has drifted recently (simulated market movement)
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="date" stroke="#717182" tick={{ fontSize: 11 }} />
                <YAxis stroke="#717182" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="conversion_rate" name="Conversion Rate" stroke="#7F77DD" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="retention_rate" name="Retention Rate" stroke="#1D9E75" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="dau_mau_ratio" name="DAU/MAU Ratio" stroke="#D85A30" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}