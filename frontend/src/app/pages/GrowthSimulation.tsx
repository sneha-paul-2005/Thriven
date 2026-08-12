import { useState } from 'react';
import { Rocket, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api, getToken } from '../services/api';

export function GrowthSimulation() {
  const [days, setDays] = useState(30);
  const [signupDelta, setSignupDelta] = useState(0);
  const [retentionDelta, setRetentionDelta] = useState(0);
  const [conversionDelta, setConversionDelta] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const runSimulation = async () => {
    setError('');
    setLoading(true);
    try {
      const token = getToken();
      const data = await api.runSimulation(token, {
        days,
        signup_rate_delta: signupDelta,
        retention_rate_delta: retentionDelta,
        conversion_rate_delta: conversionDelta,
      });
      if (data.detail) {
        setError(data.detail);
      } else {
        setResult(data);
      }
    } catch (_) {
      setError('Something went wrong running the simulation.');
    }
    setLoading(false);
  };

  const chartData = result
    ? result.baseline.map((b: any, i: number) => ({
        day: b.day,
        baseline_dau: b.dau,
        adjusted_dau: result.adjusted[i].dau,
      }))
    : [];

  const finalBaseline = result?.baseline?.[result.baseline.length - 1]?.dau ?? null;
  const finalAdjusted = result?.adjusted?.[result.adjusted.length - 1]?.dau ?? null;
  const diff = finalBaseline != null && finalAdjusted != null ? Math.round((finalAdjusted - finalBaseline) * 10) / 10 : null;

  const renderDiffIcon = () => {
    if (diff === null || diff === 0) return <Minus className="w-5 h-5 text-muted-foreground" />;
    if (diff > 0) return <TrendingUp className="w-5 h-5 text-accent" />;
    return <TrendingDown className="w-5 h-5 text-destructive" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Growth Simulation</h1>
        <p className="text-muted-foreground mt-1">
          Project future growth using your real data, and test "what-if" scenarios
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border space-y-6">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-semibold">Simulation Controls</h3>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">
              Project forward (days)
            </label>
            <input
              type="number"
              min={7}
              max={365}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-medium text-foreground">Signup rate change</label>
              <span className="text-sm text-muted-foreground">{signupDelta > 0 ? '+' : ''}{signupDelta}%</span>
            </div>
            <input
              type="range"
              min={-50}
              max={100}
              value={signupDelta}
              onChange={(e) => setSignupDelta(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-medium text-foreground">Retention change</label>
              <span className="text-sm text-muted-foreground">{retentionDelta > 0 ? '+' : ''}{retentionDelta} pts</span>
            </div>
            <input
              type="range"
              min={-20}
              max={20}
              value={retentionDelta}
              onChange={(e) => setRetentionDelta(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-sm font-medium text-foreground">Conversion rate change</label>
              <span className="text-sm text-muted-foreground">{conversionDelta > 0 ? '+' : ''}{conversionDelta} pts</span>
            </div>
            <input
              type="range"
              min={-10}
              max={10}
              step={0.5}
              value={conversionDelta}
              onChange={(e) => setConversionDelta(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <button
            onClick={runSimulation}
            disabled={loading}
            className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {loading ? 'Running...' : 'Run Simulation'}
          </button>

          <p className="text-xs text-muted-foreground">
            This is a simplified projection based on your recent signup, retention, and conversion
            trends — not a guaranteed forecast.
          </p>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {result ? (
            <>
              <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-foreground">
                    Projected DAU in {days} days
                  </h4>
                  {renderDiffIcon()}
                </div>
                <div className="flex items-baseline gap-3">
                  <p className="text-3xl font-bold text-foreground">{finalAdjusted}</p>
                  <p className="text-sm text-muted-foreground">
                    vs baseline: {finalBaseline}
                    {diff !== null && diff !== 0 && (
                      <span className={diff > 0 ? 'text-accent' : 'text-destructive'}>
                        {' '}({diff > 0 ? '+' : ''}{diff})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                <h3 className="text-xl font-semibold mb-6">Projected DAU Over Time</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis dataKey="day" stroke="#717182" tick={{ fontSize: 11 }} label={{ value: 'Day', position: 'insideBottom', offset: -5, fontSize: 11 }} />
                    <YAxis stroke="#717182" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px' }} />
                    <Legend />
                    <Line type="monotone" dataKey="baseline_dau" name="Baseline" stroke="#A29FE8" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="adjusted_dau" name="Adjusted Scenario" stroke="#7F77DD" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="bg-card rounded-xl p-12 shadow-sm border border-border flex items-center justify-center text-center">
              <div>
                <Rocket className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Set your parameters and click "Run Simulation" to see projected growth.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}