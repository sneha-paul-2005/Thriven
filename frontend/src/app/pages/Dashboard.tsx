import { Users, UserPlus, ShoppingCart, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const growthData = [
  { date: 'Jan 1', value: 1200 },
  { date: 'Jan 8', value: 1800 },
  { date: 'Jan 15', value: 2400 },
  { date: 'Jan 22', value: 2200 },
  { date: 'Jan 29', value: 2800 },
  { date: 'Feb 5', value: 3200 },
  { date: 'Feb 12', value: 3600 },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
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
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={Users}
          label="Daily Active Users"
          value="3,247"
          change={12.5}
          trend="up"
        />
        <MetricCard
          icon={UserPlus}
          label="Monthly Active Users"
          value="28,450"
          change={8.2}
          trend="up"
        />
        <MetricCard
          icon={TrendingUp}
          label="Retention Rate"
          value="64%"
          change={-2.4}
          trend="down"
        />
        <MetricCard
          icon={ShoppingCart}
          label="Conversion Rate"
          value="3.8%"
          change={5.1}
          trend="up"
        />
      </div>

      {/* Growth Trend Chart */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <h3 className="text-xl font-semibold mb-6">Growth Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={growthData}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7F77DD" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#7F77DD" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="date" stroke="#717182" />
            <YAxis stroke="#717182" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#7F77DD"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* North Star Metric */}
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-6 border border-primary/20">
          <h3 className="text-xl font-semibold mb-4">North Star Metric</h3>
          <div className="space-y-4">
            <div>
              <p className="text-muted-foreground mb-2">Weekly Active Users</p>
              <p className="text-4xl font-bold text-foreground">15,840</p>
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
    </div>
  );
}
