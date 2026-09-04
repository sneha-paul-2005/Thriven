import { useState, useEffect } from 'react';
import { Briefcase, Plus, Trash2, Users, UserCheck, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

interface TrackedStartup {
  token: string;
  data: {
    startup_name: string;
    dau: number;
    mau: number;
    growth_trend: { date: string; users: number }[];
  } | null;
  error: boolean;
  loading: boolean;
}

const STORAGE_KEY = 'thriven_vc_tokens';

function extractToken(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/grow\/([^/?#]+)/);
  return match ? match[1] : trimmed;
}

export function VCDashboard() {
  const [inputValue, setInputValue] = useState('');
  const [startups, setStartups] = useState<TrackedStartup[]>([]);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const tokens: string[] = JSON.parse(saved);
      tokens.forEach((token) => loadStartup(token));
    }
  }, []);

  const persistTokens = (list: TrackedStartup[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.map((s) => s.token)));
  };

  const loadStartup = async (token: string) => {
    setStartups((prev) => [...prev, { token, data: null, error: false, loading: true }]);
    try {
      const result = await api.getPublicPage(token);
      if (result.detail) {
        setStartups((prev) =>
          prev.map((s) => (s.token === token ? { ...s, error: true, loading: false } : s))
        );
      } else {
        setStartups((prev) =>
          prev.map((s) => (s.token === token ? { ...s, data: result, loading: false } : s))
        );
      }
    } catch (_) {
      setStartups((prev) =>
        prev.map((s) => (s.token === token ? { ...s, error: true, loading: false } : s))
      );
    }
  };

  const handleAdd = async () => {
    setAddError('');
    const token = extractToken(inputValue);
    if (!token) return;

    if (startups.some((s) => s.token === token)) {
      setAddError('This startup is already in your list.');
      return;
    }

    setInputValue('');
    await loadStartup(token);
  };

  const handleRemove = (token: string) => {
    setStartups((prev) => {
      const next = prev.filter((s) => s.token !== token);
      persistTokens(next);
      return next;
    });
  };

  // Persist whenever a fetch resolves (loading -> loaded/error)
  useEffect(() => {
    if (startups.length > 0 && !startups.some((s) => s.loading)) {
      persistTokens(startups);
    }
  }, [startups]);

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">VC View</h1>
        <p className="text-muted-foreground mt-1">
          Track growth snapshots across your portfolio companies using their public links.
        </p>
      </div>

      {/* Add startup */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Briefcase className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Add a startup</h3>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Paste their public growth link (e.g. http://localhost:5173/grow/xk29d81a)"
            className="flex-1 px-4 py-3 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleAdd}
            className="px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
        {addError && <p className="text-sm text-destructive mt-2">{addError}</p>}
        <p className="text-sm text-muted-foreground mt-2">
          Ask each founder to enable their Public Growth Page in Settings and share the link with you.
        </p>
      </div>

      {/* Startup cards */}
      {startups.length === 0 ? (
        <div className="bg-card rounded-xl p-12 shadow-sm border border-border text-center">
          <p className="text-muted-foreground">No startups tracked yet. Add one above to get started.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {startups.map((s) => (
            <div key={s.token} className="bg-card rounded-xl p-6 shadow-sm border border-border">
              {s.loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : s.error ? (
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Unavailable</p>
                    <p className="text-sm text-muted-foreground">
                      This link is invalid or the founder disabled it.
                    </p>
                  </div>
                  <button onClick={() => handleRemove(s.token)}>
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive transition-colors" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">{s.data?.startup_name}</h3>
                    <button onClick={() => handleRemove(s.token)}>
                      <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive transition-colors" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                        <Users className="w-4 h-4" />
                        DAU
                      </div>
                      <p className="text-2xl font-semibold text-foreground">{s.data?.dau}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                        <UserCheck className="w-4 h-4" />
                        MAU
                      </div>
                      <p className="text-2xl font-semibold text-foreground">{s.data?.mau}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}