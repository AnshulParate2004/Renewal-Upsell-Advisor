import { useState } from 'react';
import { motion } from 'framer-motion';
import { Server, Bell, Shield, Palette, Save, Check } from 'lucide-react';

export default function Settings() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    apiEndpoint: 'http://localhost:8000',
    refreshInterval: '30',
    notifications: true,
    emailAlerts: true,
    riskThreshold: '40',
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (

    <div className="p-4 max-w-[1600px] mx-auto h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">System Configuration</h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">GLOBAL SETTINGS & PREFERENCES</p>
        </div>
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-black text-white text-xs font-bold uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-white hover:text-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
        >
          {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          {saved ? 'Changes Saved' : 'Save Configuration'}
        </button>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-12 gap-0 border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-none overflow-hidden flex-1">
        {/* Sidebar */}
        <div className="col-span-3 border-r-2 border-black bg-gray-50 p-0">
          <div className="p-4 border-b-2 border-black">
            <h3 className="text-xs font-bold text-black uppercase tracking-wider">Categories</h3>
          </div>
          <nav className="flex flex-col">
            <button className="flex items-center gap-3 px-4 py-4 text-sm font-bold border-b-2 border-black bg-black text-white uppercase tracking-wider">
              <Server className="w-4 h-4" />
              API & Connection
            </button>
            <button className="flex items-center gap-3 px-4 py-4 text-sm font-bold border-b-2 border-black text-black hover:bg-black hover:text-white transition-colors uppercase tracking-wider">
              <Bell className="w-4 h-4" />
              Notifications
            </button>
            <button className="flex items-center gap-3 px-4 py-4 text-sm font-bold border-b-2 border-black text-black hover:bg-black hover:text-white transition-colors uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              Risk Parameters
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="col-span-9 bg-white p-0 overflow-y-auto">
          <div className="max-w-2xl mx-auto p-8 space-y-10">
            {/* API Section */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 border-2 border-black bg-black text-white flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-black uppercase tracking-tight">API Configuration</h2>
                  <p className="text-xs text-gray-500 font-bold">Manage backend connection endpoints</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-black mb-1.5">API Endpoint URL</label>
                  <input
                    type="text"
                    value={settings.apiEndpoint}
                    onChange={(e) => setSettings({ ...settings, apiEndpoint: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-black bg-gray-50 font-mono text-sm font-bold focus:outline-none focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-black mb-1.5">Refresh Rate (Seconds)</label>
                  <input
                    type="number"
                    value={settings.refreshInterval}
                    onChange={(e) => setSettings({ ...settings, refreshInterval: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-black bg-gray-50 font-mono text-sm font-bold focus:outline-none focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </section>

            <div className="h-0.5 bg-black/10" />

            {/* Notifications Section */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 border-2 border-black bg-white text-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-black uppercase tracking-tight">Notifications</h2>
                  <p className="text-xs text-gray-500 font-bold">Alert preferences & delivery channels</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border-2 border-black p-4 flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div>
                    <h4 className="text-sm font-bold uppercase">Push Notifications</h4>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">Browser alerts for high risk</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
                    className={`w-10 h-6 border-2 border-black relative transition-colors ${settings.notifications ? 'bg-black' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white border border-black transition-transform ${settings.notifications ? 'left-4.5 translate-x-1' : 'left-0.5'}`} />
                  </button>
                </div>
                <div className="border-2 border-black p-4 flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div>
                    <h4 className="text-sm font-bold uppercase">Email Digests</h4>
                    <p className="text-[10px] text-gray-500 font-bold mt-0.5">Daily summary reports</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, emailAlerts: !settings.emailAlerts })}
                    className={`w-10 h-6 border-2 border-black relative transition-colors ${settings.emailAlerts ? 'bg-black' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white border border-black transition-transform ${settings.emailAlerts ? 'left-4.5 translate-x-1' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>
            </section>

            <div className="h-0.5 bg-black/10" />

            {/* Risk Section */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 border-2 border-black bg-red-600 text-white flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-black uppercase tracking-tight">Risk Thresholds</h2>
                  <p className="text-xs text-gray-500 font-bold">Parameter sensitivity configuration</p>
                </div>
              </div>
              <div className="border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex justify-between mb-2">
                  <label className="text-[10px] font-bold uppercase text-black">Login Drop Sensitivity</label>
                  <span className="font-mono text-xs font-bold text-red-600">{settings.riskThreshold}% Drop</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={settings.riskThreshold}
                  onChange={(e) => setSettings({ ...settings, riskThreshold: e.target.value })}
                  className="w-full h-2 bg-gray-200 rounded-none appearance-none cursor-pointer accent-black border border-black"
                />
                <p className="text-xs text-gray-500 font-medium mt-3 leading-relaxed">
                  Accounts showing a week-over-week login activity decline greater than <span className="font-mono text-black font-bold">{settings.riskThreshold}%</span> will be automatically flagged as <span className="text-red-600 font-bold uppercase">HIGH RISK</span>.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
