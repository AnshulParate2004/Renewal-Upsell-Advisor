import { useState, useMemo } from "react";
import { Search, Phone, History, ShieldCheck, Loader2 } from "lucide-react";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
// TODO: Create API hook for voice calls when backend endpoint is available
// import { useVoiceCalls } from "@/hooks/useVoiceCalls";

export default function Calls() {
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  
  // TODO: Replace with API call when voice calls endpoint is available
  const voiceCalls: any[] = [];
  const isLoading = false;

  const filtered = useMemo(() => {
    return voiceCalls
      .filter((c) => c.accountName?.toLowerCase().includes(search.toLowerCase()))
      .filter((c) => outcomeFilter === "all" || c.outcome === outcomeFilter);
  }, [voiceCalls, search, outcomeFilter]);

  return (
    <PageContainer className="min-h-screen">
      <PageHeader
        title="Voice Operations"
        subtitle="Asynchronous Voice Path Intelligence & Sentiment Analysis"
        badge="Secure Comms V4"
        actions={
          <div className="flex items-center gap-4">
            <div className="text-sm italic text-accent font-bold">Recording Active</div>
          </div>
        }
      />

      {/* Controls */}
      <div className="flex items-center justify-between gap-6 bg-white p-4 border-4 border-foreground rounded-lg">
        <div className="flex items-center gap-6 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by account..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-foreground rounded-lg text-sm font-black focus:outline-none focus:bg-primary/5 transition-all uppercase tracking-wider"
            />
          </div>
          <div className="h-8 w-1 bg-foreground rounded-full" />
          <div className="flex gap-2">
            {(['all', 'picked_up', 'missed', 'retry'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setOutcomeFilter(filter)}
                className={`px-4 py-2 text-xs font-black border-2 border-foreground rounded-lg transition-all uppercase tracking-wider ${outcomeFilter === filter ? 'bg-primary text-white' : 'bg-white text-foreground hover:bg-accent/10'}`}
              >
                {filter === 'all' ? 'All Calls' : filter.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="paper-card table-container flex-1 overflow-hidden flex flex-col bg-white p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-foreground/60 font-black uppercase tracking-wider">Loading voice calls...</span>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            variant="default"
            title="No Voice Calls Available"
            message="Voice call data will appear here when available."
            icon={<Phone size={48} className="text-foreground/40" />}
          />
        ) : (
          <>
            <div className="overflow-auto flex-1 relative custom-scrollbar">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-accent border-b-4 border-foreground">
                  <tr className="text-[10px] uppercase text-white font-black tracking-widest text-left">
                    <th className="pl-8 py-4">Account</th>
                    <th className="py-4">Time</th>
                    <th className="text-center py-4">Duration</th>
                    <th className="text-center py-4">Status</th>
                    <th className="text-center py-4">Sentiment</th>
                    <th className="text-center py-4 pr-8">Retries</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-foreground">
                  {filtered.map((call) => (
                    <tr key={call.id} className="hover:bg-primary/10 transition-colors group">
                      <td className="pl-8 py-4 font-black text-foreground group-hover:text-primary transition-colors flex items-center gap-3">
                        <div className="p-2 bg-purple-50 border-2 border-foreground rounded-lg group-hover:bg-primary/10 transition-colors" style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}>
                          <Phone size={14} className="text-primary" />
                        </div>
                        <span className="uppercase tracking-wide">{call.accountName}</span>
                      </td>
                      <td className="py-4 text-[10px] text-foreground/60 font-black uppercase">{call.date}</td>
                      <td className="text-center py-4 font-black text-foreground">{call.duration}</td>
                      <td className="text-center py-4">
                        <div className={`px-2.5 py-1 border-2 border-foreground rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex ${call.outcome === 'picked_up' ? 'bg-success/10 text-success' : call.outcome === 'missed' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`} style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}>
                          {call.outcome.replace('_', ' ').toUpperCase()}
                        </div>
                      </td>
                      <td className="text-center py-4">
                        {call.sentiment ? (
                          <div className="flex items-center justify-center gap-2 bg-white py-1 px-2 border-2 border-foreground rounded-lg inline-flex mx-auto" style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}>
                            <span className="text-lg">{call.sentiment === "positive" ? "😊" : call.sentiment === "neutral" ? "😐" : "😟"}</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${call.sentiment === 'positive' ? 'text-success' : call.sentiment === 'neutral' ? 'text-foreground/60' : 'text-red-600'}`}>{call.sentiment}</span>
                          </div>
                        ) : <span className="text-foreground/40 font-black text-xs uppercase">N/A</span>}
                      </td>
                      <td className="text-center py-4 font-black text-xs pr-8 text-foreground">{call.retryCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-4 bg-accent border-t-4 border-foreground flex justify-between items-center text-[10px] font-black text-white uppercase tracking-widest rounded-b-lg">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-success border border-foreground rounded-full animate-pulse" style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}></span>
                SYNC STATUS: {filtered.length} / {voiceCalls.length} AUDIT LOGS
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <History size={12} />
                  <span>Retention 90d</span>
                </div>
                <div className="px-3 py-1 bg-white border-2 border-foreground rounded-lg text-foreground font-black" style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}>Sorted by Recency</div>
              </div>
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}
