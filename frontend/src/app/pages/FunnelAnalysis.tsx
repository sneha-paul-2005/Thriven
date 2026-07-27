import { useState, useEffect } from 'react';
import { FunnelStage } from '../components/FunnelStage';
import { Lightbulb, Monitor, MapPin, Share2 } from 'lucide-react';
import { api, getToken } from '../services/api';

type SegmentTab = 'device' | 'location' | 'traffic';

const FALLBACK_FUNNEL = [
  { label: 'Visit', count: 45000, percentage: 100, color: '#7F77DD' },
  { label: 'Signup', count: 9000, percentage: 20, color: '#1D9E75' },
  { label: 'Add to Cart', count: 2700, percentage: 6, color: '#A29FE8' },
  { label: 'Purchase', count: 1350, percentage: 3, color: '#D85A30' },
];

const STAGE_COLORS = ['#7F77DD', '#1D9E75', '#A29FE8', '#D85A30'];

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

export function FunnelAnalysis() {
  const [activeTab, setActiveTab] = useState<SegmentTab>('device');
  const [funnelData, setFunnelData] = useState(FALLBACK_FUNNEL);
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
              color: STAGE_COLORS[i] ?? '#7F77DD',
            }))
          );
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
              <button
                onClick={() => setActiveTab('device')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'device'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <Monitor className="w-4 h-4" />
                Device
              </button>
              <button
                onClick={() => setActiveTab('location')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'location'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <MapPin className="w-4 h-4" />
                Location
              </button>
              <button
                onClick={() => setActiveTab('traffic')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'traffic'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <Share2 className="w-4 h-4" />
                Traffic Source
              </button>
            </div>

            <div className="bg-secondary/50 rounded-lg p-4">
              {activeTab === 'device' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">Desktop</span>
                    <span className="font-medium">4.2% conversion</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">Mobile</span>
                    <span className="font-medium">2.5% conversion</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">Tablet</span>
                    <span className="font-medium">3.1% conversion</span>
                  </div>
                </div>
              )}
              {activeTab === 'location' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">United States</span>
                    <span className="font-medium">4.1% conversion</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">United Kingdom</span>
                    <span className="font-medium">3.8% conversion</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">Canada</span>
                    <span className="font-medium">3.5% conversion</span>
                  </div>
                </div>
              )}
              {activeTab === 'traffic' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">Organic Search</span>
                    <span className="font-medium">5.2% conversion</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">Paid Ads</span>
                    <span className="font-medium">3.4% conversion</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">Social Media</span>
                    <span className="font-medium">2.1% conversion</span>
                  </div>
                </div>
              )}
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