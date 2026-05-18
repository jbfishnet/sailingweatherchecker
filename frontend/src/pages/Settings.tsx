import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Bell, Mail, MessageSquare, Share2 } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({
    minBeaufort: 2,
    maxBeaufort: 4,
    sunnyOnly: true,
    minTemp: 15,
    maxPrecipitation: 0,
    maxGusts: 25,
    maxWaveHeight: 1.0,
    twilioSid: '',
    twilioToken: '',
    twilioFrom: '',
    twilioTo: '',
    emailHost: '',
    emailPort: 587,
    emailUser: '',
    emailPass: '',
    emailFrom: '',
    emailTo: '',
    teamsWebhook: '',
  });

  const [status, setStatus] = useState('');

  useEffect(() => {
    axios.get('/api/settings').then(res => setSettings(res.data));
  }, []);

  const save = async () => {
    await axios.post('/api/settings', settings);
    setStatus('Settings saved!');
    setTimeout(() => setStatus(''), 3000);
  };

  const test = async () => {
    try {
      setStatus('Sending test...');
      await axios.post('/api/settings/test-notification', settings);
      setStatus('Test notification sent!');
    } catch (e: any) {
      setStatus('Test failed: ' + e.message);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <section className="glass-card p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 neon-text">
          <Bell size={24} /> Sailing Thresholds
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm opacity-70">Min Wind (Beaufort)</label>
            <input type="number" className="w-full bg-slate-800 p-2 rounded" value={settings.minBeaufort} onChange={e => setSettings({...settings, minBeaufort: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm opacity-70">Max Wind (Beaufort)</label>
            <input type="number" className="w-full bg-slate-800 p-2 rounded" value={settings.maxBeaufort} onChange={e => setSettings({...settings, maxBeaufort: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm opacity-70">Min Temp (°C)</label>
            <input type="number" className="w-full bg-slate-800 p-2 rounded" value={settings.minTemp} onChange={e => setSettings({...settings, minTemp: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm opacity-70">Max Wave Height (m)</label>
            <input type="number" step="0.1" className="w-full bg-slate-800 p-2 rounded" value={settings.maxWaveHeight} onChange={e => setSettings({...settings, maxWaveHeight: e.target.value})} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={settings.sunnyOnly === true || settings.sunnyOnly === 'true'} onChange={e => setSettings({...settings, sunnyOnly: e.target.checked})} />
            <label className="text-sm opacity-70">Sunny Skies Only</label>
          </div>
        </div>
      </section>

      <section className="glass-card p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-neon-green">
          <MessageSquare size={24} /> WhatsApp (Twilio)
        </h2>
        <div className="space-y-3">
          <input placeholder="Account SID" className="w-full bg-slate-800 p-2 rounded" value={settings.twilioSid} onChange={e => setSettings({...settings, twilioSid: e.target.value})} />
          <input placeholder="Auth Token" type="password" className="w-full bg-slate-800 p-2 rounded" value={settings.twilioToken} onChange={e => setSettings({...settings, twilioToken: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="From Number" className="w-full bg-slate-800 p-2 rounded" value={settings.twilioFrom} onChange={e => setSettings({...settings, twilioFrom: e.target.value})} />
            <input placeholder="To Number" className="w-full bg-slate-800 p-2 rounded" value={settings.twilioTo} onChange={e => setSettings({...settings, twilioTo: e.target.value})} />
          </div>
        </div>
      </section>

      <section className="glass-card p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-400">
          <Mail size={24} /> Email (SMTP)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input placeholder="Host" className="w-full bg-slate-800 p-2 rounded" value={settings.emailHost} onChange={e => setSettings({...settings, emailHost: e.target.value})} />
          <input placeholder="Port" type="number" className="w-full bg-slate-800 p-2 rounded" value={settings.emailPort} onChange={e => setSettings({...settings, emailPort: e.target.value})} />
          <input placeholder="User" className="w-full bg-slate-800 p-2 rounded" value={settings.emailUser} onChange={e => setSettings({...settings, emailUser: e.target.value})} />
          <input placeholder="Pass" type="password" className="w-full bg-slate-800 p-2 rounded" value={settings.emailPass} onChange={e => setSettings({...settings, emailPass: e.target.value})} />
          <input placeholder="From Address" className="w-full bg-slate-800 p-2 rounded" value={settings.emailFrom} onChange={e => setSettings({...settings, emailFrom: e.target.value})} />
          <input placeholder="To Address" className="w-full bg-slate-800 p-2 rounded" value={settings.emailTo} onChange={e => setSettings({...settings, emailTo: e.target.value})} />
        </div>
      </section>

      <section className="glass-card p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-purple-400">
          <Share2 size={24} /> MS Teams
        </h2>
        <input placeholder="Webhook URL" className="w-full bg-slate-800 p-2 rounded" value={settings.teamsWebhook} onChange={e => setSettings({...settings, teamsWebhook: e.target.value})} />
      </section>

      <div className="flex gap-4">
        <button onClick={save} className="flex-1 bg-neon-blue text-slate-900 font-bold p-3 rounded-lg hover:bg-white transition-colors flex items-center justify-center gap-2">
          <Save size={20} /> Save Settings
        </button>
        <button onClick={test} className="flex-1 border border-slate-700 font-bold p-3 rounded-lg hover:bg-slate-800 transition-colors">
          Test Notification
        </button>
      </div>
      {status && <p className="text-center neon-text">{status}</p>}
    </div>
  );
}
