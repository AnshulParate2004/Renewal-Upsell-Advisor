import { useState, useMemo } from "react";
import { Search, Phone, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/ui/EmptyState";
import { voiceApi, type VoiceCallRow } from "@/lib/api/voice";

export default function Calls() {
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["voice-calls"],
    queryFn: () => voiceApi.getCalls(0, 200),
  });

  const voiceCalls: VoiceCallRow[] = data?.calls ?? [];

  const filtered = useMemo(() => {
    return voiceCalls
      .filter((c) => c.account_name?.toLowerCase().includes(search.toLowerCase()))
      .filter((c) => outcomeFilter === "all" || c.outcome === outcomeFilter);
  }, [voiceCalls, search, outcomeFilter]);

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

      <div className="p-6">
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
                  <tr key={call.id} className="hover:bg-muted/20 transition-colors group border-b-2 border-black">
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
    </div>
  );
}
