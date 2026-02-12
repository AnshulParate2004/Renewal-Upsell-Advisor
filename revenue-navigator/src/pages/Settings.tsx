import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const integrations = [
  { name: "Salesforce", status: "connected", lastSync: "5 minutes ago" },
  { name: "Stripe", status: "connected", lastSync: "12 minutes ago" },
  { name: "Twilio", status: "connected", lastSync: "1 hour ago" },
  { name: "HubSpot", status: "not_connected", lastSync: null },
  { name: "Zendesk", status: "not_connected", lastSync: null },
];

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    highRisk: true, renewals: true, daily: false, failedCalls: true,
  });

  const toggleNotif = (key: keyof typeof notifications) =>
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>

      {/* Integrations */}
      <div className="border-2 border-black dark:border-white bg-white dark:bg-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]">
        <div className="p-3 border-b-2 border-black dark:border-white bg-indigo-600">
          <h3 className="text-sm font-black uppercase tracking-wider text-white">Integrations</h3>
        </div>
        <div className="p-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((int) => (
            <div key={int.name} className="border-2 border-black dark:border-white p-4 bg-white dark:bg-gray-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-black dark:text-white">{int.name}</h3>
                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase border-2 border-black ${int.status === "connected"
                  ? 'bg-emerald-600 text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white text-gray-600 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]'
                  }`}>
                  {int.status === "connected" ? "✅ CONNECTED" : "NOT CONNECTED"}
                </span>
              </div>
              {int.lastSync && <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Last sync: {int.lastSync}</p>}
              <div className="flex gap-2">
                <button className="flex-1 px-3 py-1.5 text-xs font-bold uppercase border-2 border-black dark:border-white bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-black dark:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[1px] hover:translate-y-[1px]">
                  Configure
                </button>
                <button className={`flex-1 px-3 py-1.5 text-xs font-bold uppercase border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[1px] hover:translate-y-[1px] ${int.status === "connected" ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-black dark:text-white' : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200'}`}>
                  {int.status === "connected" ? "Disconnect" : "Connect"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="border-2 border-black dark:border-white bg-white dark:bg-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]">
        <div className="p-3 border-b-2 border-black dark:border-white bg-indigo-600">
          <h3 className="text-sm font-black uppercase tracking-wider text-white">Email Notifications</h3>
        </div>
        <div className="p-4 space-y-4">
          {([["highRisk", "High-risk account alerts"], ["renewals", "Renewal reminders (T-30/60/90)"], ["daily", "Daily digest"], ["failedCalls", "Failed voice calls"]] as const).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
              <Label className="text-sm font-medium text-black dark:text-white">{label}</Label>
              <Switch checked={notifications[key]} onCheckedChange={() => toggleNotif(key)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
