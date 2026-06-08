import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  Phone,
  MessageCircle,
  Key,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppSettings, useUpdateAppSettings, useSetupConfig, useUpdateSetupConfig } from "@/hooks/useSettings";
import { DEFAULT_LIFECYCLE_BUCKETS, type LifecycleBucketsConfig } from "@/lib/api/settings";

const integrations = [
  { name: "Google Sheets / Excel", status: "not_connected", lastSync: null, icon: "XL", color: "bg-emerald-500/10 text-emerald-600" },
  { name: "SQL DB / MongoDB", status: "not_connected", lastSync: null, icon: "DB", color: "bg-amber-500/10 text-amber-600" },
];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const toastHook = useToast();
  const toast = toastHook?.toast ?? (() => { });
  
  const { data: appSettings } = useAppSettings();
  const updateSettings = useUpdateAppSettings();

  const { data: setupConfig } = useSetupConfig();
  const updateSetupConfig = useUpdateSetupConfig();

  const [notifications, setNotifications] = useState({
    highRisk: true, renewals: true, daily: false, failedCalls: true, churnDiscount: false,
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
    churnDiscountPercentage: 20,
  });

  const [churnFrequency, setChurnFrequency] = useState(1);
  const [objectionFollowUpHours, setObjectionFollowUpHours] = useState(24);
  const [stopStandardCampaignsOnChurn, setStopStandardCampaignsOnChurn] = useState(true);
  const [stopWorkflowsOnCritical, setStopWorkflowsOnCritical] = useState(true);

  const [emailSettings, setEmailSettings] = useState({
    resendApiKey: "",
    fromEmail: "",
    fromName: "Renewal & Upsell Advisor",
  });


  const [twilioSettings, setTwilioSettings] = useState({
    accountSid: "",
    authToken: "",
    phoneNumber: "",
    whatsappNumber: "",
  });

  const [lifecycleBuckets, setLifecycleBuckets] = useState<LifecycleBucketsConfig>(DEFAULT_LIFECYCLE_BUCKETS);

  const [isDirty, setIsDirty] = useState(false);

  const toggleNotif = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    setIsDirty(true);
  };

  function updateMetric(key: keyof typeof metricDefaults, value: number) {
    setMetricDefaults((prev) => ({
      ...prev,
      [key]: isNaN(value) ? prev[key] : value,
    }));
    setIsDirty(true);
  }

  function updateLifecycleBucket<K extends keyof LifecycleBucketsConfig>(
    key: K,
    value: LifecycleBucketsConfig[K]
  ) {
    setLifecycleBuckets((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }

  // Hydrate metrics from backend.
  useEffect(() => {
    const metrics = appSettings?.metrics;
    if (metrics) {
      setMetricDefaults({
        churnRiskThreshold: metrics.churnRiskThreshold ?? 30,
        renewalTarget: metrics.renewalTarget ?? 90,
        upsellPipelineTarget: metrics.upsellPipelineTarget ?? 100000,
        renewalReminderAtCompletionPercent: metrics.renewalReminderAtCompletionPercent ?? 90,
        highRiskScoreThresholdPercent: metrics.highRiskScoreThresholdPercent ?? 70,
        churnProbabilityThresholdPercent: metrics.churnProbabilityThresholdPercent ?? 70,
        minUsagePercentForCall: metrics.minUsagePercentForCall ?? 20,
        healthScoreAtRiskBelowPercent: metrics.healthScoreAtRiskBelowPercent ?? 50,
        churnDiscountPercentage: metrics.churnDiscountPercentage ?? 20,
      });
    }

    const notifCfg = appSettings?.notifications;
    if (notifCfg) {
      setNotifications({
        highRisk: notifCfg.highRisk ?? true,
        renewals: notifCfg.renewals ?? true,
        daily: notifCfg.daily ?? false,
        failedCalls: notifCfg.failedCalls ?? true,
        churnDiscount: notifCfg.churnDiscount ?? false,
      });
    }

    setIsDirty(false);
  }, [appSettings]);

  useEffect(() => {
    if (appSettings?.lifecycle_buckets) {
      setLifecycleBuckets({
        ...DEFAULT_LIFECYCLE_BUCKETS,
        ...appSettings.lifecycle_buckets,
      });
    }
  }, [appSettings?.lifecycle_buckets]);

  // Hydrate schedule stats
  useEffect(() => {
    if (appSettings?.schedule) {
      setChurnFrequency(appSettings.schedule.churnCallFrequencyDays ?? 1);
      setObjectionFollowUpHours(appSettings.schedule.objectionFollowUpHours ?? 24);
      setStopStandardCampaignsOnChurn(appSettings.schedule.stopStandardCampaignsOnChurn ?? true);
      setStopWorkflowsOnCritical(appSettings.schedule.stopWorkflowsOnCritical ?? true);
    }
  }, [appSettings?.schedule]);

  // Hydrate setup config from new backend endpoint
  useEffect(() => {
    if (setupConfig) {
      setEmailSettings({
        resendApiKey: setupConfig.resend_api_key ?? "",
        fromEmail: setupConfig.from_email ?? "",
        fromName: setupConfig.from_name ?? "Renewal & Upsell Advisor",
      });

      setTwilioSettings({
        accountSid: setupConfig.twilio_account_sid ?? "",
        authToken: setupConfig.twilio_auth_token ?? "",
        phoneNumber: setupConfig.twilio_phone_number ?? "",
        whatsappNumber: setupConfig.twilio_whatsapp_number ?? "",
      });
    }
  }, [setupConfig]);

  const handleSaveSettings = async () => {
    try {
      // 1. Save general app settings (metrics / schedule / notifications)
      await updateSettings.mutateAsync({
        ...(appSettings ?? {}),
        schedule: {
          callWindowStart: appSettings?.schedule?.callWindowStart ?? "09:00",
          callWindowEnd: appSettings?.schedule?.callWindowEnd ?? "17:00",
          emailWindowStart: appSettings?.schedule?.emailWindowStart ?? "08:00",
          emailWindowEnd: appSettings?.schedule?.emailWindowEnd ?? "18:00",
          followUpDays: appSettings?.schedule?.followUpDays ?? 3,
          autoEmailScheduleTime: appSettings?.schedule?.autoEmailScheduleTime ?? "12:00",
          autoCallScheduleTime: appSettings?.schedule?.autoCallScheduleTime ?? "14:00",
          reminderDaysBeforeRenewal: appSettings?.schedule?.reminderDaysBeforeRenewal ?? 1,
          churnCallFrequencyDays: churnFrequency,
          objectionFollowUpHours: objectionFollowUpHours,
          stopStandardCampaignsOnChurn: stopStandardCampaignsOnChurn,
          stopWorkflowsOnCritical: stopWorkflowsOnCritical,
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
          churnDiscountPercentage: metricDefaults.churnDiscountPercentage,
          callMilestonePercents: appSettings?.metrics?.callMilestonePercents ?? [],
          emailMilestonePercents: appSettings?.metrics?.emailMilestonePercents ?? [],
        },
        notifications: {
          highRisk: notifications.highRisk,
          renewals: notifications.renewals,
          daily: notifications.daily,
          failedCalls: notifications.failedCalls,
          churnDiscount: notifications.churnDiscount,
        },
        lifecycle_buckets: lifecycleBuckets,
        pipeline_flow: appSettings?.pipeline_flow,
      });

      // 2. Save credentials to setup API (merging with existing setupConfig)
      await updateSetupConfig.mutateAsync({
        ...setupConfig,
        resend_api_key: emailSettings.resendApiKey || undefined,
        from_email: emailSettings.fromEmail || undefined,
        from_name: emailSettings.fromName || "Renewal & Upsell Advisor",

        twilio_account_sid: twilioSettings.accountSid || undefined,
        twilio_auth_token: twilioSettings.authToken || undefined,
        twilio_phone_number: twilioSettings.phoneNumber || undefined,
        twilio_whatsapp_number: twilioSettings.whatsappNumber || undefined,
        automation_paused: setupConfig?.automation_paused ?? false,
      });

      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ["lifecycle-dashboard"] });
      toast({
        title: "Settings saved",
        description: "Metric defaults, lifecycle bucket rules, and email settings have been updated.",
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
          {/* Left Col: Integrations + Email */}
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
                  ["failedCalls", "Failed Calls"],
                  ["churnDiscount", "Churn Win-Back Discounts"]
                ] as const).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between py-2.5 px-2 hover:bg-muted/40 rounded-lg transition-colors">
                    <div>
                      <Label className="text-sm font-medium text-foreground cursor-pointer">{label}</Label>
                      <p className="text-[11px] text-muted-foreground">Push & email</p>
                    </div>
                    <Switch
                      checked={notifications[key as keyof typeof notifications]}
                      onCheckedChange={() => {
                        toggleNotif(key as keyof typeof notifications);
                        setIsDirty(true);
                      }}
                      className="data-[state=checked]:bg-primary border-2 border-black"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Email / Resend settings */}
            <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="px-5 py-3.5 border-b-2 border-black flex items-center gap-2">
                <ShieldCheck size={15} className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Email & Resend</h3>
              </div>
              <div className="p-4 space-y-3 text-xs">
                <p className="text-[11px] text-muted-foreground">
                  Configure how emails are sent using Resend. The API key here overrides the server's environment.
                  Ensure you verify the From Email as a Single Sender in Resend first.
                </p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-foreground">Resend API Key</Label>
                    <input
                      type="password"
                      className="w-full px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background"
                      placeholder="re_xxxxxxxxxxxxxxxxxxxxxxx"
                      value={emailSettings.resendApiKey}
                      onChange={(e) => {
                        setEmailSettings((prev) => ({ ...prev, resendApiKey: e.target.value }));
                        setIsDirty(true);
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-foreground">From Email</Label>
                    <input
                      type="email"
                      className="w-full px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background"
                      placeholder="notifications@yourdomain.com"
                      value={emailSettings.fromEmail}
                      onChange={(e) => {
                        setEmailSettings((prev) => ({ ...prev, fromEmail: e.target.value }));
                        setIsDirty(true);
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-medium text-foreground">From Name</Label>
                    <input
                      type="text"
                      className="w-full px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background"
                      value={emailSettings.fromName}
                      onChange={(e) => {
                        setEmailSettings((prev) => ({ ...prev, fromName: e.target.value }));
                        setIsDirty(true);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Twilio Configuration */}
            <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="px-5 py-3.5 border-b-2 border-black flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone size={15} className="text-green-600" />
                  <h3 className="text-sm font-semibold text-foreground">Twilio — Voice &amp; WhatsApp</h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-700 rounded-full font-medium border border-green-300">Active</span>
              </div>
              <div className="p-4 space-y-3 text-xs">
                <p className="text-[11px] text-muted-foreground">
                  Update your Twilio credentials at any time. Changes take effect immediately on the next scheduled call or WhatsApp message.
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Key size={11} className="text-muted-foreground" />
                      <Label className="text-[11px] font-medium text-foreground">Account SID</Label>
                    </div>
                    <input
                      type="text"
                      className="w-full px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background font-mono"
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={twilioSettings.accountSid}
                      onChange={(e) => {
                        setTwilioSettings((prev) => ({ ...prev, accountSid: e.target.value }));
                        setIsDirty(true);
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Key size={11} className="text-muted-foreground" />
                      <Label className="text-[11px] font-medium text-foreground">Auth Token</Label>
                    </div>
                    <input
                      type="password"
                      className="w-full px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background"
                      placeholder="••••••••••••••••"
                      value={twilioSettings.authToken}
                      onChange={(e) => {
                        setTwilioSettings((prev) => ({ ...prev, authToken: e.target.value }));
                        setIsDirty(true);
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Phone size={11} className="text-muted-foreground" />
                        <Label className="text-[11px] font-medium text-foreground">Voice Phone Number</Label>
                      </div>
                      <input
                        type="tel"
                        className="w-full px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background font-mono"
                        placeholder="+1878XXXXXXX"
                        value={twilioSettings.phoneNumber}
                        onChange={(e) => {
                          setTwilioSettings((prev) => ({ ...prev, phoneNumber: e.target.value }));
                          setIsDirty(true);
                        }}
                      />
                      <p className="text-[10px] text-muted-foreground">Used for outbound AI voice calls.</p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <MessageCircle size={11} className="text-green-600" />
                        <Label className="text-[11px] font-medium text-foreground">WhatsApp Number</Label>
                      </div>
                      <input
                        type="tel"
                        className="w-full px-2 py-1.5 text-xs border-2 border-green-500 rounded-lg bg-background font-mono focus:outline-none focus:ring-1 focus:ring-green-400"
                        placeholder="+14155238886"
                        value={twilioSettings.whatsappNumber}
                        onChange={(e) => {
                          setTwilioSettings((prev) => ({ ...prev, whatsappNumber: e.target.value }));
                          setIsDirty(true);
                        }}
                      />
                      <p className="text-[10px] text-muted-foreground">Sandbox or production WhatsApp number (E.164 format).</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg">
                    <MessageCircle size={13} className="text-green-600 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-green-700 leading-relaxed">
                      <strong>How to get your WhatsApp number:</strong> Go to{" "}
                      <a href="https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn" target="_blank" rel="noreferrer" className="underline font-semibold">Twilio Console → Messaging → Try it out → Send a WhatsApp message</a>.
                      The sandbox number shown (e.g. <code className="bg-green-100 px-1 rounded font-mono">+14155238886</code>) is your WhatsApp number. Paste it below in E.164 format.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lifecycle bucket classification rules */}
            <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="px-5 py-3.5 border-b-2 border-black flex items-center gap-2">
                <ShieldCheck size={15} className="text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Lifecycle Bucket Rules</h3>
              </div>
              <div className="p-4 space-y-4 text-xs">
                <p className="text-[11px] text-muted-foreground">
                  Accounts are assigned to one bucket using these rules (first match wins). Changes apply
                  to the dashboard, pipeline, and NBA after save.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl border-2 border-red-200 bg-red-50/50 space-y-2">
                    <p className="text-[11px] font-bold text-red-800 uppercase">1 · Protect (P1)</p>
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-[11px]">Min risk score</Label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="w-16 px-2 py-1 text-xs border-2 border-black rounded-lg bg-background text-right"
                        value={lifecycleBuckets.protect_min_risk_score}
                        onChange={(e) =>
                          updateLifecycleBucket("protect_min_risk_score", Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-[11px]">Include status = at_risk</Label>
                      <Switch
                        checked={lifecycleBuckets.protect_include_at_risk_status}
                        onCheckedChange={(val) =>
                          updateLifecycleBucket("protect_include_at_risk_status", val)
                        }
                        className="data-[state=checked]:bg-primary border-2 border-black"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border-2 border-slate-300 bg-slate-50/50 space-y-2">
                    <p className="text-[11px] font-bold text-slate-800 uppercase">2 · Activate (P5)</p>
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-[11px]">Max days since contract start</Label>
                      <input
                        type="number"
                        min={1}
                        max={365}
                        className="w-16 px-2 py-1 text-xs border-2 border-black rounded-lg bg-background text-right"
                        value={lifecycleBuckets.activate_max_days_since_start}
                        onChange={(e) =>
                          updateLifecycleBucket("activate_max_days_since_start", Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-[11px]">Max utilization %</Label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="w-16 px-2 py-1 text-xs border-2 border-black rounded-lg bg-background text-right"
                        value={lifecycleBuckets.activate_max_utilization_percent}
                        onChange={(e) =>
                          updateLifecycleBucket("activate_max_utilization_percent", Number(e.target.value))
                        }
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border-2 border-blue-200 bg-blue-50/50 space-y-2">
                    <p className="text-[11px] font-bold text-blue-800 uppercase">3 · Renew (P2)</p>
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-[11px]">Renewal window min (days)</Label>
                      <input
                        type="number"
                        min={0}
                        max={730}
                        className="w-16 px-2 py-1 text-xs border-2 border-black rounded-lg bg-background text-right"
                        value={lifecycleBuckets.renew_window_min_days}
                        onChange={(e) =>
                          updateLifecycleBucket("renew_window_min_days", Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-[11px]">Renewal window max (days)</Label>
                      <input
                        type="number"
                        min={1}
                        max={730}
                        className="w-16 px-2 py-1 text-xs border-2 border-black rounded-lg bg-background text-right"
                        value={lifecycleBuckets.renew_window_max_days}
                        onChange={(e) =>
                          updateLifecycleBucket("renew_window_max_days", Number(e.target.value))
                        }
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border-2 border-emerald-200 bg-emerald-50/50 space-y-2">
                    <p className="text-[11px] font-bold text-emerald-800 uppercase">4 · Expand (P4)</p>
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-[11px]">Min health score</Label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="w-16 px-2 py-1 text-xs border-2 border-black rounded-lg bg-background text-right"
                        value={lifecycleBuckets.expand_min_health_score}
                        onChange={(e) =>
                          updateLifecycleBucket("expand_min_health_score", Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-[11px]">Min utilization %</Label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="w-16 px-2 py-1 text-xs border-2 border-black rounded-lg bg-background text-right"
                        value={lifecycleBuckets.expand_min_utilization_percent}
                        onChange={(e) =>
                          updateLifecycleBucket("expand_min_utilization_percent", Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-[11px]">Max risk score (exclusive)</Label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="w-16 px-2 py-1 text-xs border-2 border-black rounded-lg bg-background text-right"
                        value={lifecycleBuckets.expand_max_risk_score}
                        onChange={(e) =>
                          updateLifecycleBucket("expand_max_risk_score", Number(e.target.value))
                        }
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border-2 border-amber-200 bg-amber-50/50 space-y-2 md:col-span-2">
                    <p className="text-[11px] font-bold text-amber-900 uppercase">5 · Adopt (P3) — default fallback</p>
                    <div className="flex items-center justify-between gap-2 max-w-md">
                      <Label className="text-[11px]">Max utilization % (below this → Adopt)</Label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="w-16 px-2 py-1 text-xs border-2 border-black rounded-lg bg-background text-right"
                        value={lifecycleBuckets.adopt_max_utilization_percent}
                        onChange={(e) =>
                          updateLifecycleBucket("adopt_max_utilization_percent", Number(e.target.value))
                        }
                      />
                    </div>
                  </div>
                </div>
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
                        Churn Win-Back Frequency (Days)
                      </Label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        className="w-full px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background"
                        value={churnFrequency}
                        onChange={(e) => {
                          setChurnFrequency(Number(e.target.value));
                          setIsDirty(true);
                        }}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        How often to trigger calls for accounts marked as churned waiting for win-back.
                      </p>
                    </div>
                    <div className="space-y-1.5 border-t-2 border-black/20 pt-3">
                      <Label className="text-[11px] font-medium text-foreground">
                        Objection Follow-up (Hours)
                      </Label>
                      <input
                        type="number"
                        min={1}
                        max={720}
                        className="w-full px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background"
                        value={objectionFollowUpHours}
                        onChange={(e) => {
                          setObjectionFollowUpHours(Number(e.target.value));
                          setIsDirty(true);
                        }}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        How many hours to wait before calling again when user gives an objection (e.g., no budget).
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-4 p-3 bg-muted/30 border-2 border-black rounded-xl">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold text-foreground uppercase tracking-tight">Stop Churned Account Automation</Label>
                        <p className="text-[10px] text-muted-foreground">Stop routine check-ins and calls when account status is 'churned'.</p>
                      </div>
                      <Switch
                        checked={stopStandardCampaignsOnChurn}
                        onCheckedChange={(val) => {
                          setStopStandardCampaignsOnChurn(val);
                          setIsDirty(true);
                        }}
                        className="data-[state=checked]:bg-primary border-2 border-black"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4 p-3 bg-muted/30 border-2 border-black rounded-xl">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-bold text-foreground uppercase tracking-tight">Stop Critical Account Automation</Label>
                        <p className="text-[10px] text-muted-foreground">Pause automated rescue flows for accounts in Critical stage.</p>
                      </div>
                      <Switch
                        checked={stopWorkflowsOnCritical}
                        onCheckedChange={(val) => {
                          setStopWorkflowsOnCritical(val);
                          setIsDirty(true);
                        }}
                        className="data-[state=checked]:bg-destructive border-2 border-black"
                      />
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
                        <Label className="text-[11px] font-medium text-foreground">Churn Win-Back Discount (%)</Label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="w-16 shrink-0 px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background text-right focus:ring-0 focus:border-primary transition-colors"
                          value={metricDefaults.churnDiscountPercentage}
                          onChange={(e) => updateMetric("churnDiscountPercentage", Number(e.target.value))}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground -mt-2">Discount given in automated churn win-back emails.</p>
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
