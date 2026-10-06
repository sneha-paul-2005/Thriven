import { useState, useEffect } from 'react';
import { User, Building2, Bell, Mail, CheckCircle, AlertTriangle, Globe, Copy, Check } from 'lucide-react';
import { api, getToken, setDisplayName } from '../services/api';

const labelClass = 'block mb-2 text-foreground';
const inputClass = 'w-full px-4 py-3 rounded-lg';
const saveBtnClass =
  'px-5 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-60';

type SaveState = { status: 'idle' | 'saving' | 'saved' | 'error'; message: string };
const IDLE: SaveState = { status: 'idle', message: '' };

function Toggle({
  checked,
  defaultChecked,
  onChange,
  disabled,
}: {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: () => void;
  disabled?: boolean;
}) {
  return (
    <label className="relative inline-flex items-center cursor-pointer shrink-0">
      <input
        type="checkbox"
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-switch-background peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
    </label>
  );
}

function SaveStatus({ state }: { state: SaveState }) {
  if (state.status === 'saved') {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-primary">
        <CheckCircle className="w-4 h-4 shrink-0" />
        {state.message}
      </span>
    );
  }
  if (state.status === 'error') {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-destructive">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        {state.message}
      </span>
    );
  }
  return null;
}

export function Settings() {
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [sendMessage, setSendMessage] = useState('');

  // Profile / company form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [profileSave, setProfileSave] = useState<SaveState>(IDLE);
  const [companySave, setCompanySave] = useState<SaveState>(IDLE);

  // Phase 11 — Public Growth Page state
  const [publicEnabled, setPublicEnabled] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');
  const [publicLoading, setPublicLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadProfile();
    fetchPublicStatus();
  }, []);

  const applyProfile = (p: any) => {
    setFirstName(p.first_name || '');
    setLastName(p.last_name || '');
    setEmail(p.email || '');
    setCompanyName(p.company_name || '');
    setIndustry(p.industry || '');
  };

  const loadProfile = async () => {
    try {
      const p = await api.getProfile(getToken());
      applyProfile(p);
    } catch (_) {
      // 401s are handled by the API helper (redirect to login)
    }
  };

  const saveProfile = async (
    fields: Record<string, string>,
    setState: (s: SaveState) => void
  ) => {
    setState({ status: 'saving', message: '' });
    try {
      const p = await api.updateProfile(getToken(), fields);
      if (p?.detail) {
        setState({ status: 'error', message: 'Could not save changes.' });
        return;
      }
      applyProfile(p);
      // Update the top bar immediately
      if (p.display_name) setDisplayName(p.display_name);
      setState({ status: 'saved', message: 'Saved' });
      setTimeout(() => setState(IDLE), 2500);
    } catch (_) {
      setState({ status: 'error', message: 'Could not save changes.' });
    }
  };

  const fetchPublicStatus = async () => {
    try {
      const token = getToken();
      const result = await api.getPublicStatus(token);
      if (result.enabled && result.token) {
        setPublicEnabled(true);
        setPublicUrl(`${window.location.origin}/grow/${result.token}`);
      } else {
        setPublicEnabled(false);
        setPublicUrl('');
      }
    } catch (_) {
      setPublicEnabled(false);
      setPublicUrl('');
    }
  };

  const handleTogglePublic = async () => {
    setPublicLoading(true);
    try {
      const token = getToken();
      if (publicEnabled) {
        await api.disablePublicPage(token);
        setPublicEnabled(false);
        setPublicUrl('');
      } else {
        const result = await api.enablePublicPage(token);
        if (result.token) {
          setPublicEnabled(true);
          setPublicUrl(`${window.location.origin}/grow/${result.token}`);
        }
      }
    } catch (_) {
      // Leave state as-is on failure; user can retry the toggle
    }
    setPublicLoading(false);
  };

  const handleCopy = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      // Clipboard API unavailable — no-op
    }
  };

  const handleSendDigest = async () => {
    setSending(true);
    setSendStatus('idle');
    try {
      const token = getToken();
      const result = await api.sendDigestEmail(token);
      if (result.message) {
        setSendStatus('success');
        setSendMessage(result.message);
      } else {
        setSendStatus('error');
        setSendMessage(result.detail || 'Failed to send digest email.');
      }
    } catch (_) {
      setSendStatus('error');
      setSendMessage('Something went wrong sending the email.');
    }
    setSending(false);
  };

  return (
    <div className="max-w-4xl space-y-6 min-w-0">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Settings */}
      <div className="glass-panel rounded-xl p-6 overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <User className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Profile</h3>
        </div>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>First name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Your first name"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Last name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Your last name"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={email}
              readOnly
              placeholder="you@company.com"
              className={`${inputClass} opacity-80 cursor-not-allowed`}
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                saveProfile({ first_name: firstName, last_name: lastName }, setProfileSave)
              }
              disabled={profileSave.status === 'saving'}
              className={saveBtnClass}
            >
              {profileSave.status === 'saving' ? 'Saving...' : 'Save changes'}
            </button>
            <SaveStatus state={profileSave} />
          </div>
        </div>
      </div>

      {/* Company Settings */}
      <div className="glass-panel rounded-xl p-6 overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Company</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Company name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your company name"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Industry</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className={inputClass}
            >
              <option value="">Select industry</option>
              <option value="E-commerce">E-commerce</option>
              <option value="SaaS">SaaS</option>
              <option value="Marketplace">Marketplace</option>
              <option value="Media">Media</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                saveProfile({ company_name: companyName, industry }, setCompanySave)
              }
              disabled={companySave.status === 'saving'}
              className={saveBtnClass}
            >
              {companySave.status === 'saving' ? 'Saving...' : 'Save changes'}
            </button>
            <SaveStatus state={companySave} />
          </div>
        </div>
      </div>

      {/* Public Growth Page — Phase 11 */}
      <div className="glass-panel rounded-xl p-6 overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Public Growth Page</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium text-foreground">Share a public snapshot</p>
              <p className="text-sm text-muted-foreground">
                Anyone with the link can view your DAU, MAU, and growth trend — no login required.
                Funnel and conversion data stay private.
              </p>
            </div>
            <Toggle checked={publicEnabled} onChange={handleTogglePublic} disabled={publicLoading} />
          </div>

          {publicEnabled && publicUrl && (
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="flex-1 min-w-0 px-4 py-3 rounded-lg text-muted-foreground text-sm"
              />
              <button
                onClick={handleCopy}
                className="p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
                title="Copy link"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-panel rounded-xl p-6 overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-destructive/10 rounded-lg">
            <Bell className="w-5 h-5 text-destructive" />
          </div>
          <h3 className="text-xl font-semibold">Notifications</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium text-foreground">Email alerts</p>
              <p className="text-sm text-muted-foreground">Receive email notifications for metric alerts</p>
            </div>
            <Toggle defaultChecked />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium text-foreground">Weekly reports</p>
              <p className="text-sm text-muted-foreground">Get a weekly summary of your metrics</p>
            </div>
            <Toggle defaultChecked />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium text-foreground">Product updates</p>
              <p className="text-sm text-muted-foreground">Stay updated on new features and improvements</p>
            </div>
            <Toggle />
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="w-5 h-5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-foreground">Weekly Digest Email</p>
                <p className="text-sm text-muted-foreground">Send yourself a test digest with your current metrics and alerts</p>
              </div>
            </div>
            <button
              onClick={handleSendDigest}
              disabled={sending}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {sending ? 'Sending...' : 'Send Test Digest Email'}
            </button>

            {sendStatus === 'success' && (
              <div className="flex items-center gap-2 text-sm text-primary mt-3">
                <CheckCircle className="w-4 h-4 shrink-0" />
                {sendMessage}
              </div>
            )}
            {sendStatus === 'error' && (
              <div className="flex items-center gap-2 text-sm text-destructive mt-3">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {sendMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}