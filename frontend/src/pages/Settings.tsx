import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Bell, Mail, MessageSquare, Share2, FlaskConical, CheckCircle, XCircle, MinusCircle, Loader, Eye } from 'lucide-react';

type Tab = 'conditions' | 'channels' | 'test';

type ChannelStatus = 'idle' | 'sending' | 'ok' | 'skipped' | string;

const channels = [
  { key: 'sendgrid', label: 'SendGrid', icon: Mail, color: 'text-blue-400' },
  { key: 'email', label: 'SMTP Email', icon: Mail, color: 'text-neon-blue' },
  { key: 'whatsapp', label: 'WhatsApp (Twilio)', icon: MessageSquare, color: 'text-neon-green' },
  { key: 'teams', label: 'MS Teams', icon: Share2, color: 'text-purple-400' },
];

function StatusIcon({ status }: { status: ChannelStatus }) {
  if (status === 'idle') return <MinusCircle size={18} className="opacity-30" />;
  if (status === 'sending') return <Loader size={18} className="animate-spin text-neon-blue" />;
  if (status === 'ok') return <CheckCircle size={18} className="text-green-400" />;
  if (status === 'skipped') return <MinusCircle size={18} className="opacity-30" />;
  return <XCircle size={18} className="text-red-400" />;
}

