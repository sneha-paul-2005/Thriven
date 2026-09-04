import { useState, useEffect } from 'react';
import { User, Building2, Bell, Mail, CheckCircle, AlertTriangle, Globe, Copy, Check } from 'lucide-react';
import { Button } from '../components/Button';
import { api, getToken } from '../services/api';

export function Settings() {
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [sendMessage, setSendMessage] = useState('');

  // Phase 11 — Public Growth Page state
  const [publicEnabled, setPublicEnabled] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');
  const [publicLoading, setPublicLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchPublicStatus();
  }, []);

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
      // Silently fail on load — settings page shouldn't break if this errors
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
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Settings */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <User className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Profile</h3>
        </div>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-foreground">First name</label>
              <input
                type="text"
                defaultValue="John"
                className="w-full px-4 py-3 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block mb-2 text-foreground">Last name</label>
              <input
                type="text"
                defaultValue="Doe"
                className="w-full px-4 py-3 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 text-foreground">Email</label>
            <input
              type="email"
              defaultValue="john@acme.com"
              className="w-full px-4 py-3 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <Button variant="primary">Save changes</Button>
        </div>
      </div>

      {/* Company Settings */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Building2 className="w-5 h-5 text-accent" />
          </div>
          <h3 className="text-xl font-semibold">Company</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block mb-2 text-foreground">Company name</label>
            <input
              type="text"
              defaultValue="Acme Inc"
              className="w-full px-4 py-3 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block mb-2 text-foreground">Industry</label>
            <select className="w-full px-4 py-3 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-primary">
              <option>E-commerce</option>
              <option>SaaS</option>
              <option>Marketplace</option>
              <option>Media</option>
              <option>Other</option>
            </select>
          </div>

          <Button variant="primary">Save changes</Button>
        </div>
      </div>

      {/* Public Growth Page — Phase 11 */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Public Growth Page</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Share a public snapshot</p>
              <p className="text-sm text-muted-foreground">
                Anyone with the link can view your DAU, MAU, and growth trend — no login required.
                Funnel and conversion data stay private.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={publicEnabled}
                onChange={handleTogglePublic}
                disabled={publicLoading}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-switch-background peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {publicEnabled && publicUrl && (
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="flex-1 px-4 py-3 rounded-lg bg-input-background border border-border text-muted-foreground text-sm"
              />
              <button
                onClick={handleCopy}
                className="p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                title="Copy link"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-destructive/10 rounded-lg">
            <Bell className="w-5 h-5 text-destructive" />
          </div>
          <h3 className="text-xl font-semibold">Notifications</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Email alerts</p>
              <p className="text-sm text-muted-foreground">Receive email notifications for metric alerts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-switch-background peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Weekly reports</p>
              <p className="text-sm text-muted-foreground">Get a weekly summary of your metrics</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-switch-background peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Product updates</p>
              <p className="text-sm text-muted-foreground">Stay updated on new features and improvements</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-switch-background peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-3 mb-3">
              <Mail className="w-5 h-5 text-primary" />
              <div>
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
              <div className="flex items-center gap-2 text-sm text-green-600 mt-3">
                <CheckCircle className="w-4 h-4" />
                {sendMessage}
              </div>
            )}
            {sendStatus === 'error' && (
              <div className="flex items-center gap-2 text-sm text-destructive mt-3">
                <AlertTriangle className="w-4 h-4" />
                {sendMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}