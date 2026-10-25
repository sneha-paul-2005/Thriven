import { useState, useEffect, useRef } from 'react';
import { Users, UserPlus, ShoppingCart, TrendingUp, AlertTriangle, Calendar, Upload, X, CheckCircle } from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api, getToken } from '../services/api';

type Alert = {
  severity: 'high' | 'medium' | 'positive';
  title: string;
  message: string;
};

const alertStyles = {
  high: { box: 'bg-destructive/10 border-destructive/20', icon: 'text-destructive' },
  medium: { box: 'bg-amber-500/10 border-amber-500/20', icon: 'text-amber-600' },
  positive: { box: 'bg-accent/10 border-accent/20', icon: 'text-accent' },
};

export function Dashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMetrics = async () => {
    const token = getToken();
    if (!token) {
      setLoaded(true);
      return;
    }
    try {
      const data = await api.getDashboard(token);
      setMetrics(data?.has_data ? data : null);
      setLoadError(false);
    } catch (_) {
      // 401s are handled in the api helper (redirect to login)
      setLoadError(true);
    }
    setLoaded(true);
  };

  useEffect(() => { fetchMetrics(); }, []);

  const openModal = () => {
    setShowModal(true);
    setUploadStatus('idle');
    setUploadMessage('');
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setUploadStatus('error');
      setUploadMessage('Only CSV files are supported.');
      return;
    }
    setUploading(true);
    setUploadStatus('idle');
    try {
      const token = getToken();
      const result = await api.uploadCSV(token, file);
      if (result.message) {
        setUploadStatus('success');
        setUploadMessage(result.message);
        await fetchMetrics();
      } else {
        setUploadStatus('error');
        setUploadMessage(result.detail || 'Upload failed.');
      }
    } catch (_) {
      setUploadStatus('error');
      setUploadMessage('Something went wrong. Try again.');
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const hasData = !!metrics;

  const growthData = hasData
    ? (metrics.growth_trend || []).map((d: any) => ({ date: d.date.slice(5), value: d.users }))
    : [];
  const eventData = hasData ? metrics.event_breakdown || [] : [];
  const alerts: Alert[] = hasData ? metrics.alerts || [] : [];

  return (
    <div className="space-y-6 min-w-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your growth metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg glass-panel hover:bg-secondary transition-colors">
            <Calendar className="w-4 h-4" />
            <span>Last 30 days</span>
          </button>
          <button
            onClick={openModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Data</span>
          </button>
        </div>
      </div>

      {!loaded && <p className="text-muted-foreground">Loading your metrics...</p>}

      {loaded && loadError && (
        <div className="glass-panel rounded-xl p-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-foreground">Couldn't load your metrics</p>
            <p className="text-sm text-muted-foreground mt-1">
              The server didn't respond. Check that the backend is running, then refresh the page.
            </p>
          </div>
        </div>
      )}

      {/* Empty state: new account, nothing uploaded yet */}
      {loaded && !loadError && !hasData && (
        <div className="glass-panel rounded-xl p-10 text-center max-w-2xl mx-auto">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Upload className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">Welcome to Thriven</h2>
          <p className="text-muted-foreground mt-2">
            Upload your user activity as a CSV and your growth metrics, funnel and cohorts will appear here.
          </p>
          <div className="text-sm text-muted-foreground mt-5 space-y-1">
            <p>
              Required columns: <code className="bg-secondary px-1 rounded">user_id, date, event</code>
            </p>
            <p>
              Events used: <code className="bg-secondary px-1 rounded">visit, signup, add_to_cart, purchase</code>
            </p>
            <p>
              Optional for funnel breakdowns:{' '}
              <code className="bg-secondary px-1 rounded">device, location, traffic_source</code>
            </p>
          </div>
          <button
            onClick={openModal}
            className="mt-7 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
          >
            <Upload className="w-4 h-4" />
            Upload your CSV
          </button>
        </div>
      )}

      {/* Real data */}
      {loaded && !loadError && hasData && (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard icon={Users} label="Daily Active Users" value={String(metrics.dau)} />
            <MetricCard icon={UserPlus} label="Monthly Active Users" value={String(metrics.mau)} />
            <MetricCard icon={TrendingUp} label="Retention Rate" value={`${metrics.retention_rate}%`} />
            <MetricCard icon={ShoppingCart} label="Conversion Rate" value={`${metrics.conversion_rate}%`} />
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="glass-panel rounded-xl p-6 min-w-0">
              <h3 className="text-xl font-semibold mb-6">Growth Trend</h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6fcf97" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6fcf97" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--popover-foreground)' }} />
                  <Area type="monotone" dataKey="value" name="Active Users" stroke="#6fcf97" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-panel rounded-xl p-6 min-w-0">
              <h3 className="text-xl font-semibold mb-6">Event Breakdown</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={eventData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
                  <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--popover-foreground)' }} />
                  <Legend />
                  <Bar dataKey="visits" name="Visits" fill="#818cf8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="signups" name="Signups" fill="#6fcf97" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="purchases" name="Purchases" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* North Star Metric */}
            <div className="glass-panel bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">North Star Metric</h3>
              <div>
                <p className="text-muted-foreground mb-2">Weekly Active Users</p>
                <p className="text-4xl font-bold text-foreground">{metrics.north_star}</p>
                <p className="text-sm text-muted-foreground mt-3">
                  Unique users in the last 7 days of your data
                </p>
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="glass-panel rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">Recent Alerts</h3>
              {alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No anomalies detected — everything looks steady.</p>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert, i) => {
                    const style = alertStyles[alert.severity];
                    const Icon = alert.severity === 'positive' ? TrendingUp : AlertTriangle;
                    return (
                      <div key={i} className={`flex items-start gap-3 p-3 border rounded-lg ${style.box}`}>
                        <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${style.icon}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">{alert.title}</p>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="glass-panel rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Upload CSV Data</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              Upload a CSV with columns: <code className="bg-secondary px-1 rounded">user_id, date, event</code>
            </p>
            {hasData && (
              <p className="text-xs text-muted-foreground">
                Uploading a new file replaces your current data.
              </p>
            )}

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-secondary/50'
              }`}
            >
              <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium text-foreground">Drop your CSV here</p>
              <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>

            {uploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Uploading...
              </div>
            )}
            {uploadStatus === 'success' && (
              <div className="flex items-center gap-2 text-sm text-primary">
                <CheckCircle className="w-4 h-4" />
                {uploadMessage}
              </div>
            )}
            {uploadStatus === 'error' && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertTriangle className="w-4 h-4" />
                {uploadMessage}
              </div>
            )}

            {uploadStatus === 'success' && (
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                Done
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}