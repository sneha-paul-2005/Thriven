import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, UserCheck, TrendingUp, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface PublicData {
  startup_name: string;
  dau: number;
  mau: number;
  growth_trend: { date: string; users: number }[];
}

export function PublicGrowth() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const result = await api.getPublicPage(token);
        if (result.detail) {
          setNotFound(true);
        } else {
          setData(result);
        }
      } catch (_) {
        setNotFound(true);
      }
      setLoading(false);
    };

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="p-3 bg-destructive/10 rounded-full w-fit mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Page not found</h1>
          <p className="text-muted-foreground">
            This growth page doesn't exist or is no longer public.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Branded header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center gap-2">
          <div className="p-1.5 bg-primary rounded-lg">
            <TrendingUp className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">THRIVEN</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">{data.startup_name}</h1>
          <p className="text-muted-foreground mt-1">Public growth snapshot</p>
        </div>

        {/* Metric cards */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <p className="text-muted-foreground">Daily Active Users</p>
            </div>
            <p className="text-3xl font-semibold text-foreground">{data.dau}</p>
          </div>

          <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-accent/10 rounded-lg">
                <UserCheck className="w-5 h-5 text-accent" />
              </div>
              <p className="text-muted-foreground">Monthly Active Users</p>
            </div>
            <p className="text-3xl font-semibold text-foreground">{data.mau}</p>
          </div>
        </div>

        {/* Growth trend chart */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <h3 className="text-xl font-semibold text-foreground mb-6">Growth Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.growth_trend}>
              <defs>
                <linearGradient id="publicGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => d.slice(5)}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '13px',
                }}
              />
              <Area
                type="monotone"
                dataKey="users"
                stroke="#818cf8"
                strokeWidth={2}
                fill="url(#publicGrowthGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <p className="text-center text-sm text-muted-foreground pt-4">
          Powered by <span className="font-medium">Thriven</span>
        </p>
      </div>
    </div>
  );
}