function StatusLabel({ status }: { status: ChannelStatus }) {
  if (status === 'idle') return null;
  if (status === 'sending') return <span className="text-xs text-neon-blue">Sending…</span>;
  if (status === 'ok') return <span className="text-xs text-green-400">Sent</span>;
  if (status === 'skipped') return <span className="text-xs opacity-40">Not configured</span>;
  return <span className="text-xs text-red-400 truncate max-w-xs" title={status}>{status}</span>;
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('conditions');
  const [settings, setSettings] = useState<any>({
    minBeaufort: 2, maxBeaufort: 4, sunnyOnly: true,
    minTemp: 15, maxPrecipitation: 0, maxGusts: 25, maxWaveHeight: 1.0,
    sendgridApiKey: '', sendgridFrom: '', sendgridTo: '',
    twilioSid: '', twilioToken: '', twilioFrom: '', twilioTo: '',
    emailHost: '', emailPort: 587, emailUser: '', emailPass: '', emailFrom: '', emailTo: '',
    teamsWebhook: '',
  });
  const [saveStatus, setSaveStatus] = useState('');
  const [testResults, setTestResults] = useState<Record<string, ChannelStatus>>({});
  const [testingAll, setTestingAll] = useState(false);
  const [simulateResults, setSimulateResults] = useState<Record<string, ChannelStatus>>({});
  const [simulatingEmail, setSimulatingEmail] = useState(false);

  useEffect(() => {
    axios.get('/api/settings').then(res => setSettings((prev: any) => ({ ...prev, ...res.data })));
  }, []);

  const save = async () => {
    await axios.post('/api/settings', settings);
    setSaveStatus('Saved!');
    setTimeout(() => setSaveStatus(''), 2500);
  };

  const set = (key: string, value: any) => setSettings((s: any) => ({ ...s, [key]: value }));

  const simulateEmail = async () => {
    setSimulatingEmail(true);
    setSimulateResults({ sendgrid: 'sending', email: 'sending' });
    try {
      const res = await axios.post('/api/settings/simulate-email', settings);
      setSimulateResults(res.data);
    } catch (e: any) {
      setSimulateResults({ sendgrid: e.message || 'error', email: e.message || 'error' });
    } finally {
      setSimulatingEmail(false);
    }
  };

  const testAll = async () => {
    setTestingAll(true);
    setTestResults(Object.fromEntries(channels.map(c => [c.key, 'sending'])));
    try {
      const res = await axios.post('/api/settings/test-notification', settings);
      setTestResults(res.data);
    } catch (e: any) {
      setTestResults(Object.fromEntries(channels.map(c => [c.key, e.message || 'error'])));
    } finally {
      setTestingAll(false);
    }
  };

  const inputCls = 'w-full bg-slate-800 p-2.5 rounded text-sm focus:outline-none focus:ring-1 focus:ring-neon-blue';
  const labelCls = 'block text-sm opacity-70 mb-1';

  return (
    <div className="space-y-6 pb-20">
      {/* Tab bar */}
      <div className="glass-card p-1 flex gap-1">
        {([['conditions', 'Conditions', Bell], ['channels', 'Channels', Mail], ['test', 'Test', FlaskConical]] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-colors
              ${tab === key ? 'bg-neon-blue text-slate-900' : 'hover:bg-slate-700 opacity-60 hover:opacity-100'}`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* ── CONDITIONS ── */}
      {tab === 'conditions' && (
        <section className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-bold neon-text">Sailing Thresholds</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Min Wind (Beaufort)</label>
              <input type="number" className={inputCls} value={settings.minBeaufort} onChange={e => set('minBeaufort', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Max Wind (Beaufort)</label>
              <input type="number" className={inputCls} value={settings.maxBeaufort} onChange={e => set('maxBeaufort', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Min Temperature (°C)</label>
              <input type="number" className={inputCls} value={settings.minTemp} onChange={e => set('minTemp', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Max Gusts (km/h)</label>
              <input type="number" className={inputCls} value={settings.maxGusts} onChange={e => set('maxGusts', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Max Wave Height (m) — 0 = ignore</label>
              <input type="number" step="0.1" className={inputCls} value={settings.maxWaveHeight} onChange={e => set('maxWaveHeight', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Max Precipitation (mm)</label>
              <input type="number" step="0.1" className={inputCls} value={settings.maxPrecipitation} onChange={e => set('maxPrecipitation', e.target.value)} />
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <input type="checkbox" id="sunnyOnly" className="w-4 h-4 accent-neon-blue"
                checked={settings.sunnyOnly === true || settings.sunnyOnly === 'true'}
                onChange={e => set('sunnyOnly', e.target.checked)} />
              <label htmlFor="sunnyOnly" className="text-sm opacity-70">Sunny Skies Only (cloud cover &lt; 30%, clear WMO code)</label>
            </div>
          </div>
        </section>
      )}

      {/* ── CHANNELS ── */}
      {tab === 'channels' && (
        <div className="space-y-4">
          {/* SendGrid */}
          <section className="glass-card p-6 space-y-3">
            <h2 className="text-lg font-bold text-blue-400 flex items-center gap-2">
              <Mail size={20} /> SendGrid Email
            </h2>
            <p className="text-xs opacity-50">The "From" address must be a verified sender in your SendGrid account.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className={labelCls}>API Key</label>
                <input type="password" className={inputCls} placeholder="SG.xxxx" value={settings.sendgridApiKey} onChange={e => set('sendgridApiKey', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>From Address (verified sender)</label>
                <input className={inputCls} placeholder="you@yourdomain.com" value={settings.sendgridFrom} onChange={e => set('sendgridFrom', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>To Address</label>
                <input className={inputCls} placeholder="recipient@example.com" value={settings.sendgridTo} onChange={e => set('sendgridTo', e.target.value)} />
              </div>
            </div>
          </section>

          {/* SMTP */}
          <section className="glass-card p-6 space-y-3">
            <h2 className="text-lg font-bold text-neon-blue flex items-center gap-2">
              <Mail size={20} /> SMTP Email
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Host</label>
                <input className={inputCls} placeholder="smtp.example.com" value={settings.emailHost} onChange={e => set('emailHost', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Port</label>
                <input type="number" className={inputCls} value={settings.emailPort} onChange={e => set('emailPort', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Username</label>
                <input className={inputCls} value={settings.emailUser} onChange={e => set('emailUser', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Password</label>
                <input type="password" className={inputCls} value={settings.emailPass} onChange={e => set('emailPass', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>From Address</label>
                <input className={inputCls} value={settings.emailFrom} onChange={e => set('emailFrom', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>To Address</label>
                <input className={inputCls} value={settings.emailTo} onChange={e => set('emailTo', e.target.value)} />
              </div>
            </div>
          </section>

          {/* WhatsApp */}
          <section className="glass-card p-6 space-y-3">
            <h2 className="text-lg font-bold text-neon-green flex items-center gap-2">
              <MessageSquare size={20} /> WhatsApp (Twilio)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Account SID</label>
                <input className={inputCls} value={settings.twilioSid} onChange={e => set('twilioSid', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Auth Token</label>
                <input type="password" className={inputCls} value={settings.twilioToken} onChange={e => set('twilioToken', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>From Number</label>
                <input className={inputCls} placeholder="+14155238886" value={settings.twilioFrom} onChange={e => set('twilioFrom', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>To Number</label>
                <input className={inputCls} placeholder="+49..." value={settings.twilioTo} onChange={e => set('twilioTo', e.target.value)} />
              </div>
            </div>
          </section>

          {/* Teams */}
          <section className="glass-card p-6 space-y-3">
            <h2 className="text-lg font-bold text-purple-400 flex items-center gap-2">
              <Share2 size={20} /> MS Teams
            </h2>
            <div>
              <label className={labelCls}>Incoming Webhook URL</label>
              <input className={inputCls} placeholder="https://outlook.office.com/webhook/..." value={settings.teamsWebhook} onChange={e => set('teamsWebhook', e.target.value)} />
            </div>
          </section>
        </div>
      )}

      {/* ── TEST ── */}
      {tab === 'test' && (
        <section className="glass-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold neon-text flex items-center gap-2">
              <FlaskConical size={20} /> Test Notifications
            </h2>
            <button
              onClick={testAll}
              disabled={testingAll}
              className="bg-neon-blue text-slate-900 font-bold px-5 py-2 rounded-lg hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {testingAll ? <Loader size={16} className="animate-spin" /> : <FlaskConical size={16} />}
              Test All
            </button>
          </div>

          <p className="text-sm opacity-50">
            Saves the current form values and sends a test message to every configured channel.
            Make sure you save your settings first if you changed them.
          </p>

          <div className="space-y-3">
            {channels.map(({ key, label, icon: Icon, color }) => {
              const status: ChannelStatus = testResults[key] ?? 'idle';
              const isConfigured = (() => {
                if (key === 'sendgrid') return !!(settings.sendgridApiKey && settings.sendgridFrom && settings.sendgridTo);
                if (key === 'email') return !!(settings.emailHost && settings.emailUser && settings.emailTo);
                if (key === 'whatsapp') return !!(settings.twilioSid && settings.twilioToken && settings.twilioTo);
                if (key === 'teams') return !!settings.teamsWebhook;
                return false;
              })();

              return (
                <div key={key} className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <Icon size={20} className={color} />
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{label}</div>
                    <div className="text-xs opacity-40 mt-0.5">
                      {isConfigured ? 'Configured' : 'Not configured — fill in the Channels tab'}
                    </div>
                  </div>
                  <StatusLabel status={status} />
                  <StatusIcon status={status} />
                </div>
              );
            })}
          </div>

          {Object.values(testResults).some(v => v === 'ok') && (
            <p className="text-sm text-green-400 text-center">
              Check your inbox / WhatsApp / Teams for the test message.
            </p>
          )}

          {/* ── Preview Email ── */}
          <div className="border-t border-slate-700 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Preview HTML Email</p>
                <p className="text-xs opacity-50 mt-0.5">
                  Sends a fully rendered sailing-alert email with sample weather data.
                </p>
              </div>
              <button
                onClick={simulateEmail}
                disabled={simulatingEmail}
                className="bg-indigo-500 text-white font-bold px-5 py-2 rounded-lg hover:bg-indigo-400 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {simulatingEmail ? <Loader size={16} className="animate-spin" /> : <Eye size={16} />}
                Send Preview
              </button>
            </div>
            {['sendgrid', 'email'].map(key => {
              const ch = channels.find(c => c.key === key)!;
              const status: ChannelStatus = simulateResults[key] ?? 'idle';
              return (
                <div key={key} className="flex items-center gap-4 p-3 bg-slate-800/30 rounded-xl border border-slate-700/50">
                  <ch.icon size={18} className={ch.color} />
                  <span className="flex-1 text-sm font-semibold">{ch.label}</span>
                  <StatusLabel status={status} />
                  <StatusIcon status={status} />
                </div>
              );
            })}
            {Object.values(simulateResults).some(v => v === 'ok') && (
              <p className="text-sm text-indigo-400 text-center">
                Preview email sent! Check your inbox for the rendered sailing alert.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Save bar — always visible */}
      <div className="flex gap-4 items-center">
        <button
          onClick={save}
          className="flex-1 bg-neon-blue text-slate-900 font-bold p-3 rounded-lg hover:bg-white transition-colors flex items-center justify-center gap-2"
        >
          <Save size={20} /> Save Settings
        </button>
        {saveStatus && <span className="neon-text font-semibold">{saveStatus}</span>}
      </div>
    </div>
  );
}
