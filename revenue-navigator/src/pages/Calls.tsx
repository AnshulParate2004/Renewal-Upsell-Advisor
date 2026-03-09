import { useState, useMemo } from "react";
import { Search, Phone, Loader2, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/ui/EmptyState";
import { voiceApi, type VoiceCallRow, type VoiceCallDetail } from "@/lib/api/voice";
import { useAccounts } from "@/hooks/useAccounts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function Calls() {
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [callDetail, setCallDetail] = useState<VoiceCallDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const { data: accounts = [] } = useAccounts();
  const accountIds = useMemo(() => new Set(accounts.map((a) => a.id)), [accounts]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["voice-calls"],
    queryFn: () => voiceApi.getCalls(0, 200),
  });

  const voiceCallsRaw: VoiceCallRow[] = data?.calls ?? [];
  const voiceCalls = useMemo(
    () => voiceCallsRaw.filter((c) => (c.account_id && accountIds.has(c.account_id)) || !c.account_id),
    [voiceCallsRaw, accountIds]
  );

  const filtered = useMemo(() => {
    return voiceCalls
      .filter((c) => c.account_name?.toLowerCase().includes(search.toLowerCase()))
      .filter((c) => outcomeFilter === "all" || c.outcome === outcomeFilter);
  }, [voiceCalls, search, outcomeFilter]);

  // Simple call statistics for the current filter
  const stats = useMemo(() => {
    if (filtered.length === 0) {
      return {
        total: 0,
        pickedUp: 0,
        pickRate: 0,
        avgDuration: 0,
      };
    }
    const total = filtered.length;
    const pickedUp = filtered.filter((c) => c.outcome === "picked_up").length;
    const pickRate = Math.round((pickedUp / total) * 100);
    const totalSeconds = filtered.reduce(
      (sum, c) => sum + (typeof c.duration_seconds === "number" ? c.duration_seconds : 0),
      0
    );
    const avgDuration = totalSeconds > 0 ? Math.round(totalSeconds / total) : 0;
    return { total, pickedUp, pickRate, avgDuration };
  }, [filtered]);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b-2 border-black px-6 py-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Voice Calls</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Voice intelligence & sentiment analysis</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by account..."
                className="pl-8 pr-4 py-2 text-sm bg-background border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/20 w-48 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-none"
              />
            </div>
            <div className="flex gap-0.5 bg-muted rounded-lg p-0.5 border-2 border-black">
              {(['all', 'picked_up', 'missed', 'retry'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setOutcomeFilter(filter)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${outcomeFilter === filter ? 'bg-card text-foreground shadow-sm border-2 border-black' : 'text-muted-foreground hover:text-foreground bg-transparent border-transparent'}`}
                >
                  {filter === 'all' ? 'All' : filter.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Call statistics for current filter */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card border-2 border-black rounded-lg p-3 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <p className="uppercase tracking-widest font-black text-muted-foreground mb-1">Total Calls</p>
            <p className="text-lg font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="bg-card border-2 border-black rounded-lg p-3 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <p className="uppercase tracking-widest font-black text-muted-foreground mb-1">Picked Up</p>
            <p className="text-lg font-bold text-foreground">{stats.pickedUp}</p>
          </div>
          <div className="bg-card border-2 border-black rounded-lg p-3 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <p className="uppercase tracking-widest font-black text-muted-foreground mb-1">Pick-up Rate</p>
            <p className="text-lg font-bold text-foreground">{stats.pickRate}%</p>
          </div>
          <div className="bg-card border-2 border-black rounded-lg p-3 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <p className="uppercase tracking-widest font-black text-muted-foreground mb-1">Avg Duration</p>
            <p className="text-lg font-bold text-foreground">
              {stats.avgDuration > 0 ? `${stats.avgDuration}s` : "—"}
            </p>
          </div>
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
              {isLoading ? (
                <tr className="border-b-2 border-black"><td colSpan={6} className="text-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
                </td></tr>
              ) : error ? (
                <tr className="border-b-2 border-black"><td colSpan={6} className="p-0">
                  <EmptyState
                    variant="default"
                    title="Failed to load voice calls"
                    message={error instanceof Error ? error.message : "Could not load data from the database."}
                    icon={<Phone size={40} className="text-muted-foreground/40" />}
                  />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr className="border-b-2 border-black"><td colSpan={6} className="p-0">
                  <EmptyState
                    variant="default"
                    title="No Voice Calls"
                    message={voiceCalls.length === 0 ? "Voice call data will appear here once calls are made (trigger from Manual Triggers)." : "No calls match the current filter."}
                    icon={<Phone size={40} className="text-muted-foreground/40" />}
                  />
                </td></tr>
              ) : (
                filtered.map((call) => (
                  <tr
                    key={call.id}
                    onClick={() => openCallDetail(call.id)}
                    className="hover:bg-muted/20 transition-colors group border-b-2 border-black cursor-pointer"
                  >
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
                      <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border-2 border-black ${call.outcome === 'picked_up' ? 'bg-emerald-500/10 text-emerald-600' : call.outcome === 'missed' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                        {call.outcome.replace('_', ' ')}
                      </span>
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
      </div>

      {/* Call detail dialog: full conversation + sentiment and why */}
      <Dialog open={!!selectedCallId} onOpenChange={(open) => !open && closeCallDetail()}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center justify-between gap-4">
              <span className="font-black uppercase tracking-tight">
                {callDetail?.account_name ?? "Call details"}
              </span>
              <Button variant="ghost" size="icon" onClick={closeCallDetail} className="h-8 w-8 rounded-lg border-2 border-black">
                <X size={14} />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 overflow-y-auto min-h-0">
            {detailLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : callDetail ? (
              <>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="text-muted-foreground">{callDetail.date}</span>
                  <span className="font-medium">{callDetail.duration}</span>
                  <span className={`px-2 py-0.5 rounded-full border-2 border-black font-medium ${callDetail.outcome === "picked_up" ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                    {callDetail.outcome.replace("_", " ")}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-black uppercase text-muted-foreground mb-2">Sentiment & why</h3>
                  <div className="bg-muted/50 border-2 border-black rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground">
                        {callDetail.sentiment_category === "positive" ? "😊 Positive" : callDetail.sentiment_category === "negative" ? "😟 Negative" : "😐 Neutral"}
                      </span>
                      {callDetail.sentiment_score != null && (
                        <span className="text-xs text-muted-foreground">
                          Score: {typeof callDetail.sentiment_score === "number" ? callDetail.sentiment_score.toFixed(2) : callDetail.sentiment_score} (-1 to 1)
                        </span>
                      )}
                    </div>
                    {callDetail.summary && (
                      <p className="text-sm text-foreground">{callDetail.summary}</p>
                    )}
                    {Array.isArray(callDetail.keywords) && callDetail.keywords.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold">Keywords: </span>
                        {callDetail.keywords.join(", ")}
                      </p>
                    )}
                    {!callDetail.summary && (!callDetail.keywords || callDetail.keywords.length === 0) && (
                      <p className="text-xs text-muted-foreground">No summary or keywords for this call.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black uppercase text-muted-foreground mb-2">Full conversation</h3>
                  <div className="bg-muted/30 border-2 border-black rounded-lg p-3 max-h-60 overflow-y-auto space-y-3">
                    {(() => {
                      const raw = (callDetail.transcript || "").trim();
                      if (!raw) return <p className="text-sm text-muted-foreground">No transcript available.</p>;
                      const lines = raw.split(/\n/).filter((l) => l.trim());
                      const turns: { role: "agent" | "user"; text: string }[] = [];
                      for (const line of lines) {
                        const agentMatch = /^Agent:\s*(.*)/i.exec(line);
                        const userMatch = /^User:\s*(.*)/i.exec(line);
                        if (agentMatch) turns.push({ role: "agent", text: agentMatch[1].trim() });
                        else if (userMatch) turns.push({ role: "user", text: userMatch[1].trim() });
                        else if (turns.length > 0) turns[turns.length - 1].text += " " + line.trim();
                        else turns.push({ role: "agent", text: line.trim() });
                      }
                      return turns.length > 0 ? (
                        turns.map((t, i) => (
                          <div
                            key={i}
                            className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-lg border-2 border-black px-3 py-2 text-sm shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                                t.role === "agent"
                                  ? "bg-primary/10 text-foreground border-primary/30"
                                  : "bg-muted text-foreground"
                              }`}
                            >
                              <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                                {t.role === "agent" ? "Agent" : "Customer"}
                              </span>
                              <p className="whitespace-pre-wrap break-words">{t.text}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm whitespace-pre-wrap break-words">{raw}</p>
                      );
                    })()}
                  </div>
                </div>
              </>
            ) : selectedCallId && !detailLoading ? (
              <p className="text-sm text-muted-foreground py-4">Could not load call details.</p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
