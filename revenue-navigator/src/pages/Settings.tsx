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
  Clock,
  Mail,
  Phone,
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
  const toast = toastHook?.toast ?? (() => {});
  const { data: appSettings } = useAppSettings();
  const updateSettings = useUpdateAppSettings();

  const [notifications, setNotifications] = useState({
    highRisk: true, renewals: true, daily: false, failedCalls: true,
  });

  const [scheduleSettings, setScheduleSettings] = useState({
    callWindowStart: "09:00",
    callWindowEnd: "17:00",
    emailWindowStart: "08:00",
    emailWindowEnd: "18:00",
    followUpDays: 3,
    autoEmailScheduleTime: "12:00",
    autoCallScheduleTime: "14:00",
    reminderDaysBeforeRenewal: 1,
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
    callMilestonePercents: [30, 60, 90, 95] as number[],
    emailMilestonePercents: [30, 60, 90, 95] as number[],
  });

  const [isDirty, setIsDirty] = useState(false);

  const toggleNotif = (key: keyof typeof notifications) =>
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));

  function updateSchedule(
    key: keyof typeof scheduleSettings,
    value: string | number,
  ) {
    setScheduleSettings((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }

  function updateMetric(key: keyof typeof metricDefaults, value: number | number[]) {
    setMetricDefaults((prev) => {
      const next = { ...prev };
      if (Array.isArray(value)) {
        (next as Record<string, number[]>)[key as string] = value;
      } else {
        (next as Record<string, number>)[key as string] = isNaN(value) ? (prev[key] as number) : value;
      }
      return next;
    });
    setIsDirty(true);
  }

  /** Parse "30, 60, 90, 95" to [30, 60, 90, 95] (0-100 only). */
  function parseMilestonePercents(s: string): number[] {
    return s
      .split(",")
      .map((n) => parseInt(n.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 0 && n <= 100)
      .sort((a, b) => a - b);
  }

  // Hydrate local editable state from backend settings when available
  useEffect(() => {
    const schedule = appSettings?.schedule;
    const metrics = appSettings?.metrics;
    if (!schedule || !metrics) return;
    setScheduleSettings({
      callWindowStart: schedule.callWindowStart ?? "09:00",
      callWindowEnd: schedule.callWindowEnd ?? "17:00",
      emailWindowStart: schedule.emailWindowStart ?? "08:00",
      emailWindowEnd: schedule.emailWindowEnd ?? "18:00",
      followUpDays: schedule.followUpDays ?? 3,
      autoEmailScheduleTime: schedule.autoEmailScheduleTime ?? "12:00",
      autoCallScheduleTime: schedule.autoCallScheduleTime ?? "14:00",
      reminderDaysBeforeRenewal: schedule.reminderDaysBeforeRenewal ?? 1,
    });
    setMetricDefaults({
      churnRiskThreshold: metrics.churnRiskThreshold ?? 30,
      renewalTarget: metrics.renewalTarget ?? 90,
      upsellPipelineTarget: metrics.upsellPipelineTarget ?? 100000,
      renewalReminderAtCompletionPercent: metrics.renewalReminderAtCompletionPercent ?? 90,
      highRiskScoreThresholdPercent: metrics.highRiskScoreThresholdPercent ?? 70,
      churnProbabilityThresholdPercent: metrics.churnProbabilityThresholdPercent ?? 70,
      minUsagePercentForCall: metrics.minUsagePercentForCall ?? 20,
      healthScoreAtRiskBelowPercent: metrics.healthScoreAtRiskBelowPercent ?? 50,
      callMilestonePercents: Array.isArray(metrics.callMilestonePercents) && metrics.callMilestonePercents.length
        ? metrics.callMilestonePercents
        : [30, 60, 90, 95],
      emailMilestonePercents: Array.isArray(metrics.emailMilestonePercents) && metrics.emailMilestonePercents.length
        ? metrics.emailMilestonePercents
        : [30, 60, 90, 95],
    });
    setIsDirty(false);
  }, [appSettings]);

  const handleSaveSettings = async () => {
    try {
      await updateSettings.mutateAsync({
        schedule: {
          callWindowStart: scheduleSettings.callWindowStart,
          callWindowEnd: scheduleSettings.callWindowEnd,
          emailWindowStart: scheduleSettings.emailWindowStart,
          emailWindowEnd: scheduleSettings.emailWindowEnd,
          followUpDays: scheduleSettings.followUpDays,
          autoEmailScheduleTime: scheduleSettings.autoEmailScheduleTime,
          autoCallScheduleTime: scheduleSettings.autoCallScheduleTime,
          reminderDaysBeforeRenewal: scheduleSettings.reminderDaysBeforeRenewal,
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
          callMilestonePercents: metricDefaults.callMilestonePercents,
          emailMilestonePercents: metricDefaults.emailMilestonePercents,
        },
      });
      setIsDirty(false);
      toast({
        title: "Settings saved",
        description: "Scheduling and metric defaults have been updated.",
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
              Manage integrations, notifications, engagement scheduling and guardrail metrics
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

            {/* Call & Email Scheduling - left side */}
            <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="px-5 py-3.5 border-b-2 border-black flex items-center gap-2">
                <Clock size={15} className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Call & Email Scheduling</h3>
              </div>
              <div className="p-4 space-y-4 text-xs">
                <p className="text-[11px] text-muted-foreground">
                  Start with our recommended outreach windows, then tailor when calls and emails
                  should be scheduled for your team.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                      <Phone className="w-3 h-3" />
                      Preferred Call Window (Start)
                    </Label>
                    <input
                      type="time"
                      className="w-full px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background"
                      value={scheduleSettings.callWindowStart}
                      onChange={(e) => updateSchedule("callWindowStart", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-foreground">
                      Preferred Call Window (End)
                    </Label>
                    <input
                      type="time"
                      className="w-full px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background"
                      value={scheduleSettings.callWindowEnd}
                      onChange={(e) => updateSchedule("callWindowEnd", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-foreground flex items-center gap-1.5">
                      <Mail className="w-3 h-3" />
                      Email Window (Start)
                    </Label>
                    <input
                      type="time"
                      className="w-full px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background"
                      value={scheduleSettings.emailWindowStart}
                      onChange={(e) => updateSchedule("emailWindowStart", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-foreground">
                      Email Window (End)
                    </Label>
                    <input
                      type="time"
                      className="w-full px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background"
                      value={scheduleSettings.emailWindowEnd}
                      onChange={(e) => updateSchedule("emailWindowEnd", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium text-foreground">
                    Default Follow-up Offset (days)
                  </Label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    className="w-full px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background"
                    value={scheduleSettings.followUpDays}
                    onChange={(e) =>
                      updateSchedule("followUpDays", Number(e.target.value) || scheduleSettings.followUpDays)
                    }
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Controls when calls or emails are automatically queued after a touchpoint.
                  </p>
                </div>

                <div className="border-t-2 border-black/20 pt-3 space-y-3">
                  <p className="text-[11px] font-medium text-foreground">Auto run schedule (daily)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-medium text-foreground">
                        Auto email run time
                      </Label>
                      <input
                        type="time"
                        className="w-full px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background"
                        value={scheduleSettings.autoEmailScheduleTime}
                        onChange={(e) => updateSchedule("autoEmailScheduleTime", e.target.value)}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        When the daily email campaign runs automatically.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-medium text-foreground">
                        Auto call run time
                      </Label>
                      <input
                        type="time"
                        className="w-full px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background"
                        value={scheduleSettings.autoCallScheduleTime}
                        onChange={(e) => updateSchedule("autoCallScheduleTime", e.target.value)}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        When the daily call processing runs automatically.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t-2 border-black/20 pt-3 space-y-1.5">
                  <Label className="text-[11px] font-medium text-foreground">
                    Reminder days before renewal
                  </Label>
                  <input
                    type="number"
                    min={0}
                    max={365}
                    className="w-full max-w-[100px] px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background"
                    value={scheduleSettings.reminderDaysBeforeRenewal}
                    onChange={(e) =>
                      updateSchedule("reminderDaysBeforeRenewal", Math.max(0, parseInt(e.target.value, 10) || 0))
                    }
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Trigger call/email when this many days before renewal (e.g. 1 = 1 day before).
                  </p>
                </div>
              </div>
            </div>

            {/* Renewal Pipeline Scheduler */}
            <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="px-5 py-3.5 border-b-2 border-black flex items-center gap-2">
                <Kanban size={15} className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Renewal Pipeline Scheduler</h3>
              </div>
              <div className="p-4 space-y-3 text-xs">
                <p className="text-[11px] text-muted-foreground">
                  These values define the Renewal Pipeline columns and when auto calls and emails run. The pipeline page shows stages based on the first two milestones (e.g. 0–30%, 30–60%, 60%+). Add any plan completion % values you want (comma-separated, 0–100).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-foreground">Call milestones (%)</Label>
                    <input
                      type="text"
                      placeholder="e.g. 30, 60, 90, 95 or 20, 50, 80, 100"
                      className="w-full px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background"
                      value={metricDefaults.callMilestonePercents.join(", ")}
                      onChange={(e) => {
                        const parsed = parseMilestonePercents(e.target.value);
                        if (parsed.length) updateMetric("callMilestonePercents", parsed);
                      }}
                      onBlur={(e) => {
                        const parsed = parseMilestonePercents(e.target.value);
                        updateMetric("callMilestonePercents", parsed.length ? parsed : [30, 60, 90, 95]);
                      }}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Triggers at these plan % values plus reminder day(s) before renewal.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-foreground">Email milestones (%)</Label>
                    <input
                      type="text"
                      placeholder="e.g. 30, 60, 90, 95 or 20, 50, 80, 100"
                      className="w-full px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background"
                      value={metricDefaults.emailMilestonePercents.join(", ")}
                      onChange={(e) => {
                        const parsed = parseMilestonePercents(e.target.value);
                        if (parsed.length) updateMetric("emailMilestonePercents", parsed);
                      }}
                      onBlur={(e) => {
                        const parsed = parseMilestonePercents(e.target.value);
                        updateMetric("emailMilestonePercents", parsed.length ? parsed : [30, 60, 90, 95]);
                      }}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Sends at these plan % values plus reminder day(s) before renewal.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Col */}
          <div className="lg:col-span-4 space-y-5">
            {/* Notifications */}
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

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-foreground">
                      Churn Risk Threshold (%)
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

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-foreground">
                      Upsell Pipeline Target (ARR)
                    </Label>
                    <input
                      type="number"
                      min={0}
                      className="w-full px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background"
                      value={metricDefaults.upsellPipelineTarget}
                      onChange={(e) => updateMetric("upsellPipelineTarget", Number(e.target.value))}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Initial upsell ARR goal used in dashboards until you customize it.
                    </p>
                  </div>

                  <div className="border-t-2 border-black/20 pt-3 space-y-3">
                    <p className="text-[11px] font-medium text-foreground">Percentage-wise thresholds</p>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <Label className="text-[11px] font-medium text-foreground shrink-0">Renewal reminder at completion (%)</Label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            className="w-16 shrink-0 px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background text-right"
                            value={metricDefaults.renewalReminderAtCompletionPercent}
                            onChange={(e) => updateMetric("renewalReminderAtCompletionPercent", Number(e.target.value))}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Send renewal reminder when plan is ≥ this % complete.</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <Label className="text-[11px] font-medium text-foreground shrink-0">High-risk score threshold (%)</Label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            className="w-16 shrink-0 px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background text-right"
                            value={metricDefaults.highRiskScoreThresholdPercent}
                            onChange={(e) => updateMetric("highRiskScoreThresholdPercent", Number(e.target.value))}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Risk score ≥ this % is treated as high-risk.</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <Label className="text-[11px] font-medium text-foreground shrink-0">Churn probability threshold (%)</Label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            className="w-16 shrink-0 px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background text-right"
                            value={metricDefaults.churnProbabilityThresholdPercent}
                            onChange={(e) => updateMetric("churnProbabilityThresholdPercent", Number(e.target.value))}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Churn probability ≥ this % triggers churn prevention (e.g. 70 = 0.70).</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <Label className="text-[11px] font-medium text-foreground shrink-0">Min usage % for call</Label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            className="w-16 shrink-0 px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background text-right"
                            value={metricDefaults.minUsagePercentForCall}
                            onChange={(e) => updateMetric("minUsagePercentForCall", Number(e.target.value))}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">First call only when plan completion ≥ this %.</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <Label className="text-[11px] font-medium text-foreground shrink-0">Health score at-risk below (%)</Label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            className="w-16 shrink-0 px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background text-right"
                            value={metricDefaults.healthScoreAtRiskBelowPercent}
                            onChange={(e) => updateMetric("healthScoreAtRiskBelowPercent", Number(e.target.value))}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Health score below this % is treated as at-risk.</p>
                      </div>
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
