import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Database,
  Bell,
  Save,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  Plus,
  SlidersHorizontal,
  Kanban,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppSettings, useUpdateAppSettings } from "@/hooks/useSettings";

const integrations = [
  { name: "Google Sheets / Excel", status: "not_connected", lastSync: null, icon: "XL", color: "bg-emerald-500/10 text-emerald-600" },
  { name: "SQL DB / MongoDB", status: "not_connected", lastSync: null, icon: "DB", color: "bg-amber-500/10 text-amber-600" },
];

export default function SettingsPage() {
  const toastHook = useToast();
  const toast = toastHook?.toast ?? (() => { });
  const { data: appSettings } = useAppSettings();
  const updateSettings = useUpdateAppSettings();

  const [notifications, setNotifications] = useState({
    highRisk: true, renewals: true, daily: false, failedCalls: true,
  });

  const [metricDefaults, setMetricDefaults] = useState({
    churnRiskThreshold: 30,
    renewalTarget: 90,
    upsellPipelineTarget: 100000,
    renewalReminderAtCompletionPercent: 90,
    highRiskScoreThresholdPercent: 70,
    churnProbabilityThresholdPercent: 70,
    minUsagePercentForCall: 20,
    healthScoreAtRiskBelowPercent: 50,
  });

  const [isDirty, setIsDirty] = useState(false);

  const toggleNotif = (key: keyof typeof notifications) =>
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));

  function updateMetric(key: keyof typeof metricDefaults, value: number) {
    setMetricDefaults((prev) => ({
      ...prev,
      [key]: isNaN(value) ? prev[key] : value,
    }));
    setIsDirty(true);
  }



  // Hydrate metrics from backend. Only pipeline schedules run; no global call/email schedule in use.
  useEffect(() => {
    const metrics = appSettings?.metrics;
    if (!metrics) return;
    setMetricDefaults({
      churnRiskThreshold: metrics.churnRiskThreshold ?? 30,
      renewalTarget: metrics.renewalTarget ?? 90,
      upsellPipelineTarget: metrics.upsellPipelineTarget ?? 100000,
      renewalReminderAtCompletionPercent: metrics.renewalReminderAtCompletionPercent ?? 90,
      highRiskScoreThresholdPercent: metrics.highRiskScoreThresholdPercent ?? 70,
      churnProbabilityThresholdPercent: metrics.churnProbabilityThresholdPercent ?? 70,
      minUsagePercentForCall: metrics.minUsagePercentForCall ?? 20,
      healthScoreAtRiskBelowPercent: metrics.healthScoreAtRiskBelowPercent ?? 50,
    });
    setIsDirty(false);
  }, [appSettings]);

  const handleSaveSettings = async () => {
    try {
      // Only pipeline schedules run; send default schedule for API compatibility, save only metrics.
      await updateSettings.mutateAsync({
        schedule: {
          callWindowStart: "09:00",
          callWindowEnd: "17:00",
          emailWindowStart: "08:00",
          emailWindowEnd: "18:00",
          followUpDays: 3,
          autoEmailScheduleTime: "12:00",
          autoCallScheduleTime: "14:00",
          reminderDaysBeforeRenewal: 1,
        },
        metrics: {
          churnRiskThreshold: metricDefaults.churnRiskThreshold,
          renewalTarget: metricDefaults.renewalTarget,
          upsellPipelineTarget: metricDefaults.upsellPipelineTarget,
          renewalReminderAtCompletionPercent: metricDefaults.renewalReminderAtCompletionPercent,
          highRiskScoreThresholdPercent: metricDefaults.highRiskScoreThresholdPercent,
          churnProbabilityThresholdPercent: metricDefaults.churnProbabilityThresholdPercent,
          minUsagePercentForCall: metricDefaults.minUsagePercentForCall,
          healthScoreAtRiskBelowPercent: metricDefaults.healthScoreAtRiskBelowPercent,
        },
      });
      setIsDirty(false);
      toast({
        title: "Settings saved",
        description: "Metric defaults have been updated.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to save settings",
        description: error?.message || "Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b-2 border-black px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Settings</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage integrations, notifications and guardrail metrics. Only pipeline schedules run (set in Renewal Pipeline flows).
            </p>
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={updateSettings.isPending || !isDirty}
            className="h-9 px-3 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all flex items-center gap-1.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
          >
            {updateSettings.isPending ? (
              <>
                <Save size={13} /> Saving…
              </>
            ) : (
              <>
                <Save size={13} /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      <div className="p-6 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Col: Integrations */}
          <div className="lg:col-span-8 space-y-5">
            <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="px-5 py-3.5 border-b-2 border-black flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database size={15} className="text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Data Integrations</h3>
                </div>
                <span className="text-[11px] px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full font-medium border-2 border-black">Stable</span>
              </div>
              <div className="p-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {integrations.map((int) => (
                  <div key={int.name} className="p-4 border-2 border-black bg-background rounded-xl hover:bg-muted/20 transition-all group min-h-[120px] flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg border-2 border-black flex items-center justify-center font-bold text-xs shrink-0 ${int.color}`}>
                          {int.icon}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-medium text-foreground truncate">{int.name}</h4>
                          {int.lastSync && (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <RefreshCw size={8} /> {int.lastSync}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border-2 border-black shrink-0 ${int.status === 'connected' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                        {int.status === 'connected' ? 'Active' : 'Offline'}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <button className="flex-1 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted border-2 border-black rounded-lg hover:bg-muted/80 transition-all">
                        Settings
                      </button>
                      <button className={`flex-1 px-3 py-1.5 text-xs font-medium border-2 border-black rounded-lg transition-all ${int.status === 'connected' ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
                        {int.status === 'connected' ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>
                  </div>
                ))}
                <button className="border-2 border-dashed border-black p-4 rounded-xl flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all sm:col-span-2">
                  <div className="w-8 h-8 rounded-lg bg-muted border-2 border-black flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
                    <Plus size={16} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground group-hover:text-primary transition-colors">Add Integration</p>
                </button>
              </div>
            </div>

            {/* Notifications - in left column to fill empty space */}
            <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="px-5 py-3.5 border-b-2 border-black flex items-center gap-2">
                <Bell size={15} className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
              </div>
              <div className="p-4 space-y-0.5">
                {([
                  ["highRisk", "High Risk Accounts"],
                  ["renewals", "Renewal Reminders"],
                  ["daily", "Daily Digest"],
                  ["failedCalls", "Failed Calls"]
                ] as const).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between py-2.5 px-2 hover:bg-muted/40 rounded-lg transition-colors">
                    <div>
                      <Label className="text-sm font-medium text-foreground cursor-pointer">{label}</Label>
                      <p className="text-[11px] text-muted-foreground">Push & email</p>
                    </div>
                    <Switch
                      checked={notifications[key]}
                      onCheckedChange={() => toggleNotif(key)}
                      className="data-[state=checked]:bg-primary border-2 border-black"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Col */}
          <div className="lg:col-span-4 space-y-5">
            {/* Default Metrics (Auto + Customizable) */}
            <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="px-5 py-3.5 border-b-2 border-black flex items-center gap-2">
                <SlidersHorizontal size={15} className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Default Metrics Guardrails</h3>
              </div>
              <div className="p-4 space-y-4 text-xs">
                <p className="text-[11px] text-muted-foreground">
                  We start you with auto-fixed metric defaults tuned for most revenue teams.
                  You can override these thresholds at any time to fit your motion.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-medium text-foreground">
                        Churn Prediction Threshold (%)
                      </Label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="w-full px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background"
                        value={metricDefaults.churnRiskThreshold}
                        onChange={(e) => updateMetric("churnRiskThreshold", Number(e.target.value))}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Accounts above this risk level are treated as high-risk in dashboards and alerts.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-medium text-foreground">
                        Target Renewal Rate (%)
                      </Label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="w-full px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background"
                        value={metricDefaults.renewalTarget}
                        onChange={(e) => updateMetric("renewalTarget", Number(e.target.value))}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Used as the default success target for renewal performance.
                      </p>
                    </div>
                    <div className="space-y-1.5 border-t-2 border-black/20 pt-3">
                      <Label className="text-[11px] font-medium text-foreground">
                        Upsell Pipeline Target
                      </Label>
                      <input
                        type="number"
                        min={0}
                        className="w-full px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background"
                        value={metricDefaults.upsellPipelineTarget}
                        onChange={(e) => updateMetric("upsellPipelineTarget", Number(e.target.value))}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Initial upsell revenue goal used in dashboards until you customize it.
                      </p>
                    </div>
                  </div>

                  <div className="border-t-2 border-black/20 md:border-t-0 md:border-l-2 md:border-l-black/20 md:pl-6 pt-3 md:pt-0 space-y-3">
                    <p className="text-[11px] font-medium text-foreground">Percentage-wise thresholds</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <Label className="text-[11px] font-medium text-foreground">Renewal reminder at completion (%)</Label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="w-16 shrink-0 px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background text-right"
                          value={metricDefaults.renewalReminderAtCompletionPercent}
                          onChange={(e) => updateMetric("renewalReminderAtCompletionPercent", Number(e.target.value))}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground -mt-2">Send renewal reminder when plan is ≥ this % complete.</p>
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <Label className="text-[11px] font-medium text-foreground">High-risk score threshold (%)</Label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="w-16 shrink-0 px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background text-right"
                          value={metricDefaults.highRiskScoreThresholdPercent}
                          onChange={(e) => updateMetric("highRiskScoreThresholdPercent", Number(e.target.value))}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground -mt-2">Risk score ≥ this % is treated as high-risk.</p>
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <Label className="text-[11px] font-medium text-foreground">Churn probability threshold (%)</Label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="w-16 shrink-0 px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background text-right"
                          value={metricDefaults.churnProbabilityThresholdPercent}
                          onChange={(e) => updateMetric("churnProbabilityThresholdPercent", Number(e.target.value))}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground -mt-2">Churn probability ≥ this % triggers churn prevention (e.g. 70 = 0.70).</p>
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <Label className="text-[11px] font-medium text-foreground">Min usage % for call</Label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="w-16 shrink-0 px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background text-right"
                          value={metricDefaults.minUsagePercentForCall}
                          onChange={(e) => updateMetric("minUsagePercentForCall", Number(e.target.value))}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground -mt-2">First call only when plan completion ≥ this %.</p>
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <Label className="text-[11px] font-medium text-foreground">Health score at-risk below (%)</Label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="w-16 shrink-0 px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background text-right"
                          value={metricDefaults.healthScoreAtRiskBelowPercent}
                          onChange={(e) => updateMetric("healthScoreAtRiskBelowPercent", Number(e.target.value))}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground -mt-2">Health score below this % is treated as at-risk.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-card rounded-xl border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg border-2 border-black flex items-center justify-center">
                  <ShieldCheck size={16} className="text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Security</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                All data is encrypted with AES-256-GCM. Sessions managed via zero-trust architecture.
              </p>
              <button className="w-full py-2 bg-muted text-foreground rounded-lg text-xs font-medium hover:bg-muted/80 transition-all flex items-center justify-center gap-1.5 group border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                Audit Access Logs
                <ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
