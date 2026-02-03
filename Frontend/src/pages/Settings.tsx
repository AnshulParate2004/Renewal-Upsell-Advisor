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

    <div className="p-4 max-w-[1600px] mx-auto h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">System Configuration</h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">GLOBAL SETTINGS & PREFERENCES</p>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold uppercase rounded shadow-sm hover:bg-primary/90 flex items-center gap-2 transition-colors"
        >
          {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          {saved ? 'Changes Saved' : 'Save Configuration'}
        </button>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-12 gap-0 border border-border bg-card rounded overflow-hidden flex-1 shadow-sm">
        {/* Sidebar */}
        <div className="col-span-3 border-r border-border bg-muted/5 p-0">
          <div className="p-4 border-b border-border/50">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Categories</h3>
          </div>
          <nav className="flex flex-col">
            <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium border-l-2 border-primary bg-primary/5 text-foreground">
              <Server className="w-4 h-4" />
              API & Connection
            </button>
            <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium border-l-2 border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
              <Bell className="w-4 h-4" />
              Notifications
            </button>
            <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium border-l-2 border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
              <Shield className="w-4 h-4" />
              Risk Parameters
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="col-span-9 bg-background p-0 overflow-y-auto">
          <div className="max-w-2xl mx-auto p-8 space-y-10">
            {/* API Section */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Server className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">API Configuration</h2>
                  <p className="text-xs text-muted-foreground">Manage backend connection endpoints</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 bg-card border border-border rounded p-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1.5">API Endpoint URL</label>
                  <input
                    type="text"
                    value={settings.apiEndpoint}
                    onChange={(e) => setSettings({ ...settings, apiEndpoint: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-border bg-muted/20 font-mono text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1.5">Refresh Rate (Seconds)</label>
                  <input
                    type="number"
                    value={settings.refreshInterval}
                    onChange={(e) => setSettings({ ...settings, refreshInterval: e.target.value })}
                    className="w-full px-3 py-2 rounded border border-border bg-muted/20 font-mono text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </section>

            <div className="h-px bg-border/50" />

            {/* Notifications Section */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded bg-warning/10 flex items-center justify-center border border-warning/20">
                  <Bell className="w-4 h-4 text-warning" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Notifications</h2>
                  <p className="text-xs text-muted-foreground">Alert preferences & delivery channels</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-border rounded p-4 flex items-center justify-between bg-card">
                  <div>
                    <h4 className="text-sm font-semibold">Push Notifications</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Browser alerts for high risk</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
                    className={`w-9 h-5 rounded-full relative transition-colors ${settings.notifications ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${settings.notifications ? 'left-5' : 'left-1'}`} />
                  </button>
                </div>
                <div className="border border-border rounded p-4 flex items-center justify-between bg-card">
                  <div>
                    <h4 className="text-sm font-semibold">Email Digests</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Daily summary reports</p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, emailAlerts: !settings.emailAlerts })}
                    className={`w-9 h-5 rounded-full relative transition-colors ${settings.emailAlerts ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${settings.emailAlerts ? 'left-5' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </section>

            <div className="h-px bg-border/50" />

            {/* Risk Section */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded bg-destructive/10 flex items-center justify-center border border-destructive/20">
                  <Shield className="w-4 h-4 text-destructive" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Risk Thresholds</h2>
                  <p className="text-xs text-muted-foreground">Parameter sensitivity configuration</p>
                </div>
              </div>
              <div className="border border-border rounded p-6 bg-card">
                <div className="flex justify-between mb-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Login Drop Sensitivity</label>
                  <span className="font-mono text-xs font-bold text-destructive">{settings.riskThreshold}% Drop</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="80"
                  value={settings.riskThreshold}
                  onChange={(e) => setSettings({ ...settings, riskThreshold: e.target.value })}
                  className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                />
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  Accounts showing a week-over-week login activity decline greater than <span className="font-mono text-foreground">{settings.riskThreshold}%</span> will be automatically flagged as <span className="text-destructive font-medium">HIGH RISK</span>.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
