import { useState, useMemo } from "react";
import { Search, Phone, Loader2, X, Mail, MessageCircle, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/ui/EmptyState";
import { voiceApi, type VoiceCallRow, type VoiceCallDetail } from "@/lib/api/voice";
import { emailApi } from "@/lib/api/email";
import { whatsappApi } from "@/lib/api/whatsapp";
import { useAccounts } from "@/hooks/useAccounts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ------- Sentiment Badge Helper -------
const INTENT_CONFIG: Record<string, { label: string; emoji: string; cls: string }> = {
  interested:             { label: "Interested",         emoji: "😊", cls: "bg-emerald-500/10 text-emerald-700" },
  renewed:                { label: "Renewed",             emoji: "✅", cls: "bg-emerald-500/20 text-emerald-800" },
  renew_afterwards:       { label: "Renew Later",         emoji: "🕐", cls: "bg-blue-500/10 text-blue-700" },
  objection_no_money:     { label: "No Budget",           emoji: "💸", cls: "bg-amber-500/10 text-amber-700" },
  not_interested_churn:   { label: "Critical",            emoji: "🚨", cls: "bg-destructive/10 text-destructive" },
  churned:                { label: "Critical",            emoji: "🚨", cls: "bg-destructive/10 text-destructive" },
  not_interested:         { label: "Critical",            emoji: "🚨", cls: "bg-destructive/10 text-destructive" },
  needs_followup:         { label: "Needs Follow-up",     emoji: "🔔", cls: "bg-yellow-500/10 text-yellow-700" },
  completed:              { label: "Completed",           emoji: "📋", cls: "bg-muted text-muted-foreground" },
};

function SentimentBadge({ intent }: { intent?: any }) {
  let rawIntentStr = "";
  if (typeof intent === "string") {
    rawIntentStr = intent;
  } else if (Array.isArray(intent)) {
    rawIntentStr = String(intent[0] || "");
  } else if (typeof intent === "object" && intent !== null) {
    rawIntentStr = String(intent.intent || "");
  } else {
    rawIntentStr = String(intent || "");
  }
  
  const key = (rawIntentStr || "completed").toLowerCase().replace(/-/g, "_");
  const cfg = INTENT_CONFIG[key] || { label: intent || "Unknown", emoji: "❓", cls: "bg-muted text-muted-foreground" };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border-2 border-black ${cfg.cls}`}>
      {cfg.emoji} {cfg.label}
    </span>
  );
}

// ------- Sentiment Analysis Panel -------
interface SentimentData {
  sentiment_category?: string | null;
  sentiment_score?: number | null;
  keywords?: string[];
}

function SentimentPanel({ detail }: { detail: SentimentData }) {
  const cat = (detail.sentiment_category || "neutral").toLowerCase();
  const score = typeof detail.sentiment_score === "number" ? detail.sentiment_score : null;
  const keywords: string[] = Array.isArray(detail.keywords) ? detail.keywords : [];

  const sentimentCfg = {
    positive:    { emoji: "😊", label: "Positive",  bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-500/10 border-emerald-300" },
    very_positive: { emoji: "🤩", label: "Very Positive", bar: "bg-emerald-600", text: "text-emerald-800", bg: "bg-emerald-500/20 border-emerald-400" },
    negative:    { emoji: "😟", label: "Negative",  bar: "bg-red-500",     text: "text-red-700",     bg: "bg-red-500/10 border-red-300" },
    very_negative: { emoji: "😡", label: "Very Negative", bar: "bg-red-700", text: "text-red-800",    bg: "bg-red-500/20 border-red-400" },
    neutral:     { emoji: "😐", label: "Neutral",   bar: "bg-gray-400",    text: "text-gray-600",    bg: "bg-muted border-gray-300" },
  }[cat] ?? { emoji: "😐", label: cat, bar: "bg-gray-400", text: "text-gray-600", bg: "bg-muted border-gray-300" };

  // Convert score (-1 to 1 or 0 to 1) to a 0-100 percentage for the bar
  const pct = score !== null
    ? score > 1 ? Math.round(score) : Math.round(((score + 1) / 2) * 100)
    : cat === "positive" || cat === "very_positive" ? 75
    : cat === "negative" || cat === "very_negative" ? 25
    : 50;

  return (
    <div className={`rounded-lg border-2 border-black p-4 space-y-3 ${sentimentCfg.bg}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider">Sentiment Analysis</h3>
        <span className={`text-lg font-black ${sentimentCfg.text} flex items-center gap-1`}>
          {sentimentCfg.emoji} {sentimentCfg.label}
        </span>
      </div>

      {/* Score bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
          <span>Negative</span>
          <span>Score: {score !== null ? score.toFixed(2) : "—"}</span>
          <span>Positive</span>
        </div>
        <div className="h-2.5 w-full bg-muted rounded-full border border-black/20 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${sentimentCfg.bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Keywords */}
      {keywords.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase text-muted-foreground">Key Topics Detected</p>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((kw, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-background border-2 border-black text-foreground"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Sentiment() {
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [callDetail, setCallDetail] = useState<VoiceCallDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // For Email/WA dialogs
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);

  // Email thread sentiment — fetched on open, mirrors voice call detail pattern
  const [emailSentimentDetail, setEmailSentimentDetail] = useState<{
    sentiment_category: string;
    sentiment_score: number | null;
    keywords: string[];
  } | null>(null);
  const [emailSentimentLoading, setEmailSentimentLoading] = useState(false);

  const { data: accounts = [] } = useAccounts();
  const accountIds = useMemo(() => new Set(accounts.map((a) => a.id)), [accounts]);

  // Fetches
  const { data: voiceData, isLoading: isVoiceLoading, error: voiceError } = useQuery({
    queryKey: ["voice-calls"],
    queryFn: () => voiceApi.getCalls(0, 200),
  });

  const { data: emailDataRes, isLoading: isEmailLoading, error: emailError } = useQuery({
    queryKey: ["email-campaigns"],
    queryFn: () => emailApi.getCampaigns(0, 500),
  });

  const { data: waDataRes, isLoading: isWaLoading, error: waError } = useQuery({
    queryKey: ["whatsapp-conversations"],
    queryFn: () => whatsappApi.getConversations(0, 500),
  });

  // ========== VOICE LOGIC ==========
  const voiceCallsRaw: VoiceCallRow[] = voiceData?.calls ?? [];
  const voiceCalls = useMemo(
    () => voiceCallsRaw.filter((c) => (c.account_id && accountIds.has(c.account_id)) || !c.account_id),
    [voiceCallsRaw, accountIds]
  );
  const isTrulyPickedUp = (c: VoiceCallRow) =>
    c.outcome === "picked_up" && typeof c.duration_seconds === "number" && c.duration_seconds > 0;
  const filteredVoice = useMemo(() => {
    return voiceCalls
      .filter((c) => c.account_name?.toLowerCase().includes(search.toLowerCase()))
      .filter((c) => {
        if (outcomeFilter === "all") return true;
        
        // Calculate effective outcome for filtering
        const rawOutcome = (c.outcome || "").toString();
        let effectiveOutcome = rawOutcome || "not_picked";
        if (rawOutcome === "picked_up" && !isTrulyPickedUp(c)) {
          effectiveOutcome = "not_picked";
        }
        
        if (outcomeFilter === "picked_up") return effectiveOutcome === "picked_up";
        if (outcomeFilter === "missed") return effectiveOutcome === "not_picked" || effectiveOutcome === "missed" || effectiveOutcome === "no_answer";
        return effectiveOutcome === outcomeFilter;
      });
  }, [voiceCalls, search, outcomeFilter, isTrulyPickedUp]);

  const openCallDetail = async (callId: string) => {
    setSelectedCallId(callId);
    setCallDetail(null);
    setDetailLoading(true);
    try {
      const detail = await voiceApi.getById(callId);
      setCallDetail(detail);
    } catch {
      setCallDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };
  const closeCallDetail = () => {
    setSelectedCallId(null);
    setCallDetail(null);
  };

  // Open email thread — fetch sentiment from sentiment_analysis table (mirrors openCallDetail)
  const openEmailThread = async (accountId: string) => {
    setSelectedAccountId(accountId);
    setEmailSentimentDetail(null);
    setEmailSentimentLoading(true);
    try {
      const data = await emailApi.getSentiment(accountId);
      setEmailSentimentDetail({
        sentiment_category: data.sentiment_category ?? 'neutral',
        sentiment_score:    data.sentiment_score    ?? null,
        keywords:           data.keywords           ?? [],
      });
    } catch {
      setEmailSentimentDetail(null);
    } finally {
      setEmailSentimentLoading(false);
    }
  };

  // ========== EMAIL LOGIC ==========
  const emailsRaw = (emailDataRes as any)?.campaigns ?? [];
  const emailThreads = useMemo(() => {
    const accMap = new Map<string, any[]>();
    emailsRaw.forEach((email: any) => {
      const accId = email.account_id || (email.metadata && email.metadata.account_id);
      if (!accId) return;
      if (!accMap.has(accId)) accMap.set(accId, []);
      accMap.get(accId)!.push(email);
    });
    return Array.from(accMap.entries()).map(([accId, msgs]) => {
      msgs.sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
      const latest = msgs[0];
      const matchedAccount = accounts.find(a => a.id === accId);
      const accountName = latest.accounts?.name || matchedAccount?.name || 'Unknown Account';
      const isSearchMatch = accountName.toLowerCase().includes(search.toLowerCase());

      // Most-recent inbound replica — used for intent + sentiment
      const inboundReply = msgs.find(
        (m: any) => m.status === 'received' || m.metadata?.direction === 'inbound'
      );
      const latestIntent = inboundReply?.metadata?.detected_intent
        || latest.metadata?.detected_intent
        || 'completed';

      // Scan ALL messages (desc order) for the first one that has sentiment data
      // Use ?? (nullish) so that 0.0 score and 'neutral' category are preserved
      let latestSentimentCategory: string | null = null;
      let latestSentimentScore: number | null = null;
      let latestKeywords: string[] = [];

      for (const m of msgs) {
        const meta = m.metadata ?? {};
        if (meta.sentiment_category != null && latestSentimentCategory == null) {
          latestSentimentCategory = meta.sentiment_category;
        }
        if (meta.sentiment_score != null && latestSentimentScore == null) {
          latestSentimentScore = meta.sentiment_score;
        }
        if (Array.isArray(meta.keywords) && meta.keywords.length > 0 && latestKeywords.length === 0) {
          latestKeywords = meta.keywords;
        }
        // Stop early if we have everything
        if (latestSentimentCategory != null && latestSentimentScore != null && latestKeywords.length > 0) break;
      }

      // Final fallback → account-level fields from the accounts table
      if (latestSentimentCategory == null) latestSentimentCategory = matchedAccount?.sentiment_category ?? null;
      if (latestSentimentScore == null)    latestSentimentScore    = matchedAccount?.sentiment_score    ?? null;

      return {
        accountId: accId,
        accountName,
        latestSubject: latest.subject,
        latestDate: latest.sent_at ? new Date(latest.sent_at).toLocaleDateString() : 'Unknown',
        totalMsgs: msgs.length,
        msgs: msgs.reverse(),
        isSearchMatch,
        latestIntent,
        latestSentimentCategory,
        latestSentimentScore,
        latestKeywords,
        latestSentiment: latestIntent,
      };
    }).filter(t => t.isSearchMatch);
  }, [emailsRaw, accounts, search]);

  const selectedEmailThread = useMemo(() => {
    if (!selectedAccountId) return null;
    return emailThreads.find(t => t.accountId === selectedAccountId);
  }, [selectedAccountId, emailThreads]);

  // ========== WHATSAPP LOGIC ==========
  const waRaw = (waDataRes as any)?.conversations ?? [];
  const waThreads = useMemo(() => {
    const phoneMap = new Map<string, any[]>();
    waRaw.forEach((msg: any) => {
      const phone = msg.phone_number;
      if (!phone) return;
      if (!phoneMap.has(phone)) phoneMap.set(phone, []);
      phoneMap.get(phone)!.push(msg);
    });

    // Normalize: strip "whatsapp:" prefix, then keep only digits and leading "+"
    const normalizePhone = (p: string) => {
      const stripped = (p || "").replace(/^whatsapp:/i, "").trim();
      const digits = stripped.replace(/[^\d+]/g, "");
      // Remove leading + for digit-only comparison
      return digits.startsWith("+") ? digits.slice(1) : digits;
    };

    // Build a fast lookup: normalized digits → account
    const accountByPhone = new Map<string, any>();
    accounts.forEach((a: any) => {
      [a.primary_contact_phone, a.phone].forEach((p) => {
        if (p) accountByPhone.set(normalizePhone(p), a);
      });
    });

    return Array.from(phoneMap.entries()).map(([phone, msgs]) => {
      msgs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const latest = msgs[0];

      // Try phone-number match first, then metadata account_id fallback
      const normalizedPhone = normalizePhone(phone);
      let matchedAccount = accountByPhone.get(normalizedPhone);
      if (!matchedAccount && latest.metadata?.account_id) {
        matchedAccount = accounts.find((a: any) => a.id === latest.metadata.account_id);
      }

      const accountName = matchedAccount?.name || phone;
      const isSearchMatch = accountName.toLowerCase().includes(search.toLowerCase()) || phone.includes(search);
      return {
        phone,
        accountName,
        latestMessage: latest.message,
        latestDate: latest.created_at ? new Date(latest.created_at).toLocaleDateString() : 'Unknown',
        totalMsgs: msgs.length,
        msgs: msgs.reverse(),
        isSearchMatch
      };
    }).filter(t => t.isSearchMatch);
  }, [waRaw, accounts, search]);

  const selectedWaThread = useMemo(() => {
    if (!selectedPhone) return null;
    return waThreads.find(t => t.phone === selectedPhone);
  }, [selectedPhone, waThreads]);

  // Simulation Logic
  const [simulating, setSimulating] = useState(false);
  const [simText, setSimText] = useState("");

  const handleSimReply = async () => {
    if (!selectedAccountId || !simText.trim()) return;
    setSimulating(true);
    try {
      await emailApi.manualReply(selectedAccountId, simText, `Re: ${selectedEmailThread?.latestSubject || "Email"}`);
      setSimText("");
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      const detail = err?.detail || err?.message || "Unknown error";
      alert(`Simulation failed: ${detail}`);
    } finally {
      setSimulating(false);
    }
  };

  const [reanalyzingEmail, setReanalyzingEmail] = useState(false);

  const handleReanalyzeEmail = async () => {
    if (!selectedAccountId) return;
    setReanalyzingEmail(true);
    try {
      await emailApi.reanalyze(selectedAccountId);
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      const detail = err?.detail || err?.message || "Unknown error";
      alert(`Re-analyze failed: ${detail}`);
    } finally {
      setReanalyzingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b-2 border-black px-6 py-5 shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Sentiment Tracking
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">Analyze omni-channel interactions to gauge customer health.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search accounts..."
              className="pl-8 pr-4 py-2 text-sm bg-background border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/20 w-56 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-none"
            />
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 h-full">
        <Tabs defaultValue="voice">
          <TabsList className="bg-muted border-2 border-black p-1 space-x-1 rounded-lg">
            <TabsTrigger value="voice" className="data-[state=active]:bg-card data-[state=active]:border-black data-[state=active]:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] border-2 border-transparent transition-all rounded-md px-4 py-1.5 flex items-center gap-2">
              <Phone className="w-4 h-4" /> Voice Calls
            </TabsTrigger>
            <TabsTrigger value="email" className="data-[state=active]:bg-card data-[state=active]:border-black data-[state=active]:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] border-2 border-transparent transition-all rounded-md px-4 py-1.5 flex items-center gap-2">
              <Mail className="w-4 h-4" /> Email Threads
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="data-[state=active]:bg-card data-[state=active]:border-black data-[state=active]:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] border-2 border-transparent transition-all rounded-md px-4 py-1.5 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </TabsTrigger>
          </TabsList>

          {/* VOICE TAB */}
          <TabsContent value="voice" className="pt-4 space-y-4">
            <div className="flex bg-muted rounded-lg p-0.5 border-2 border-black w-max">
              {(['all', 'picked_up', 'missed'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setOutcomeFilter(filter as any)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${outcomeFilter === filter ? 'bg-card text-foreground shadow-sm border-2 border-black' : 'text-muted-foreground hover:text-foreground bg-transparent border-transparent'}`}
                >
                  {filter === 'all' ? 'All' : filter.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
            <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b-2 border-black">
                  <tr className="text-[11px] uppercase text-muted-foreground font-medium tracking-wider text-left">
                    <th className="pl-5 py-3">Account</th>
                    <th className="py-3">Time</th>
                    <th className="text-center py-3">Duration</th>
                    <th className="text-center py-3">Status</th>
                    <th className="text-center py-3">Sentiment</th>
                    <th className="text-center py-3 pr-5">Retries</th>
                  </tr>
                </thead>
                <tbody>
                  {isVoiceLoading ? (
                    <tr className="border-b-2 border-black"><td colSpan={6} className="text-center py-12">
                      <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
                    </td></tr>
                  ) : voiceError ? (
                    <tr className="border-b-2 border-black"><td colSpan={6} className="p-0">
                      <EmptyState title="Failed to load voice calls" message="Could not load data." icon={<Phone size={40} className="text-muted-foreground/40" />} />
                    </td></tr>
                  ) : filteredVoice.length === 0 ? (
                    <tr className="border-b-2 border-black"><td colSpan={6} className="p-0">
                      <EmptyState title="No Voice Calls" message="Voice data will appear here." icon={<Phone size={40} className="text-muted-foreground/40" />} />
                    </td></tr>
                  ) : (
                    filteredVoice.map((call) => (
                      <tr key={call.id} onClick={() => openCallDetail(call.id)} className="hover:bg-muted/20 transition-colors group border-b-2 border-black cursor-pointer">
                        <td className="pl-5 py-3.5 font-medium text-foreground group-hover:text-primary transition-colors">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center border-2 border-black">
                              <Phone size={12} className="text-primary" />
                            </div>
                            {call.account_name}
                          </div>
                        </td>
                        <td className="py-3.5 text-xs text-muted-foreground">{call.date}</td>
                        <td className="text-center py-3.5 text-sm font-medium text-foreground">{call.duration}</td>
                        <td className="text-center py-3.5">
                          {(() => {
                            const rawOutcome = (call.outcome || "").toString();
                            let effectiveOutcome = rawOutcome || "not_picked";
                            if (rawOutcome === "picked_up" && !isTrulyPickedUp(call)) effectiveOutcome = "not_picked";
                            const label = effectiveOutcome.replace("_", " ");
                            const badgeClass =
                              effectiveOutcome === "picked_up" ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive";
                            return <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border-2 border-black ${badgeClass}`}>{label}</span>;
                          })()}
                        </td>
                        <td className="text-center py-3.5 text-base">
                          {call.sentiment === "positive" ? "😊" : call.sentiment === "neutral" ? "😐" : "😟"}
                        </td>
                        <td className="text-center py-3.5 text-sm text-foreground pr-5">{call.retry_count}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* EMAIL TAB */}
          <TabsContent value="email" className="pt-4 space-y-4">
            <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b-2 border-black">
                  <tr className="text-[11px] uppercase text-muted-foreground font-medium tracking-wider text-left">
                    <th className="pl-5 py-3">Account</th>
                    <th className="py-3">Latest Activity</th>
                    <th className="text-center py-3">Interactions</th>
                    <th className="text-center py-3">Intent</th>
                    <th className="text-center py-3 pr-5">Action Taken</th>
                  </tr>
                </thead>
                <tbody>
                  {isEmailLoading ? (
                    <tr className="border-b-2 border-black"><td colSpan={5} className="text-center py-12">
                      <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
                    </td></tr>
                  ) : emailThreads.length === 0 ? (
                    <tr className="border-b-2 border-black"><td colSpan={5} className="p-0">
                      <EmptyState title="No Email Threads" message="Send campaigns or receive replies to see them here." icon={<Mail size={40} className="text-muted-foreground/40" />} />
                    </td></tr>
                  ) : (
                    emailThreads.map((thread) => {
                      const cat = (thread.latestSentimentCategory || "").toLowerCase();
                      const sentCfg: Record<string, { emoji: string; label: string }> = {
                        positive:      { emoji: "😊", label: "Positive" },
                        very_positive: { emoji: "🤩", label: "Very Positive" },
                        negative:      { emoji: "😟", label: "Negative" },
                        very_negative: { emoji: "😡", label: "Very Negative" },
                        neutral:       { emoji: "😐", label: "Neutral" },
                      };
                      const sentInfo = sentCfg[cat] ?? null;

                      // Calculate Action Taken safely
                      let rawIntentStr = "";
                      if (typeof thread.latestIntent === "string") {
                        rawIntentStr = thread.latestIntent;
                      } else if (Array.isArray(thread.latestIntent)) {
                        rawIntentStr = String(thread.latestIntent[0] || "");
                      } else if (typeof thread.latestIntent === "object" && thread.latestIntent !== null) {
                        rawIntentStr = String(thread.latestIntent.intent || "");
                      } else {
                        rawIntentStr = String(thread.latestIntent || "");
                      }
                      const intentStr = rawIntentStr.toLowerCase();
                      const intentKey = intentStr.replace(/-/g, "_");
                      const ACTION_MAP: Record<string, { label: string; emoji: string; cls: string }> = {
                        renewed:              { label: "Marked Renewed",     emoji: "✅", cls: "bg-emerald-500/10 text-emerald-700" },
                        churned:              { label: "Marked At Risk",     emoji: "🚨", cls: "bg-destructive/10 text-destructive" },
                        not_interested_churn: { label: "Marked At Risk",     emoji: "🚨", cls: "bg-destructive/10 text-destructive" },
                        not_interested:       { label: "Marked At Risk",     emoji: "🚨", cls: "bg-destructive/10 text-destructive" },
                        renew_afterwards:     { label: "Follow-up Scheduled",emoji: "📅", cls: "bg-blue-500/10 text-blue-700" },
                        needs_followup:       { label: "Follow-up in 1 Day", emoji: "🔔", cls: "bg-yellow-500/10 text-yellow-700" },
                        objection_no_money:   { label: "Follow-up Scheduled",emoji: "📅", cls: "bg-amber-500/10 text-amber-700" },
                        interested:           { label: "Contact Updated",    emoji: "📌", cls: "bg-sky-500/10 text-sky-700" },
                      };
                      const sysAction = ACTION_MAP[intentKey];

                      // Pull score & keywords from the inbound reply message metadata
                      const inbound = thread.msgs.find(
                        (m: any) => m.status === 'received' || m.metadata?.direction === 'inbound'
                      );
                      const sentScore: number | null =
                        inbound?.metadata?.sentiment_score ?? thread.msgs[thread.msgs.length - 1]?.metadata?.sentiment_score ?? null;
                      const sentKeywords: string[] =
                        inbound?.metadata?.keywords ?? thread.msgs[thread.msgs.length - 1]?.metadata?.keywords ?? [];

                      return (
                        <tr key={thread.accountId} onClick={() => openEmailThread(thread.accountId)} className="hover:bg-muted/20 transition-colors group border-b-2 border-black cursor-pointer">
                          <td className="pl-5 py-3.5 font-medium text-foreground group-hover:text-primary transition-colors">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center border-2 border-black">
                                <Mail size={12} className="text-primary" />
                              </div>
                              <div>
                                <div className="font-bold">{thread.accountName}</div>
                                <div className="text-[11px] text-muted-foreground line-clamp-1">{thread.latestSubject || "No subject"}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 text-xs text-muted-foreground">{thread.latestDate}</td>
                          <td className="text-center py-3.5 text-sm font-medium text-foreground">{thread.totalMsgs}</td>


                          {/* Intent column */}
                          <td className="text-center py-3.5">
                            <SentimentBadge intent={thread.latestIntent} />
                          </td>

                          {/* Action Taken column */}
                          <td className="text-center py-3.5 pr-5">
                            {sysAction ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border-2 border-black ${sysAction.cls}`}>
                                {sysAction.emoji} {sysAction.label}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* WHATSAPP TAB */}
          <TabsContent value="whatsapp" className="pt-4 space-y-4">
            <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b-2 border-black">
                  <tr className="text-[11px] uppercase text-muted-foreground font-medium tracking-wider text-left">
                    <th className="pl-5 py-3">Account / Phone</th>
                    <th className="py-3">Latest Message</th>
                    <th className="text-center py-3">Interactions</th>
                    <th className="text-center py-3">Sentiment</th>
                    <th className="text-center py-3 pr-5">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {isWaLoading ? (
                    <tr className="border-b-2 border-black"><td colSpan={4} className="text-center py-12">
                      <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
                    </td></tr>
                  ) : waThreads.length === 0 ? (
                    <tr className="border-b-2 border-black"><td colSpan={4} className="p-0">
                      <EmptyState title="No WhatsApp Threads" message="WhatsApp conversations will appear here." icon={<MessageCircle size={40} className="text-muted-foreground/40" />} />
                    </td></tr>
                  ) : (
                    waThreads.map((thread) => (
                      <tr key={thread.phone} onClick={() => setSelectedPhone(thread.phone)} className="hover:bg-muted/20 transition-colors group border-b-2 border-black cursor-pointer">
                        <td className="pl-5 py-3.5 font-medium text-foreground group-hover:text-primary transition-colors">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center border-2 border-black">
                              <MessageCircle size={12} className="text-primary" />
                            </div>
                            <div>
                              <div className="font-bold">{thread.accountName}</div>
                              <div className="text-[11px] text-muted-foreground">{thread.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 text-xs text-muted-foreground max-w-xs truncate">{thread.latestMessage}</td>
                        <td className="text-center py-3.5 text-sm font-medium text-foreground">{thread.totalMsgs}</td>
                        <td className="text-center py-3.5">
                          <SentimentBadge intent={thread.msgs[thread.msgs.length - 1]?.metadata?.detected_intent} />
                        </td>
                        <td className="text-center py-3.5 pr-5 text-xs text-muted-foreground">{thread.latestDate}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ───────── Voice Call Dialog ───────── */}
      <Dialog open={!!selectedCallId} onOpenChange={(open) => !open && closeCallDetail()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center justify-between gap-4">
              <span className="font-black uppercase tracking-tight">Call Details</span>
              <Button variant="ghost" size="icon" onClick={closeCallDetail} className="h-8 w-8 rounded-lg border-2 border-black">
                <X size={14} />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 overflow-y-auto min-h-0 pb-2">
            {detailLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-8 animate-spin text-primary" />
              </div>
            ) : callDetail ? (
              <div className="space-y-4">

                {/* ── Status row ── */}
                <div className="flex gap-2 text-xs text-muted-foreground flex-wrap">
                  <span className="px-2 py-0.5 rounded-full border-2 border-black bg-muted font-bold text-foreground capitalize">
                    {callDetail.outcome.replace(/_/g, ' ')}
                  </span>
                  <span className="flex items-center">{callDetail.date}</span>
                  {callDetail.duration && callDetail.duration !== "—" && (
                    <span className="flex items-center">⏱ {callDetail.duration}</span>
                  )}
                </div>

                {/* ── Sentiment Analysis Panel ── */}
                <SentimentPanel detail={callDetail} />

                {/* ── Call Summary ── */}
                {callDetail.summary && (
                  <div>
                    <h3 className="text-xs font-black uppercase text-muted-foreground mb-1.5">Call Summary</h3>
                    <div className="p-3 border-2 border-black rounded-lg bg-muted text-sm leading-relaxed">
                      {callDetail.summary}
                    </div>
                  </div>
                )}

                {/* ── Transcript ── */}
                <div>
                  <h3 className="text-xs font-black uppercase text-muted-foreground mb-1.5">Transcript</h3>
                  <div className="bg-muted/30 border-2 border-black rounded-lg p-3 max-h-[260px] overflow-y-auto font-mono text-xs whitespace-pre-wrap leading-relaxed">
                    {callDetail.transcript
                      ? callDetail.transcript.split('\n').map((line, i) => {
                          const isAgent = line.trim().startsWith('Agent:');
                          const isUser  = line.trim().startsWith('User:');
                          return (
                            <div key={i} className={`mb-1 ${isAgent ? 'text-primary' : isUser ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                              {line}
                            </div>
                          );
                        })
                      : <span className="text-muted-foreground">No transcript available</span>
                    }
                  </div>
                </div>

              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Could not load call details.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ───────── Email Thread Dialog ───────── */}
      <Dialog open={!!selectedAccountId} onOpenChange={(open) => !open && setSelectedAccountId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center justify-between gap-4">
              <span className="font-black uppercase tracking-tight">Email Thread — {selectedEmailThread?.accountName}</span>
              <Button variant="ghost" size="icon" onClick={() => setSelectedAccountId(null)} className="h-8 w-8 rounded-lg border-2 border-black"><X size={14} /></Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 overflow-y-auto min-h-0 p-4 rounded-lg flex-1">
            {/* ── Thread Overview Sentiment ── */}
            {selectedEmailThread && (
              <div className="mb-2 shrink-0 space-y-2">
                <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Sentiment Analysis</h3>
                {emailSentimentLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <SentimentPanel detail={{
                    sentiment_category: emailSentimentDetail?.sentiment_category ?? selectedEmailThread?.latestSentimentCategory ?? null,
                    sentiment_score:    emailSentimentDetail?.sentiment_score    ?? selectedEmailThread?.latestSentimentScore    ?? null,
                    keywords:           emailSentimentDetail?.keywords           ?? selectedEmailThread?.latestKeywords           ?? [],
                  }} />
                )}
              </div>
            )}
            
            <div className="bg-muted/20 border-2 border-black rounded-lg p-4 flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase text-muted-foreground">Email Thread History</h3>
              {selectedEmailThread?.msgs.map((msg: any) => {
              const isUser = msg.status === 'received' || msg.metadata?.direction === 'inbound';
              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
                  <div className={`max-w-[85%] border-2 border-black rounded-xl p-4 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${isUser ? 'bg-primary/20' : 'bg-card'}`}>
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">{isUser ? "Customer Reply" : "AI Agent"}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(msg.sent_at).toLocaleString()}</span>
                    </div>
                    <h4 className="font-bold text-sm mb-1">{msg.subject}</h4>
                    <div className="text-xs text-foreground whitespace-pre-wrap break-words">{msg.body}</div>
                    {msg.metadata?.detected_intent && (
                      <div className="mt-3 text-[10px] font-bold uppercase text-primary border-t border-black/10 pt-2">
                        Detected Intent: {
                          typeof msg.metadata.detected_intent === 'string' 
                            ? msg.metadata.detected_intent 
                            : Array.isArray(msg.metadata.detected_intent) 
                              ? msg.metadata.detected_intent[0] 
                              : (msg.metadata.detected_intent.intent || JSON.stringify(msg.metadata.detected_intent))
                        }
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
          <div className="pt-4 border-t-2 border-black mt-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Simulate a customer reply..."
                className="flex-1 bg-background border-2 border-black rounded-lg px-3 py-2 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSimReply()}
              />
              <Button
                onClick={handleSimReply}
                disabled={simulating || !simText.trim()}
                className="bg-primary text-primary-foreground border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
              >
                {simulating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simulate Reply"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ───────── WhatsApp Thread Dialog ───────── */}
      <Dialog open={!!selectedPhone} onOpenChange={(open) => !open && setSelectedPhone(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center justify-between gap-4">
              <span className="font-black uppercase tracking-tight">WhatsApp Thread — {selectedWaThread?.accountName}</span>
              <Button variant="ghost" size="icon" onClick={() => setSelectedPhone(null)} className="h-8 w-8 rounded-lg border-2 border-black"><X size={14} /></Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 overflow-y-auto min-h-0 bg-muted/20 p-4 rounded-lg flex-1">
            {selectedWaThread?.msgs.map((msg: any) => {
              const isUser = msg.direction === 'user';
              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
                  <div className={`max-w-[70%] border-2 border-black rounded-xl p-3 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${isUser ? 'bg-emerald-100' : 'bg-card'}`}>
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">{isUser ? "Customer" : "AI Agent"}</span>
                      <span className="text-[9px] text-muted-foreground">{new Date(msg.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap break-words">{msg.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
