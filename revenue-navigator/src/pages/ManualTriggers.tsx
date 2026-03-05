import { useState, useMemo, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Cpu, Mail, Send, Sparkles, Phone, RefreshCw } from "lucide-react";
import { triggerMlPipeline } from "@/lib/api/ml";
import { emailApi } from "@/lib/api/email";
import { voiceApi } from "@/lib/api/voice";
import { campaignsApi, AutoCampaign } from "@/lib/api/campaigns";
import { useAccounts } from "@/hooks/useAccounts";

type EmailMode = "all" | "single";
type VoiceMode = "all" | "single";
type CampaignMode = "manual" | "auto";
type TargetFilter = "days_range" | "health_range" | "quarter" | "usage_drop" | "month";
type Recurrence = "daily" | "weekly" | "month";

export default function ManualTriggersPage() {
  const [campaignMode, setCampaignMode] = useState<CampaignMode>("manual");
  const [targetFilter, setTargetFilter] = useState<TargetFilter>("days_range");
  const [recurrence, setRecurrence] = useState<Recurrence>("weekly");
  const [campaignName, setCampaignName] = useState("");
  const [campaignDescription, setCampaignDescription] = useState("");
  const [filterMin, setFilterMin] = useState("");
  const [filterMax, setFilterMax] = useState("");
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
  const [allEmailLoading, setAllEmailLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [voiceMode, setVoiceMode] = useState<VoiceMode>("single");
  const [voiceAccountSearch, setVoiceAccountSearch] = useState("");
  const [voiceSelectedAccount, setVoiceSelectedAccount] = useState<{ id: string; name: string } | null>(null);
  const [voiceAllLoading, setVoiceAllLoading] = useState(false);
  const [voiceSingleLoading, setVoiceSingleLoading] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
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
      await emailApi.triggerCampaign();
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
      const preview = await emailApi.getPreview(selectedAccount.id);
      setEmailSubject(preview.subject);
      setEmailBody(preview.text_body);
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
          html_body: emailBody.replace(/\n/g, "<br/>"),
          text_body: emailBody,
        }
        : undefined;
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
      await voiceApi.triggerToAccount(voiceSelectedAccount.id);
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

  const handleSaveCampaign = async () => {
    if (!campaignName) return;
    setCampaignSaving(true);
    try {
      await campaignsApi.createCampaign({
        name: campaignName,
        description: campaignDescription,
        target_audience_filter: targetFilter,
        filter_min_value: filterMin ? parseFloat(filterMin) : undefined,
        filter_max_value: filterMax ? parseFloat(filterMax) : undefined,
        recurring_frequency: recurrence,
        action_type: actionType,
        is_active: true
      });
      await loadCampaigns();
      setCampaignName("");
      setCampaignDescription("");
      setFilterMin("");
      setFilterMax("");
    } catch (e) { console.error(e); }
    finally { setCampaignSaving(false); }
  }

  const handleDeleteCampaign = async (id: string) => {
    try {
      await campaignsApi.deleteCampaign(id);
      await loadCampaigns();
    } catch (e) { console.error(e); }
  }

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
                  <Label className="text-xs font-bold">Campaign Name</Label>
                  <input value={campaignName} onChange={e => setCampaignName(e.target.value)} type="text" placeholder="e.g. Q4 Renewal Push" className="w-full mt-1.5 px-3 py-2 text-sm border-2 border-black rounded-lg bg-background" />
                </div>

                <div>
                  <Label className="text-xs font-bold">Campaign Description</Label>
                  <textarea value={campaignDescription} onChange={e => setCampaignDescription(e.target.value)} placeholder="Describe the objective and details of this campaign..." rows={2} className="w-full mt-1.5 px-3 py-2 text-sm border-2 border-black rounded-lg bg-background resize-y" />
                </div>

                <div>
                  <Label className="text-xs font-bold">Target Audience Filter</Label>
                  <select
                    className="w-full mt-1.5 px-3 py-2 text-sm border-2 border-black rounded-lg bg-background"
                    value={targetFilter}
                    onChange={(e) => setTargetFilter(e.target.value as TargetFilter)}
                  >
                    <option value="days_range">Days Until Renewal (Range)</option>
                    <option value="health_range">Health Score (Range)</option>
                    <option value="quarter">Specific Renewal Quarter (e.g. Q1, Q2)</option>
                    <option value="month">Specific Month</option>
                    <option value="usage_drop">Usage Drop (Less than X%)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold">Value / Setting</Label>

                    {targetFilter === "days_range" || targetFilter === "health_range" ? (
                      <div className="flex items-center gap-2 mt-1.5">
                        <input value={filterMin} onChange={e => setFilterMin(e.target.value)} type="number" placeholder="Min" className="w-full px-3 py-2 text-sm border-2 border-black rounded-lg bg-background" />
                        <span className="text-muted-foreground">-</span>
                        <input value={filterMax} onChange={e => setFilterMax(e.target.value)} type="number" placeholder="Max" className="w-full px-3 py-2 text-sm border-2 border-black rounded-lg bg-background" />
                      </div>
                    ) : targetFilter === "month" ? (
                      <select className="w-full mt-1.5 px-3 py-2 text-sm border-2 border-black rounded-lg bg-background">
                        <option>January</option>
                        <option>February</option>
                        <option>March</option>
                        <option>April</option>
                        <option>May</option>
                        <option>June</option>
                        <option>July</option>
                        <option>August</option>
                        <option>September</option>
                        <option>October</option>
                        <option>November</option>
                        <option>December</option>
                      </select>
                    ) : targetFilter === "quarter" ? (
                      <select className="w-full mt-1.5 px-3 py-2 text-sm border-2 border-black rounded-lg bg-background">
                        <option>Q1</option>
                        <option>Q2</option>
                        <option>Q3</option>
                        <option>Q4</option>
                      </select>
                    ) : (
                      <div className="relative mt-1.5">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                          <span className="text-muted-foreground text-sm font-medium">&lt;</span>
                        </div>
                        <input value={filterMax} onChange={e => setFilterMax(e.target.value)} type="number" placeholder="e.g. 20" className="w-full pl-8 pr-3 py-2 text-sm border-2 border-black rounded-lg bg-background" />
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs font-bold">Recurring Frequency</Label>
                    <div className="flex flex-col gap-2 mt-1.5">
                      <select
                        className="w-full px-3 py-2 text-sm border-2 border-black rounded-lg bg-background"
                        value={recurrence}
                        onChange={(e) => setRecurrence(e.target.value as Recurrence)}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="month">Specific Month</option>
                      </select>

                      {recurrence === "month" && (
                        <select className="w-full px-3 py-2 text-sm border-2 border-black rounded-lg bg-background border-dashed">
                          <option>January</option>
                          <option>February</option>
                          <option>March</option>
                          <option>April</option>
                          <option>May</option>
                          <option>June</option>
                          <option>July</option>
                          <option>August</option>
                          <option>September</option>
                          <option>October</option>
                          <option>November</option>
                          <option>December</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Label className="text-xs font-bold">Action</Label>
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
                <button onClick={handleSaveCampaign} disabled={campaignSaving || !campaignName} className="px-6 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2 disabled:opacity-50">
                  {campaignSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Save Campaign
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-5">
              <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col h-full max-h-[600px]">
                <div className="px-5 py-3.5 border-b-2 border-black flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw size={15} className="text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Ongoing Campaigns</h3>
                  </div>
                  <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20">{campaignsList.length} Active</span>
                </div>
                <div className="p-4 overflow-y-auto space-y-4">
                  {campaignsLoading ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Loading campaigns...</p>
                  ) : campaignsList.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No active campaigns.</p>
                  ) : campaignsList.map(campaign => (
                    <div key={campaign.id} className="border-2 border-black rounded-lg p-3 space-y-2 relative overflow-hidden group">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold">{campaign.name}</h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{campaign.description}</p>
                        </div>
                        <div className={`shrink-0 w-2 h-2 rounded-full mt-1 ${campaign.is_active ? 'bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]' : 'bg-muted-foreground'}`}></div>
                      </div>
                      <div className="flex items-center justify-between gap-3 pt-2 text-[11px] font-medium text-muted-foreground border-t border-black/10 mt-2">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            {campaign.action_type === 'email_sequence' ? <Mail size={10} /> : <Phone size={10} />}
                            {campaign.action_type === 'email_sequence' ? 'Email' : 'Voice Call'}
                          </span>
                          <span className="flex items-center gap-1">
                            <RefreshCw size={10} /> {campaign.recurring_frequency}
                          </span>
                        </div>
                        <button onClick={() => handleDeleteCampaign(campaign.id!)} className="text-destructive hover:underline text-[10px] invisible group-hover:visible">Delete</button>
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
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Send personalized emails to all eligible customers (same as scheduled campaign).</p>
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
                              onChange={(e) => setEmailBody(e.target.value)}
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
