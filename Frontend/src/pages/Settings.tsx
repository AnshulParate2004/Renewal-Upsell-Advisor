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
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your RevIQ Advisor preferences</p>
      </motion.div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* API Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/10">
              <Server className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">API Configuration</h2>
              <p className="text-xs text-muted-foreground">Backend connection settings</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                API Endpoint
              </label>
              <input
                type="text"
                value={settings.apiEndpoint}
                onChange={(e) => setSettings({ ...settings, apiEndpoint: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border/50 text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Data Refresh Interval (seconds)
              </label>
              <input
                type="number"
                value={settings.refreshInterval}
                onChange={(e) => setSettings({ ...settings, refreshInterval: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-muted/50 border border-border/50 text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-warning/10">
              <Bell className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Notifications</h2>
              <p className="text-xs text-muted-foreground">Alert preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/30">
              <div>
                <p className="text-sm font-medium text-foreground">Push Notifications</p>
                <p className="text-xs text-muted-foreground">Get alerted for high-risk accounts</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, notifications: !settings.notifications })}
                className={`
                  w-12 h-6 rounded-full transition-colors relative
                  ${settings.notifications ? 'bg-primary' : 'bg-muted'}
                `}
              >
                <div className={`
                  absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                  ${settings.notifications ? 'left-7' : 'left-1'}
                `} />
              </button>
            </div>

            <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/30">
              <div>
                <p className="text-sm font-medium text-foreground">Email Alerts</p>
                <p className="text-xs text-muted-foreground">Daily summary of at-risk renewals</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, emailAlerts: !settings.emailAlerts })}
                className={`
                  w-12 h-6 rounded-full transition-colors relative
                  ${settings.emailAlerts ? 'bg-primary' : 'bg-muted'}
                `}
              >
                <div className={`
                  absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                  ${settings.emailAlerts ? 'left-7' : 'left-1'}
                `} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Risk Thresholds */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Shield className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Risk Configuration</h2>
              <p className="text-xs text-muted-foreground">Customize risk detection</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Login Drop Threshold (%)
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="10"
                max="80"
                value={settings.riskThreshold}
                onChange={(e) => setSettings({ ...settings, riskThreshold: e.target.value })}
                className="flex-1 h-2 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
              />
              <span className="font-mono text-sm text-foreground w-12">
                {settings.riskThreshold}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Accounts with login drops above this threshold will be flagged as high risk
            </p>
          </div>
        </motion.div>
      </div>

      {/* Save Button */}
      <motion.button
        onClick={handleSave}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium"
      >
        {saved ? (
          <>
            <Check className="w-4 h-4" />
            Saved!
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Save Changes
          </>
        )}
      </motion.button>
    </div>
  );
}
