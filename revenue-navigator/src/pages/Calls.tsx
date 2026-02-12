import { useState } from "react";
import { Search } from "lucide-react";
import { voiceCalls } from "@/data/mockData";

const outcomeBadge: Record<string, { label: string; bgColor: string; textColor: string }> = {
  picked_up: { label: "✅ Picked Up", bgColor: "bg-emerald-600", textColor: "text-white" },
  missed: { label: "❌ Missed", bgColor: "bg-red-600", textColor: "text-white" },
  retry: { label: "🔄 Retry", bgColor: "bg-yellow-400", textColor: "text-black" },
  voicemail: { label: "⏸️ Voicemail", bgColor: "bg-gray-400", textColor: "text-white" },
};

export default function Calls() {
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("all");

  const filtered = voiceCalls
    .filter((c) => c.accountName.toLowerCase().includes(search.toLowerCase()))
    .filter((c) => outcomeFilter === "all" || c.outcome === outcomeFilter);

  return (
    <div className="p-4 max-w-[1600px] mx-auto h-[calc(100vh-64px)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Voice Calls</h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">CALL HISTORY & TRANSCRIPTS</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by account..."
              className="pl-8 pr-3 py-1.5 h-8 text-xs rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary w-64"
            />
          </div>
          <div className="h-8 w-[1px] bg-border mx-1" />
          <div className="flex gap-2">
            {(['all', 'picked_up', 'missed', 'retry'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setOutcomeFilter(filter)}
                className={`px-4 py-1.5 text-xs font-bold uppercase border-2 border-black dark:border-white transition-all duration-200
                  ${outcomeFilter === filter
                    ? 'bg-indigo-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]'
                    : 'bg-white dark:bg-gray-800 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[1px] hover:translate-y-[1px]'
                  }`}
              >
                {filter === 'all' ? 'ALL' : filter.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-2 border-black dark:border-white flex-1 overflow-hidden flex flex-col shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] bg-white dark:bg-gray-800">
        <div className="overflow-auto flex-1 relative custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-indigo-600 border-b-2 border-black dark:border-white shadow-sm">
              <tr className="text-xs uppercase text-white font-black tracking-wide">
                <th className="text-left pl-4 py-3">Account</th>
                <th className="text-left py-3">Date & Time</th>
                <th className="text-center py-3">Duration</th>
                <th className="text-center py-3">Outcome</th>
                <th className="text-center py-3">Sentiment</th>
                <th className="text-center py-3 pr-4">Retries</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/10">
              {filtered.map((call) => (
                <tr key={call.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="pl-4 py-3 font-bold text-black dark:text-white">{call.accountName}</td>
                  <td className="py-3 text-xs text-gray-600 dark:text-gray-400 font-mono">{call.date}</td>
                  <td className="text-center py-3 font-mono text-xs text-gray-700 dark:text-gray-300">{call.duration}</td>
                  <td className="text-center py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase border-2 border-black ${outcomeBadge[call.outcome].bgColor} ${outcomeBadge[call.outcome].textColor} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                      {outcomeBadge[call.outcome].label}
                    </span>
                  </td>
                  <td className="text-center py-3 text-sm">
                    {call.sentiment ? (
                      <span className="capitalize">{call.sentiment === "positive" ? "😊" : call.sentiment === "neutral" ? "😐" : "😟"} {call.sentiment}</span>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="text-center py-3 font-mono text-xs pr-4">{call.retryCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t-2 border-black dark:border-white p-2 bg-gray-50 dark:bg-gray-900 flex justify-between items-center text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">
          <span>Showing {filtered.length} of {voiceCalls.length} calls</span>
          <span>Recent First</span>
        </div>
      </div>
    </div>
  );
}
