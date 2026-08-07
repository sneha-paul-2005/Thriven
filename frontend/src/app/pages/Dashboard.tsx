import { useState, useEffect, useRef } from 'react';
import { Users, UserPlus, ShoppingCart, TrendingUp, AlertTriangle, Calendar, Upload, X, CheckCircle } from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { api, getToken } from '../services/api';

const FALLBACK_GROWTH = [
  { date: 'Jan 1', value: 1200 },
  { date: 'Jan 8', value: 1800 },
  { date: 'Jan 15', value: 2400 },
  { date: 'Jan 22', value: 2200 },
  { date: 'Jan 29', value: 2800 },
  { date: 'Feb 5', value: 3200 },
  { date: 'Feb 12', value: 3600 },
];

const FALLBACK_EVENTS = [
  { date: 'Jan 1', visits: 1200, signups: 300, purchases: 90 },
  { date: 'Jan 8', visits: 1800, signups: 450, purchases: 120 },
  { date: 'Jan 15', visits: 2400, signups: 600, purchases: 180 },
  { date: 'Jan 22', visits: 2200, signups: 500, purchases: 150 },
  { date: 'Jan 29', visits: 2800, signups: 700, purchases: 200 },
];

export function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMetrics = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const data = await api.getDashboard(token);
      if (!data.detail) setMetrics(data);
    } catch (_) {}
  };

  useEffect(() => { fetchMetrics(); }, []);

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

  const hasData = metrics?.has_data;
  const dau = hasData ? metrics.dau : '3,247';
  const mau = hasData ? metrics.mau : '28,450';
  const retention = hasData ? `${metrics.retention_rate}%` : '64%';
  const conversion = hasData ? `${metrics.conversion_rate}%` : '3.8%';
  const northStar = hasData ? metrics.north_star : '15,840';

  // Growth trend data — shorten date labels for readability
  const growthData = hasData && metrics.growth_trend?.length
    ? metrics.growth_trend.map(d => ({
        date: d.date.slice(5), // show MM-DD instead of full date
        value: d.users
      }))
    : FALLBACK_GROWTH;

  // Event breakdown data from growth_trend
  const eventData = hasData && metrics.event_breakdown?.length
    ? metrics.event_breakdown
    : FALLBACK_EVENTS;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your growth metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-secondary transition-colors">
            <Calendar className="w-4 h-4" />
            <span>Last 30 days</span>
          </button>
          <button
            onClick={() => { setShowModal(true); setUploadStatus('idle'); setUploadMessage(''); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Data</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard icon={Users} label="Daily Active Users" value={String(dau)} change={12.5} trend="up" />
        <MetricCard icon={UserPlus} label="Monthly Active Users" value={String(mau)} change={8.2} trend="up" />
        <MetricCard icon={TrendingUp} label="Retention Rate" value={String(retention)} change={-2.4} trend="down" />
        <MetricCard icon={ShoppingCart} label="Conversion Rate" value={String(conversion)} change={5.1} trend="up" />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Growth Trend Chart */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <h3 className="text-xl font-semibold mb-6">Growth Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7F77DD" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#7F77DD" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="date" stroke="#717182" tick={{ fontSize: 11 }} />
              <YAxis stroke="#717182" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="value" name="Active Users" stroke="#7F77DD" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Event Breakdown Chart */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <h3 className="text-xl font-semibold mb-6">Event Breakdown</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={eventData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="date" stroke="#717182" tick={{ fontSize: 11 }} />
              <YAxis stroke="#717182" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="visits" name="Visits" fill="#7F77DD" radius={[4, 4, 0, 0]} />
              <Bar dataKey="signups" name="Signups" fill="#1D9E75" radius={[4, 4, 0, 0]} />
              <Bar dataKey="purchases" name="Purchases" fill="#D85A30" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* North Star Metric */}
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-6 border border-primary/20">
          <h3 className="text-xl font-semibold mb-4">North Star Metric</h3>
          <div className="space-y-4">
            <div>
              <p className="text-muted-foreground mb-2">Weekly Active Users</p>
              <p className="text-4xl font-bold text-foreground">{northStar}</p>
            </div>
            <div className="flex items-center gap-2 text-accent">
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">+18.3% from last week</span>
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <h3 className="text-xl font-semibold mb-4">Recent Alerts</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-foreground">High cart abandonment</p>
                <p className="text-sm text-muted-foreground">Checkout drop-off rate increased to 45%</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-foreground">Retention dip detected</p>
                <p className="text-sm text-muted-foreground">Week 2 retention down 5% this cohort</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-accent/10 border border-accent/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-accent mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-foreground">Traffic surge</p>
                <p className="text-sm text-muted-foreground">Organic search up 34% this week</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-xl border border-border w-full max-w-md mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Upload CSV Data</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              Upload a CSV with columns: <code className="bg-secondary px-1 rounded">user_id, date, event</code>
            </p>

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
              <div className="flex items-center gap-2 text-sm text-green-600">
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