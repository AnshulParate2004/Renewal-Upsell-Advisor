import { useState, useMemo, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Cpu, Mail, Send, Sparkles, Phone, RefreshCw } from "lucide-react";
import { triggerMlPipeline } from "@/lib/api/ml";
import { emailApi } from "@/lib/api/email";
import { voiceApi } from "@/lib/api/voice";
import { campaignsApi, AutoCampaign, type CampaignFilterConfig } from "@/lib/api/campaigns";
import { useAccounts } from "@/hooks/useAccounts";
import { getRenewalInDays, getRenewalStageFromPlan } from "@/data/mockData";

type EmailMode = "all" | "single";
type VoiceMode = "all" | "single";
type CampaignMode = "manual" | "auto";
type Recurrence = "daily" | "weekly" | "month";

type RangeKey = "risk" | "healthScore" | "arr" | "renewal" | "utilization" | "relationshipScore" | "churn";
const defaultRange = () => ({ min: "", max: "" });

export default function ManualTriggersPage() {
  const [campaignMode, setCampaignMode] = useState<CampaignMode>("manual");
  const [recurrence, setRecurrence] = useState<Recurrence>("weekly");
  const [campaignName, setCampaignName] = useState("");
  const [campaignDescription, setCampaignDescription] = useState("");
  const [campaignStartDate, setCampaignStartDate] = useState("");
  const [campaignEndDate, setCampaignEndDate] = useState("");
  const [campaignStartTime, setCampaignStartTime] = useState("");
  const [campaignEndTime, setCampaignEndTime] = useState("");
  const [campaignFollowUpOffsetDays, setCampaignFollowUpOffsetDays] = useState(3);
  const [rangeFilters, setRangeFilters] = useState<Record<RangeKey, { min: string; max: string }>>({
    risk: defaultRange(),
    healthScore: defaultRange(),
    arr: defaultRange(),
    renewal: defaultRange(),
    utilization: defaultRange(),
    relationshipScore: defaultRange(),
    churn: defaultRange(),
  });
  const [locationKeyword, setLocationKeyword] = useState("");
  const [partnerNameKeyword, setPartnerNameKeyword] = useState("");
  const [pipelineStage, setPipelineStage] = useState<string>("");
  const [actionType, setActionType] = useState("email_sequence");

  const [campaignsList, setCampaignsList] = useState<AutoCampaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignSaving, setCampaignSaving] = useState(false);

  const [mlLoading, setMlLoading] = useState(false);
  const [mlMessage, setMlMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [emailMode, setEmailMode] = useState<EmailMode>("single");
  const [accountSearch, setAccountSearch] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<{ id: string; name: string } | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  /** Purpose for the message (e.g. "review follow-up", "renewal reminder"). Used when generating so the message matches this intent. */
  const [emailPurpose, setEmailPurpose] = useState("");
  /** When user clicks Auto-generate, we store the formatted HTML so Send uses it (gradient header, green block, button). Cleared when user edits the body. */
  const [lastPreviewHtml, setLastPreviewHtml] = useState<string | null>(null);
  const [allEmailLoading, setAllEmailLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [voiceMode, setVoiceMode] = useState<VoiceMode>("single");
  const [voiceAccountSearch, setVoiceAccountSearch] = useState("");
  const [voiceSelectedAccount, setVoiceSelectedAccount] = useState<{ id: string; name: string } | null>(null);
  /** Purpose for the call (e.g. "review follow-up", "renewal discussion"). Used when triggering so the script matches this intent. */
  const [voicePurpose, setVoicePurpose] = useState("");
  const [voiceAllLoading, setVoiceAllLoading] = useState(false);
  const [voiceSingleLoading, setVoiceSingleLoading] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();

  /** Unique location strings from accounts (city, state, "city, state") for autocomplete. */
  const locationSuggestions = useMemo(() => {
    const set = new Set<string>();
    accounts.forEach((a) => {
      const city = (a.contactCity ?? "").trim();
      const state = (a.contactState ?? "").trim();
      if (city) set.add(city);
      if (state) set.add(state);
      if (city && state) set.add(`${city}, ${state}`);
    });
    const list = Array.from(set).filter(Boolean).sort();
    const kw = (locationKeyword ?? "").trim().toLowerCase();
    if (!kw) return list.slice(0, 12);
    return list.filter((s) => s.toLowerCase().includes(kw)).slice(0, 12);
  }, [accounts, locationKeyword]);

  /** Unique partner names from accounts (partnerName, csm) for autocomplete. */
  const partnerSuggestions = useMemo(() => {
    const set = new Set<string>();
    accounts.forEach((a) => {
      const p = (a.partnerName ?? a.csm ?? "").trim();
      if (p) set.add(p);
    });
    const list = Array.from(set).filter(Boolean).sort();
    const kw = (partnerNameKeyword ?? "").trim().toLowerCase();
    if (!kw) return list.slice(0, 12);
    return list.filter((s) => s.toLowerCase().includes(kw)).slice(0, 12);
  }, [accounts, partnerNameKeyword]);

  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [partnerDropdownOpen, setPartnerDropdownOpen] = useState(false);

  const accountSuggestions = useMemo(() => {
    if (!accountSearch.trim()) return accounts.slice(0, 8);
    const q = accountSearch.trim().toLowerCase();
    return accounts.filter(
      (a) => a.name.toLowerCase().includes(q) || (a.industry && a.industry.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [accounts, accountSearch]);
  const voiceAccountSuggestions = useMemo(() => {
    if (!voiceAccountSearch.trim()) return accounts.slice(0, 8);
    const q = voiceAccountSearch.trim().toLowerCase();
    return accounts.filter(
      (a) => a.name.toLowerCase().includes(q) || (a.industry && a.industry.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [accounts, voiceAccountSearch]);

  async function handleSendToAll() {
    setEmailMessage(null);
    setAllEmailLoading(true);
    try {
      await emailApi.triggerCampaign(emailPurpose?.trim() || undefined);
      setEmailMessage({ type: "success", text: "Email campaign triggered. Emails are being sent to eligible customers." });
    } catch (e) {
      setEmailMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to trigger campaign." });
    } finally {
      setAllEmailLoading(false);
    }
  }

  async function handleAutoGenerate() {
    if (!selectedAccount) return;
    setEmailMessage(null);
    setPreviewLoading(true);
    try {
      const preview = await emailApi.getPreview(selectedAccount.id, emailPurpose.trim() || undefined);
      setEmailSubject(preview.subject);
      setEmailBody(preview.text_body);
      setLastPreviewHtml(preview.html_body ?? null);
      setEmailMessage({ type: "success", text: `Preview generated for ${preview.account_name}. Edit if needed and click Send.` });
    } catch (e) {
      setEmailMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to generate preview." });
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleSendSingle() {
    if (!selectedAccount) return;
    setEmailMessage(null);
    setSendLoading(true);
    try {
      const hasCustom = emailSubject.trim() || emailBody.trim();
      const options = hasCustom
        ? {
          subject: emailSubject.trim() || "No subject",
          html_body: lastPreviewHtml ?? emailBody.replace(/\n/g, "<br/>"),
          text_body: emailBody,
        }
        : {
          purpose: emailPurpose.trim() || undefined,
        };
      await emailApi.sendToAccount(selectedAccount.id, options);
      setEmailMessage({ type: "success", text: `Email sent to ${selectedAccount.name}.` });
    } catch (e) {
      setEmailMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to send email." });
    } finally {
      setSendLoading(false);
    }
  }

  async function handleVoiceTriggerAll() {
    setVoiceMessage(null);
    setVoiceAllLoading(true);
    try {
      await voiceApi.triggerAll();
      setVoiceMessage({ type: "success", text: "Voice call processing started. Calls will be made to eligible accounts." });
    } catch (e) {
      setVoiceMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to trigger voice calls." });
    } finally {
      setVoiceAllLoading(false);
    }
  }

  async function handleVoiceTriggerSingle() {
    if (!voiceSelectedAccount) return;
    setVoiceMessage(null);
    setVoiceSingleLoading(true);
    try {
      await voiceApi.triggerToAccount(voiceSelectedAccount.id, voicePurpose.trim() || undefined);
      setVoiceMessage({ type: "success", text: `Voice call initiated to ${voiceSelectedAccount.name}.` });
    } catch (e) {
      setVoiceMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to trigger call." });
    } finally {
      setVoiceSingleLoading(false);
    }
  }

  const handleRunMlPipeline = async () => {
    setMlMessage(null);
    setMlLoading(true);
    try {
      const res = await triggerMlPipeline();
      setMlMessage({
        type: res.success ? "success" : "error",
        text: res.success
          ? `Updated ${res.accounts_updated} accounts, ${res.churn_inserted} churn, ${res.upsell_inserted} upsell.`
          : (res.errors?.[0]?.message || "Pipeline had errors."),
      });
    } catch (e) {
      setMlMessage({ type: "error", text: e instanceof Error ? e.message : "Failed to run ML pipeline." });
    } finally {
      setMlLoading(false);
    }
  };

  useEffect(() => {
    if (campaignMode === "auto") {
      loadCampaigns();
    }
  }, [campaignMode]);

  const loadCampaigns = async () => {
    setCampaignsLoading(true);
    try {
      const data = await campaignsApi.getCampaigns();
      setCampaignsList(data || []);
    } catch (e) { console.error(e); }
    finally { setCampaignsLoading(false); }
  }

  const buildFilterConfig = (): CampaignFilterConfig | undefined => {
    const hasRange = Object.values(rangeFilters).some((r) => r.min !== "" || r.max !== "");
    const hasKeyword = (locationKeyword || "").trim() !== "" || (partnerNameKeyword || "").trim() !== "";
    const hasPipeline = (pipelineStage || "").trim().toLowerCase() !== "";
    if (!hasRange && !hasKeyword && !hasPipeline) return undefined;
    const config: CampaignFilterConfig = {};
    (Object.keys(rangeFilters) as RangeKey[]).forEach((key) => {
      const r = rangeFilters[key];
      if (r.min !== "" || r.max !== "") {
        config[key] = {};
        if (r.min !== "") config[key]!.min = Number(r.min);
        if (r.max !== "") config[key]!.max = Number(r.max);
      }
    });
    if ((locationKeyword || "").trim()) config.locationKeyword = locationKeyword.trim();
    if ((partnerNameKeyword || "").trim()) config.partnerNameKeyword = partnerNameKeyword.trim();
    if (hasPipeline) config.pipelineStage = pipelineStage.trim().toLowerCase();
    return Object.keys(config).length ? config : undefined;
  };

  const matchingCount = useMemo(() => {
    const config = buildFilterConfig();
    if (!config || Object.keys(config).length === 0) return accounts.length;
    return accounts.filter((client) => {
      const risk = client.riskScore ?? 0;
      const healthScore = client.healthScore ?? 0;
      const arr = client.arr ?? 0;
      const renewal = getRenewalInDays(client.renewalDate, client.contractEnd, client.status) ?? 0;
      const u = Number(client.utilization ?? 0);
      const utilization = u <= 1 && u >= 0 ? u * 100 : u;
      const relationshipScore = client.relationshipScore ?? 0;
      const churnPct = (client.churnProbability ?? 0) * 100;
      if (config.risk) {
        if (config.risk.min != null && risk < config.risk.min) return false;
        if (config.risk.max != null && risk > config.risk.max) return false;
      }
      if (config.healthScore) {
        if (config.healthScore.min != null && healthScore < config.healthScore.min) return false;
        if (config.healthScore.max != null && healthScore > config.healthScore.max) return false;
      }
      if (config.arr) {
        if (config.arr.min != null && arr < config.arr.min) return false;
        if (config.arr.max != null && arr > config.arr.max) return false;
      }
      if (config.renewal) {
        if (config.renewal.min != null && renewal < config.renewal.min) return false;
        if (config.renewal.max != null && renewal > config.renewal.max) return false;
      }
      if (config.utilization) {
        if (config.utilization.min != null && utilization < config.utilization.min) return false;
        if (config.utilization.max != null && utilization > config.utilization.max) return false;
      }
      if (config.relationshipScore) {
        if (config.relationshipScore.min != null && relationshipScore < config.relationshipScore.min) return false;
        if (config.relationshipScore.max != null && relationshipScore > config.relationshipScore.max) return false;
      }
      if (config.churn) {
        if (config.churn.min != null && churnPct < config.churn.min) return false;
        if (config.churn.max != null && churnPct > config.churn.max) return false;
      }
      const locKw = (config.locationKeyword ?? "").toLowerCase();
      if (locKw) {
        const city = (client.contactCity ?? "").toLowerCase();
        const state = (client.contactState ?? "").toLowerCase();
        if (!`${city} ${state}`.trim().includes(locKw)) return false;
      }
      const partnerKw = (config.partnerNameKeyword ?? "").toLowerCase();
      if (partnerKw) {
        const partner = ((client.partnerName ?? client.csm) ?? "").toLowerCase();
        if (!partner.includes(partnerKw)) return false;
      }
      const stage = (config.pipelineStage ?? "").toLowerCase();
      if (stage) {
        if (stage === "renewed") {
          const s = (client.status ?? "").toString().trim().toLowerCase();
          const r = (client.renewalStage ?? "").toString().trim().toLowerCase();
          if (s !== "renewed" && s !== "renewal" && r !== "renewed") return false;
        } else {
          const accountStage = getRenewalStageFromPlan(client.contractStart, client.renewalDate, client.status, undefined, client.contractEnd, client.renewalStage);
          if (accountStage !== stage) return false;
        }
      }
      return true;
    }).length;
  }, [accounts, rangeFilters, locationKeyword, partnerNameKeyword, pipelineStage]);

  const canSaveCampaign =
    campaignName.trim() !== "" &&
    campaignDescription.trim() !== "" &&
    campaignStartDate.trim() !== "" &&
    campaignEndDate.trim() !== "" &&
    (actionType === "email_sequence" || actionType === "voice_bot");

  const handleSaveCampaign = async () => {
    if (!canSaveCampaign) return;
    setCampaignSaving(true);
    try {
      const filterConfig = buildFilterConfig();
      await campaignsApi.createCampaign({
        name: campaignName.trim(),
        description: campaignDescription.trim(),
        target_audience_filter: "multi",
        filter_config: filterConfig ?? undefined,
        recurring_frequency: recurrence,
        action_type: actionType,
        is_active: true,
        start_date: campaignStartDate.trim(),
        end_date: campaignEndDate.trim(),
        schedule_start_time: campaignStartTime.trim() || undefined,
        schedule_end_time: campaignEndTime.trim() || undefined,
        follow_up_offset_days: campaignFollowUpOffsetDays,
      });
      await loadCampaigns();
      setCampaignName("");
      setCampaignDescription("");
      setCampaignStartDate("");
      setCampaignEndDate("");
      setCampaignStartTime("");
      setCampaignEndTime("");
      setCampaignFollowUpOffsetDays(3);
      setRangeFilters({
        risk: defaultRange(),
        healthScore: defaultRange(),
        arr: defaultRange(),
        renewal: defaultRange(),
        utilization: defaultRange(),
        relationshipScore: defaultRange(),
        churn: defaultRange(),
      });
      setLocationKeyword("");
      setPartnerNameKeyword("");
      setPipelineStage("");
    } catch (e) { console.error(e); }
    finally { setCampaignSaving(false); }
  }

  const handleDeleteCampaign = async (id: string) => {
    try {
      await campaignsApi.deleteCampaign(id);
      await loadCampaigns();
    } catch (e) { console.error(e); }
  };

  /** Campaign sections from backend status (stored in DB). Missing status treated as ongoing. */
  const upcomingCampaigns = useMemo(
    () => campaignsList.filter((c) => (c.status ?? "").toLowerCase() === "upcoming"),
    [campaignsList]
  );
  const ongoingCampaigns = useMemo(
    () => campaignsList.filter((c) => (c.status ?? "").toLowerCase() === "ongoing" || !c.status),
    [campaignsList]
  );
  const incompleteCampaigns = useMemo(
    () => campaignsList.filter((c) => (c.status ?? "").toLowerCase() === "incomplete"),
    [campaignsList]
  );
  const completedCampaigns = useMemo(
    () => campaignsList.filter((c) => (c.status ?? "").toLowerCase() === "completed"),
    [campaignsList]
  );

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="bg-card border-b-2 border-black px-6 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Campaigns
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage automated outreach rules or trigger manual actions instantly
          </p>
        </div>

        <div className="flex bg-muted rounded-lg p-1 border-2 border-black shrink-0">
          <button
            onClick={() => setCampaignMode("manual")}
            className={`flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-bold rounded-md transition-all ${campaignMode === "manual"
              ? "bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black"
              : "text-muted-foreground hover:text-foreground hover:bg-black/5"
              }`}
          >
            Manual
          </button>
          <button
            onClick={() => setCampaignMode("auto")}
            className={`flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-bold rounded-md transition-all ${campaignMode === "auto"
              ? "bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black"
              : "text-muted-foreground hover:text-foreground hover:bg-black/5"
              }`}
          >
            Automatic
          </button>
        </div>
      </div>

      <div className="p-6 max-w-[1200px] mx-auto">
        {campaignMode === "auto" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 space-y-5 h-fit">
              <h2 className="text-lg font-bold">Create Auto Campaign</h2>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Set up rules to automatically enroll users in continuous outreach flows.</p>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-bold">Campaign Name <span className="text-destructive">*</span></Label>
                  <input value={campaignName} onChange={e => setCampaignName(e.target.value)} type="text" placeholder="e.g. Q4 Renewal Push" className="w-full mt-1.5 px-3 py-2 text-sm border-2 border-black rounded-lg bg-background" />
                </div>

                <div>
                  <Label className="text-xs font-bold">Campaign Description <span className="text-destructive">*</span></Label>
                  <textarea value={campaignDescription} onChange={e => setCampaignDescription(e.target.value)} placeholder="Describe the objective and details of this campaign..." rows={2} className="w-full mt-1.5 px-3 py-2 text-sm border-2 border-black rounded-lg bg-background resize-y" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold">Campaign Start Date <span className="text-destructive">*</span></Label>
                    <input type="date" value={campaignStartDate} onChange={e => setCampaignStartDate(e.target.value)} className="w-full mt-1.5 px-3 py-2 text-sm border-2 border-black rounded-lg bg-background" />
                    <p className="text-[10px] text-muted-foreground mt-0.5">Required. Campaign runs only on or after this date.</p>
                  </div>
                  <div>
                    <Label className="text-xs font-bold">Campaign End Date <span className="text-destructive">*</span></Label>
                    <input type="date" value={campaignEndDate} onChange={e => setCampaignEndDate(e.target.value)} className="w-full mt-1.5 px-3 py-2 text-sm border-2 border-black rounded-lg bg-background" />
                    <p className="text-[10px] text-muted-foreground mt-0.5">Required. Campaign runs only on or before this date.</p>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold">Target Audience Filters</Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5 mb-2">Same as Accounts: apply any combination. All filters are ANDed.</p>
                  <p className="text-[11px] mb-3">
                    <span className="text-primary font-semibold">Filter will apply to {matchingCount} of {accounts.length} account{accounts.length === 1 ? "" : "s"}</span>
                    {matchingCount < accounts.length && " (filtered)"}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {([
                      { key: "risk" as const, label: "Risk", placeholder: "0-100" },
                      { key: "healthScore" as const, label: "Health Score", placeholder: "0-100" },
                      { key: "arr" as const, label: "Revenue", placeholder: "e.g. 100000" },
                      { key: "renewal" as const, label: "Renewal (days)", placeholder: "-30 to 365" },
                      { key: "utilization" as const, label: "Utilization %", placeholder: "0-100" },
                      { key: "relationshipScore" as const, label: "Relationship", placeholder: "0-100" },
                      { key: "churn" as const, label: "Churn %", placeholder: "0-100" },
                    ]).map(({ key, label, placeholder }) => (
                      <div key={key} className="space-y-1">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
                        <div className="flex gap-2">
                          <input type="number" placeholder="Min" value={rangeFilters[key].min} onChange={(e) => setRangeFilters((p) => ({ ...p, [key]: { ...p[key], min: e.target.value } }))} className="w-full px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background" />
                          <input type="number" placeholder="Max" value={rangeFilters[key].max} onChange={(e) => setRangeFilters((p) => ({ ...p, [key]: { ...p[key], max: e.target.value } }))} className="w-full px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1 relative">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Location (keyword)</label>
                      <input
                        type="text"
                        placeholder="e.g. Mumbai, Maharashtra"
                        value={locationKeyword}
                        onChange={(e) => setLocationKeyword(e.target.value)}
                        onFocus={() => setLocationDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setLocationDropdownOpen(false), 180)}
                        className="w-full px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background"
                      />
                      {locationDropdownOpen && locationSuggestions.length > 0 && (
                        <ul className="absolute z-10 mt-0.5 w-full max-h-40 overflow-auto rounded-lg border-2 border-black bg-card shadow-lg py-1">
                          {locationSuggestions.map((s) => (
                            <li
                              key={s}
                              className="px-2 py-1.5 text-xs cursor-pointer hover:bg-primary/15 focus:bg-primary/15"
                              onMouseDown={(e) => { e.preventDefault(); setLocationKeyword(s); setLocationDropdownOpen(false); }}
                            >
                              {s}
                            </li>
                          ))}
                        </ul>
                      )}
                      {locationSuggestions.length > 0 && (
                        <p className="text-[9px] text-muted-foreground mt-0.5">Suggestions from your accounts. Click to apply.</p>
                      )}
                    </div>
                    <div className="space-y-1 relative">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Partner name (keyword)</label>
                      <input
                        type="text"
                        placeholder="e.g. Acme, Nexus"
                        value={partnerNameKeyword}
                        onChange={(e) => setPartnerNameKeyword(e.target.value)}
                        onFocus={() => setPartnerDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setPartnerDropdownOpen(false), 180)}
                        className="w-full px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background"
                      />
                      {partnerDropdownOpen && partnerSuggestions.length > 0 && (
                        <ul className="absolute z-10 mt-0.5 w-full max-h-40 overflow-auto rounded-lg border-2 border-black bg-card shadow-lg py-1">
                          {partnerSuggestions.map((s) => (
                            <li
                              key={s}
                              className="px-2 py-1.5 text-xs cursor-pointer hover:bg-primary/15 focus:bg-primary/15"
                              onMouseDown={(e) => { e.preventDefault(); setPartnerNameKeyword(s); setPartnerDropdownOpen(false); }}
                            >
                              {s}
                            </li>
                          ))}
                        </ul>
                      )}
                      {partnerSuggestions.length > 0 && (
                        <p className="text-[9px] text-muted-foreground mt-0.5">Suggestions from your accounts. Click to apply.</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Pipeline stage (Renewal Pipeline)</label>
                    <p className="text-[11px] text-muted-foreground mb-1.5">Target accounts in a specific pipeline stage; schedule runs day-wise or month-wise.</p>
                    <select value={pipelineStage} onChange={(e) => setPipelineStage(e.target.value)} className="w-full px-2 py-1.5 text-xs border-2 border-black rounded-lg bg-background">
                      <option value="">Any (no pipeline filter)</option>
                      <option value="q1">Q1 (271+ days to renewal)</option>
                      <option value="q2">Q2 (181–270 days)</option>
                      <option value="q3">Q3 (91–180 days)</option>
                      <option value="q4">Q4 (0–90 days)</option>
                      <option value="renewed">Renewed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold">Recurring Frequency</Label>
                  <select className="w-full mt-1.5 px-3 py-2 text-sm border-2 border-black rounded-lg bg-background" value={recurrence} onChange={(e) => setRecurrence(e.target.value as Recurrence)}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="month">Monthly</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold">Start time (send from)</Label>
                    <input type="time" value={campaignStartTime} onChange={e => setCampaignStartTime(e.target.value)} className="w-full mt-1.5 px-3 py-2 text-sm border-2 border-black rounded-lg bg-background" />
                    <p className="text-[10px] text-muted-foreground mt-0.5">Optional. Messages sent only at or after this time (IST).</p>
                  </div>
                  <div>
                    <Label className="text-xs font-bold">End time (send until)</Label>
                    <input type="time" value={campaignEndTime} onChange={e => setCampaignEndTime(e.target.value)} className="w-full mt-1.5 px-3 py-2 text-sm border-2 border-black rounded-lg bg-background" />
                    <p className="text-[10px] text-muted-foreground mt-0.5">Optional. Messages sent only at or before this time (IST).</p>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold">Follow-up offset (days)</Label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={campaignFollowUpOffsetDays}
                    onChange={e => setCampaignFollowUpOffsetDays(Math.max(1, Math.min(60, parseInt(e.target.value, 10) || 3)))}
                    className="w-full mt-1.5 px-3 py-2 text-sm border-2 border-black rounded-lg bg-background"
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">Controls when calls or emails are automatically queued after this touchpoint.</p>
                </div>

                <div className="pt-2">
                  <Label className="text-xs font-bold">Action <span className="text-destructive">*</span></Label>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Required. Select one: Email or Voice.</p>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer p-3 border-2 border-black rounded-lg flex-1 hover:bg-muted/50 transition-colors">
                      <input type="radio" name="auto-action" value="email_sequence" checked={actionType === "email_sequence"} onChange={e => setActionType(e.target.value)} className="accent-primary" />
                      <Mail className="w-4 h-4 text-primary" /> Send Email Sequence
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer p-3 border-2 border-black rounded-lg flex-1 hover:bg-muted/50 transition-colors">
                      <input type="radio" name="auto-action" value="voice_bot" checked={actionType === "voice_bot"} onChange={e => setActionType(e.target.value)} className="accent-primary" />
                      <Phone className="w-4 h-4 text-primary" /> Trigger Voice Bot
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t-2 border-black mt-6 flex justify-end gap-3">
                <button className="px-4 py-2 text-sm font-bold border-2 border-black rounded-lg hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button onClick={handleSaveCampaign} disabled={campaignSaving || !canSaveCampaign} className="px-6 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2 disabled:opacity-50">
                  {campaignSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Save Campaign
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-5">
              {/* Upcoming: set but not yet triggered (start_date in future) */}
              <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[280px]">
                <div className="px-5 py-3.5 border-b-2 border-black flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Upcoming Campaigns</h3>
                  <span className="bg-amber-500/20 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/40">{upcomingCampaigns.length}</span>
                </div>
                <p className="px-4 pt-1 text-[10px] text-muted-foreground">Saved; will trigger from start date.</p>
                <div className="p-4 overflow-y-auto space-y-3">
                  {upcomingCampaigns.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">No upcoming campaigns.</p>
                  ) : upcomingCampaigns.map((c) => (
                    <div key={c.id} className="border-2 border-amber-500/30 rounded-lg p-2.5 space-y-1 bg-amber-500/5">
                      <h4 className="text-xs font-bold">{c.name}</h4>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">{c.description}</p>
                      {c.start_date && <p className="text-[10px] text-amber-700 font-medium">Starts {c.start_date}</p>}
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{c.action_type === "email_sequence" ? "Email" : "Voice"}</span>
                        <button onClick={() => handleDeleteCampaign(c.id!)} className="ml-auto text-destructive hover:underline">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col h-full max-h-[600px]">
                <div className="px-5 py-3.5 border-b-2 border-black flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw size={15} className="text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Ongoing Campaigns</h3>
                  </div>
                  <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20">{ongoingCampaigns.length} Active</span>
                </div>
                <p className="px-4 pt-1 text-[10px] text-muted-foreground">Auto-triggered by schedule (no run button).</p>
                <div className="p-4 overflow-y-auto space-y-4">
                  {campaignsLoading ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Loading campaigns...</p>
                  ) : ongoingCampaigns.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No ongoing campaigns.</p>
                  ) : ongoingCampaigns.map(campaign => (
                    <div key={campaign.id} className="border-2 border-black rounded-lg p-3 space-y-2 relative overflow-hidden group min-h-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold truncate">{campaign.name}</h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 break-words">{campaign.description || "—"}</p>
                          {(campaign.start_date || campaign.end_date) && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {campaign.start_date && campaign.end_date
                                ? `${campaign.start_date} → ${campaign.end_date}`
                                : campaign.start_date
                                  ? `From ${campaign.start_date}`
                                  : `Until ${campaign.end_date}`}
                            </p>
                          )}
                          {(campaign.schedule_start_time || campaign.schedule_end_time) && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Send {campaign.schedule_start_time && campaign.schedule_end_time
                                ? `${campaign.schedule_start_time}–${campaign.schedule_end_time} IST`
                                : campaign.schedule_start_time
                                  ? `from ${campaign.schedule_start_time} IST`
                                  : `until ${campaign.schedule_end_time} IST`}
                            </p>
                          )}
                          {campaign.follow_up_offset_days != null && (
                            <p className={`text-[10px] mt-0.5 font-medium ${campaign.follow_up_offset_days > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                              Follow-up offset: {campaign.follow_up_offset_days}d
                            </p>
                          )}
                        </div>
                        <div className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${campaign.is_active ? 'bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]' : 'bg-muted-foreground'}`} aria-hidden />
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-2 text-[11px] font-medium text-muted-foreground border-t border-black/10 mt-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex items-center gap-1 shrink-0">
                            {campaign.action_type === 'email_sequence' ? <Mail size={10} /> : <Phone size={10} />}
                            {campaign.action_type === 'email_sequence' ? 'Email' : 'Voice Call'}
                          </span>
                          <span className="flex items-center gap-1 shrink-0">
                            <RefreshCw size={10} /> {campaign.recurring_frequency}
                          </span>
                        </div>
                        <button type="button" onClick={() => handleDeleteCampaign(campaign.id!)} className="text-destructive hover:underline text-[10px] shrink-0 invisible group-hover:visible">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Incomplete: last run had errors or didn't send to some (saved in DB) */}
              <div className="bg-card rounded-xl border-2 border-destructive/50 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[320px]">
                <div className="px-5 py-3.5 border-b-2 border-black flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Incomplete Campaigns</h3>
                  <span className="bg-destructive/20 text-destructive text-[10px] font-bold px-2 py-0.5 rounded-full border border-destructive/40">{incompleteCampaigns.length}</span>
                </div>
                <p className="px-4 pt-1 text-[10px] text-muted-foreground">Last run had errors or did not send to some accounts.</p>
                <div className="p-4 overflow-y-auto space-y-3">
                  {incompleteCampaigns.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">No incomplete campaigns.</p>
                  ) : incompleteCampaigns.map((c) => (
                    <div key={c.id} className="border-2 border-destructive/30 rounded-lg p-2.5 space-y-1 bg-destructive/5">
                      <h4 className="text-xs font-bold">{c.name}</h4>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">{c.description}</p>
                      {(c.start_date || c.end_date) && (
                        <p className="text-[10px] text-muted-foreground">{c.start_date && c.end_date ? `${c.start_date} → ${c.end_date}` : c.end_date ? `Until ${c.end_date}` : `From ${c.start_date}`}</p>
                      )}
                      <div className="flex items-center gap-2 pt-1 text-[10px] text-muted-foreground">
                        <span>{c.action_type === "email_sequence" ? "Email" : "Voice"}</span>
                        <button onClick={() => handleDeleteCampaign(c.id!)} className="ml-auto text-destructive hover:underline">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[400px]">
                <div className="px-5 py-3.5 border-b-2 border-black flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Completed Campaigns</h3>
                  <span className="bg-muted text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded-full border border-black/20">{completedCampaigns.length}</span>
                </div>
                <div className="p-4 overflow-y-auto space-y-3">
                  {completedCampaigns.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No completed campaigns.</p>
                  ) : completedCampaigns.map((campaign) => (
                    <div key={campaign.id} className="border border-black/20 rounded-lg p-2.5 space-y-1 bg-muted/30">
                      <h4 className="text-xs font-bold">{campaign.name}</h4>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">{campaign.description}</p>
                      {(campaign.start_date || campaign.end_date) && (
                        <p className="text-[10px] text-muted-foreground">
                          {campaign.start_date && campaign.end_date ? `${campaign.start_date} → ${campaign.end_date}` : campaign.end_date ? `Ended ${campaign.end_date}` : `From ${campaign.start_date}`}
                        </p>
                      )}
                      <div className="flex items-center gap-2 pt-1 text-[10px] text-muted-foreground">
                        <span>{campaign.action_type === "email_sequence" ? "Email" : "Voice"}</span>
                        <span>·</span>
                        <span>{campaign.recurring_frequency}</span>
                        <button onClick={() => handleDeleteCampaign(campaign.id!)} className="ml-auto text-destructive hover:underline">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 space-y-5">
              {/* Manual Email */}
              <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="px-5 py-3.5 border-b-2 border-black flex items-center gap-2">
                  <Mail size={15} className="text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Manual Email</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex gap-3 border-b-2 border-black pb-3">
                    <button
                      onClick={() => setEmailMode("all")}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border-2 border-black transition-all ${emailMode === "all" ? "bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "bg-muted hover:bg-muted/80"}`}
                    >
                      Send to all
                    </button>
                    <button
                      onClick={() => setEmailMode("single")}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border-2 border-black transition-all ${emailMode === "single" ? "bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "bg-muted hover:bg-muted/80"}`}
                    >
                      Send to single
                    </button>
                  </div>

                  {emailMode === "all" && (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-medium text-foreground">Purpose (what do you want to say to everyone?)</Label>
                        <input
                          type="text"
                          placeholder="e.g. renewal reminder, 10% discount, check-in"
                          value={emailPurpose}
                          onChange={(e) => setEmailPurpose(e.target.value)}
                          className="w-full mt-0.5 px-3 py-2 text-sm border-2 border-black rounded-lg bg-background"
                        />
                        <p className="text-[10px] text-muted-foreground mt-0.5">Optional. All emails will be tailored to this purpose.</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Send personalized emails to all eligible customers (same as scheduled campaign).</p>
                      <button
                        onClick={handleSendToAll}
                        disabled={allEmailLoading}
                        className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-60"
                      >
                        {allEmailLoading ? "Sending…" : <><Send size={12} /> Send email to all</>}
                      </button>
                    </div>
                  )}

                  {emailMode === "single" && (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-medium text-foreground">Purpose (what do you want to say?)</Label>
                        <input
                          type="text"
                          placeholder="e.g. review follow-up, renewal reminder, check-in"
                          value={emailPurpose}
                          onChange={(e) => setEmailPurpose(e.target.value)}
                          className="w-full mt-0.5 px-3 py-2 text-sm border-2 border-black rounded-lg bg-background"
                        />
                        <p className="text-[10px] text-muted-foreground mt-0.5">Optional. When you click Auto-generate, the message will be tailored to this purpose.</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-foreground">Select customer</Label>
                        <div className="mt-1">
                          <input
                            type="text"
                            placeholder="Type name to search..."
                            value={selectedAccount ? selectedAccount.name : accountSearch}
                            onChange={(e) => {
                              setAccountSearch(e.target.value);
                              if (selectedAccount) setSelectedAccount(null);
                            }}
                            onFocus={() => setSelectedAccount(null)}
                            className="w-full px-3 py-2 text-sm border-2 border-black rounded-lg bg-background"
                            autoComplete="off"
                          />
                          {!selectedAccount && accountSearch.trim() && (
                            <div className="mt-1 w-full bg-card border-2 border-black rounded-lg shadow-lg max-h-48 overflow-auto">
                              {accountsLoading ? (
                                <p className="px-3 py-2 text-xs text-muted-foreground">Loading customers…</p>
                              ) : accountSuggestions.length > 0 ? (
                                <ul className="py-0.5">
                                  {accountSuggestions.map((acc) => (
                                    <li
                                      key={acc.id}
                                      onClick={() => {
                                        setSelectedAccount({ id: acc.id, name: acc.name });
                                        setAccountSearch("");
                                      }}
                                      className="px-3 py-2 text-xs cursor-pointer hover:bg-muted border-b border-black/10 last:border-0 first:rounded-t-md"
                                    >
                                      {acc.name}
                                      {acc.industry && <span className="text-muted-foreground ml-1">({acc.industry})</span>}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="px-3 py-2 text-xs text-muted-foreground">No customers match &quot;{accountSearch.trim()}&quot;</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {selectedAccount && (
                        <div className="space-y-2 pt-2 border-t-2 border-black/10">
                          <p className="text-[11px] text-muted-foreground">Sending to: <strong className="text-foreground">{selectedAccount.name}</strong></p>
                          <div>
                            <Label className="text-xs font-medium text-foreground">Subject</Label>
                            <input
                              value={emailSubject}
                              onChange={(e) => setEmailSubject(e.target.value)}
                              placeholder="Email subject"
                              className="w-full mt-0.5 px-3 py-2 text-sm border-2 border-black rounded-lg bg-background"
                            />
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-foreground">Body</Label>
                            <textarea
                              value={emailBody}
                              onChange={(e) => { setEmailBody(e.target.value); setLastPreviewHtml(null); }}
                              placeholder="Email body (auto-generate or type)"
                              rows={6}
                              className="w-full mt-0.5 px-3 py-2 text-sm border-2 border-black rounded-lg bg-background resize-y"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleAutoGenerate}
                              disabled={previewLoading}
                              className="flex-1 py-2 bg-muted text-foreground rounded-lg text-xs font-medium border-2 border-black hover:bg-muted/80 flex items-center justify-center gap-1.5 disabled:opacity-60"
                            >
                              {previewLoading ? "Generating…" : <><Sparkles size={12} /> Auto-generate</>}
                            </button>
                            <button
                              onClick={handleSendSingle}
                              disabled={sendLoading}
                              className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-primary/90 flex items-center justify-center gap-1.5 disabled:opacity-60"
                            >
                              {sendLoading ? "Sending…" : <><Send size={12} /> Send mail</>}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {emailMessage && (
                    <p className={`text-xs ${emailMessage.type === "success" ? "text-emerald-600" : "text-destructive"}`}>
                      {emailMessage.text}
                    </p>
                  )}
                </div>
              </div>

              {/* Manual Voice */}
              <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="px-5 py-3.5 border-b-2 border-black flex items-center gap-2">
                  <Phone size={15} className="text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Manual Voice</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex gap-3 border-b-2 border-black pb-3">
                    <button
                      onClick={() => setVoiceMode("all")}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border-2 border-black transition-all ${voiceMode === "all" ? "bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "bg-muted hover:bg-muted/80"}`}
                    >
                      Trigger for all
                    </button>
                    <button
                      onClick={() => setVoiceMode("single")}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border-2 border-black transition-all ${voiceMode === "single" ? "bg-primary text-primary-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "bg-muted hover:bg-muted/80"}`}
                    >
                      Trigger for one
                    </button>
                  </div>

                  {voiceMode === "all" && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Trigger voice calls for all eligible accounts (same logic as scheduled: usage milestones, check you understand, etc.).</p>
                      <button
                        onClick={handleVoiceTriggerAll}
                        disabled={voiceAllLoading}
                        className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-60"
                      >
                        {voiceAllLoading ? "Triggering…" : <><Phone size={12} /> Trigger voice calls for all</>}
                      </button>
                    </div>
                  )}

                  {voiceMode === "single" && (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-medium text-foreground">Purpose of call</Label>
                        <input
                          type="text"
                          placeholder="e.g. review follow-up, renewal discussion, check-in"
                          value={voicePurpose}
                          onChange={(e) => setVoicePurpose(e.target.value)}
                          className="w-full mt-0.5 px-3 py-2 text-sm border-2 border-black rounded-lg bg-background"
                        />
                        <p className="text-[10px] text-muted-foreground mt-0.5">Optional. The call script will be tailored to this purpose.</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-foreground">Select customer</Label>
                        <div className="mt-1">
                          <input
                            type="text"
                            placeholder="Type name to search..."
                            value={voiceSelectedAccount ? voiceSelectedAccount.name : voiceAccountSearch}
                            onChange={(e) => {
                              setVoiceAccountSearch(e.target.value);
                              if (voiceSelectedAccount) setVoiceSelectedAccount(null);
                            }}
                            onFocus={() => setVoiceSelectedAccount(null)}
                            className="w-full px-3 py-2 text-sm border-2 border-black rounded-lg bg-background"
                            autoComplete="off"
                          />
                          {!voiceSelectedAccount && voiceAccountSearch.trim() && (
                            <div className="mt-1 w-full bg-card border-2 border-black rounded-lg shadow-lg max-h-48 overflow-auto">
                              {accountsLoading ? (
                                <p className="px-3 py-2 text-xs text-muted-foreground">Loading customers…</p>
                              ) : voiceAccountSuggestions.length > 0 ? (
                                <ul className="py-0.5">
                                  {voiceAccountSuggestions.map((acc) => (
                                    <li
                                      key={acc.id}
                                      onClick={() => {
                                        setVoiceSelectedAccount({ id: acc.id, name: acc.name });
                                        setVoiceAccountSearch("");
                                      }}
                                      className="px-3 py-2 text-xs cursor-pointer hover:bg-muted border-b border-black/10 last:border-0 first:rounded-t-md"
                                    >
                                      {acc.name}
                                      {acc.industry && <span className="text-muted-foreground ml-1">({acc.industry})</span>}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="px-3 py-2 text-xs text-muted-foreground">No customers match &quot;{voiceAccountSearch.trim()}&quot;</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {voiceSelectedAccount && (
                        <div className="pt-2 border-t-2 border-black/10 space-y-2">
                          <p className="text-[11px] text-muted-foreground">Calling: <strong className="text-foreground">{voiceSelectedAccount.name}</strong></p>
                          <button
                            onClick={handleVoiceTriggerSingle}
                            disabled={voiceSingleLoading}
                            className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-primary/90 flex items-center justify-center gap-1.5 disabled:opacity-60"
                          >
                            {voiceSingleLoading ? "Triggering…" : <><Phone size={12} /> Trigger call</>}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {voiceMessage && (
                    <p className={`text-xs ${voiceMessage.type === "success" ? "text-emerald-600" : "text-destructive"}`}>
                      {voiceMessage.text}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {/* End of Manual email/voice */}

            <div className="lg:col-span-4 space-y-5">
              {/* ML Pipeline – manual trigger */}
              <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="px-5 py-3.5 border-b-2 border-black flex items-center gap-2">
                  <Cpu size={15} className="text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">ML Predictions</h3>
                </div>
                <div className="p-4 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Run Relationship → Health → Churn → Upsell for all accounts and save to the database. Runs automatically at 12:00 AM daily.
                  </p>
                  <button
                    onClick={handleRunMlPipeline}
                    disabled={mlLoading}
                    className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {mlLoading ? (
                      <>Running…</>
                    ) : (
                      <>
                        <RefreshCw size={12} /> Run ML pipeline now
                      </>
                    )}
                  </button>
                  {mlMessage && (
                    <p className={`text-xs ${mlMessage.type === "success" ? "text-emerald-600" : "text-destructive"}`}>
                      {mlMessage.text}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
