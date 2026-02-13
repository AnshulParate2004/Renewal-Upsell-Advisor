import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Database, Bell, Save, ShieldCheck, ExternalLink, RefreshCw } from "lucide-react";

const integrations = [
  { name: "Salesforce", status: "connected", lastSync: "5m ago", icon: "CRM" },
  { name: "Stripe", status: "connected", lastSync: "12m ago", icon: "PAY" },
  { name: "Twilio", status: "connected", lastSync: "1h ago", icon: "VOX" },
  { name: "HubSpot", status: "not_connected", lastSync: null, icon: "CRM" },
  { name: "Zendesk", status: "not_connected", lastSync: null, icon: "SPT" },
];

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    highRisk: true, renewals: true, daily: false, failedCalls: true,
  });

  const toggleNotif = (key: keyof typeof notifications) =>
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen flex flex-col space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-5xl font-bold text-foreground tracking-tight leading-none">
            System <span className="text-primary">Configuration</span>
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-2">
            Operational Parameter Registry & Security Vault
          </p>
        </div>
        <button className="px-6 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2 group">
          <Save size={18} className="group-hover:scale-110 transition-transform" />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: Integrations */}
        <div className="lg:col-span-8 space-y-6">
          <div className="paper-card overflow-hidden bg-white p-0">
            <div className="p-6 border-b border-gray-100 bg-primary/5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
                <Database size={24} className="text-primary" />
                Data Fabric Sync
              </h3>
              <div className="sticker-outline px-3 py-1 text-xs">V4.2.0 Stable</div>
            </div>
            <div className="p-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {integrations.map((int) => (
                <div key={int.name} className="p-5 border border-purple-100 bg-white rounded-xl hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center font-bold text-xs text-primary shadow-sm">
                        {int.icon}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-foreground tracking-tight">{int.name}</h4>
                        {int.lastSync && (
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <RefreshCw size={8} /> Sync: {int.lastSync}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-[10px] font-bold ${int.status === 'connected' ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-400'}`}>
                      {int.status === 'connected' ? 'ACTIVE' : 'OFFLINE'}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-2 text-xs font-bold text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                      PARAMS
                    </button>
                    <button className={`flex-1 px-3 py-2 text-xs font-bold rounded-lg transition-all ${int.status === 'connected' ? 'bg-primary text-white' : 'bg-accent text-white'}`}>
                      {int.status === 'connected' ? 'DISABLE' : 'CONNECT'}
                    </button>
                  </div>
                </div>
              ))}
              <div className="border-2 border-dashed border-purple-100 p-6 bg-primary/[0.02] rounded-xl flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center text-primary text-xl font-bold group-hover:scale-110 transition-transform">+</div>
                <p className="mt-3 text-xs font-semibold text-gray-400 group-hover:text-primary transition-colors">Add New Service</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Notifications & Security */}
        <div className="lg:col-span-4 space-y-6">
          <div className="paper-card overflow-hidden bg-white p-0">
            <div className="p-6 border-b border-gray-100 bg-accent/5 flex items-center gap-3">
              <Bell size={24} className="text-accent" />
              <h3 className="text-xl font-bold text-foreground">Alert Signals</h3>
            </div>
            <div className="p-6 space-y-2">
              {([["highRisk", "Anomalous Account Risk"], ["renewals", "Lifecycle Phase Reminders"], ["daily", "Automated Daily Digest"], ["failedCalls", "Voice Path Failures"]] as const).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between py-3 px-2 hover:bg-gray-50 rounded-lg transition-colors group">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">{label}</Label>
                    <p className="text-[10px] font-medium text-gray-400">Push & Email Relay</p>
                  </div>
                  <Switch
                    checked={notifications[key]}
                    onCheckedChange={() => toggleNotif(key)}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="paper-card overflow-hidden bg-foreground text-white p-6 border-none shadow-xl shadow-purple-900/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/10 rounded-lg">
                <ShieldCheck size={24} className="text-primary" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Security Vault</h3>
            </div>
            <p className="text-sm font-medium text-white/70 leading-relaxed mb-6">
              All data is encrypted via AES-256-GCM. Session stability handled by ZeroTrust architecture.
            </p>
            <button className="w-full py-2.5 bg-white text-foreground rounded-lg font-bold text-xs hover:bg-gray-100 transition-all flex items-center justify-center gap-2 group">
              AUDIT ACCESS LOGS
              <ExternalLink size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
