import { useState, useEffect } from 'react';
import { FunnelStage } from '../components/FunnelStage';
import { Lightbulb, Monitor, MapPin, Share2, TrendingDown } from 'lucide-react';
import { api, getToken } from '../services/api';

type SegmentTab = 'device' | 'location' | 'traffic_source';

type SegmentRow = {
  label: string;
  conversion_rate: number;
  worst_stage?: string;
  worst_dropoff?: number;
};

const FALLBACK_FUNNEL = [
  { label: 'Visit', count: 45000, percentage: 100, dropoff: 0, color: '#7F77DD' },
  { label: 'Signup', count: 9000, percentage: 20, dropoff: 80, color: '#1D9E75' },
  { label: 'Add to Cart', count: 2700, percentage: 6, dropoff: 70, color: '#A29FE8' },
  { label: 'Purchase', count: 1350, percentage: 3, dropoff: 50, color: '#D85A30' },
];

const FALLBACK_SEGMENTS: Record<SegmentTab, SegmentRow[]> = {
  device: [
    { label: 'Desktop', conversion_rate: 4.2, worst_stage: 'Add to Cart', worst_dropoff: 55 },
    { label: 'Mobile', conversion_rate: 2.5, worst_stage: 'Signup', worst_dropoff: 62 },
    { label: 'Tablet', conversion_rate: 3.1, worst_stage: 'Add to Cart', worst_dropoff: 48 },
  ],
  location: [
    { label: 'United States', conversion_rate: 4.1, worst_stage: 'Add to Cart', worst_dropoff: 50 },
    { label: 'United Kingdom', conversion_rate: 3.8, worst_stage: 'Signup', worst_dropoff: 45 },
    { label: 'Canada', conversion_rate: 3.5, worst_stage: 'Add to Cart', worst_dropoff: 53 },
  ],
  traffic_source: [
    { label: 'Organic Search', conversion_rate: 5.2, worst_stage: 'Add to Cart', worst_dropoff: 40 },
    { label: 'Paid Ads', conversion_rate: 3.4, worst_stage: 'Signup', worst_dropoff: 58 },
    { label: 'Social Media', conversion_rate: 2.1, worst_stage: 'Add to Cart', worst_dropoff: 66 },
  ],
};

const STAGE_COLORS = ['#7F77DD', '#1D9E75', '#A29FE8', '#D85A30'];

const TAB_CONFIG: { key: SegmentTab; label: string; icon: typeof Monitor }[] = [
  { key: 'device', label: 'Device', icon: Monitor },
  { key: 'location', label: 'Location', icon: MapPin },
  { key: 'traffic_source', label: 'Traffic Source', icon: Share2 },
];

const recommendations = [
  {
    title: 'Optimize signup form',
    description: 'Your signup conversion is at 20%. Consider reducing form fields from 6 to 3 to improve completion rate.',
    impact: 'High',
  },
  {
    title: 'Add cart abandonment emails',
    description: 'Only 30% of users who add to cart complete purchase. Automated reminder emails could recover 15-20% of lost sales.',
    impact: 'High',
  },
  {
    title: 'Improve mobile checkout',
    description: 'Mobile users have 40% lower conversion. Simplify the mobile checkout flow and add payment options like Apple Pay.',
    impact: 'Medium',
  },
];

function dropoffSeverity(rate: number) {
  return rate >= 50 ? 'high' : rate >= 20 ? 'medium' : 'low';
}

const severityStyles = {
  high: 'text-destructive',
  medium: 'text-amber-600',
  low: 'text-muted-foreground',
};

export function FunnelAnalysis() {
  const [activeTab, setActiveTab] = useState<SegmentTab>('device');
  const [funnelData, setFunnelData] = useState(FALLBACK_FUNNEL);
  const [segments, setSegments] = useState(FALLBACK_SEGMENTS);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const fetchFunnel = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const data = await api.getFunnel(token);
        if (data.has_data && data.stages?.length) {
          setHasData(true);
          setFunnelData(
            data.stages.map((s: any, i: number) => ({
              label: s.stage,
              count: s.count,
              percentage: s.percentage,
              dropoff: s.dropoff,
              color: STAGE_COLORS[i] ?? '#7F77DD',
            }))
          );
        }
        if (data.segments) {
          setSegments({
            device: data.segments.device?.length ? data.segments.device : FALLBACK_SEGMENTS.device,
            location: data.segments.location?.length ? data.segments.location : FALLBACK_SEGMENTS.location,
            traffic_source: data.segments.traffic_source?.length ? data.segments.traffic_source : FALLBACK_SEGMENTS.traffic_source,
          });
        }
      } catch (_) {}
    };
    fetchFunnel();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Funnel Analysis</h1>
        <p className="text-muted-foreground mt-1">Track user journey and identify drop-off points</p>
      </div>

      {!hasData && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 text-sm text-amber-700">
          No data uploaded yet — showing sample data. Upload a CSV from the Dashboard to see real funnel metrics.
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Funnel Visualization */}
        <div className="lg:col-span-2 bg-card rounded-xl p-6 shadow-sm border border-border">
          <h3 className="text-xl font-semibold mb-6">Conversion Funnel</h3>

          <div className="space-y-4 mb-8">
            {funnelData.map((stage, index) => (
              <FunnelStage
                key={stage.label}
                {...stage}
                isLast={index === funnelData.length - 1}
              />
            ))}
          </div>

          {/* Segmentation Tabs */}
          <div className="border-t border-border pt-6">
            <h4 className="font-semibold mb-4">Segment by</h4>
            <div className="flex gap-2 mb-6">
              {TAB_CONFIG.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    activeTab === key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
              {segments[activeTab].map((seg) => {
                const severity = seg.worst_dropoff != null ? dropoffSeverity(seg.worst_dropoff) : 'low';
                return (
                  <div key={seg.label} className="flex justify-between items-start pb-3 border-b border-border/50 last:border-0 last:pb-0">
                    <div>
                      <span className="text-foreground font-medium">{seg.label}</span>
                      {seg.worst_stage && seg.worst_dropoff != null && (
                        <div className={`flex items-center gap-1 text-xs mt-1 ${severityStyles[severity]}`}>
                          <TrendingDown className="w-3 h-3" />
                          <span>Worst drop-off: {seg.worst_stage} ({seg.worst_dropoff.toFixed(1)}%)</span>
                        </div>
                      )}
                    </div>
                    <span className="font-medium whitespace-nowrap">{seg.conversion_rate}% conversion</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Fix Recommendations */}
        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <h3 className="text-xl font-semibold mb-4">Recommendations</h3>
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="border border-border rounded-lg p-4">
                <div className="flex items-start gap-3 mb-2">
                  <Lightbulb className="w-5 h-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{rec.title}</h4>
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${
                        rec.impact === 'High'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-amber-500/10 text-amber-600'
                      }`}
                    >
                      {rec.impact} impact
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground ml-8">{rec.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}