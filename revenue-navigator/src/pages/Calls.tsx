import { useState } from "react";
import { Search, Phone, History, ShieldCheck } from "lucide-react";
import { voiceCalls } from "@/data/mockData";

export default function Calls() {
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("all");

  const filtered = voiceCalls
    .filter((c) => c.accountName.toLowerCase().includes(search.toLowerCase()))
    .filter((c) => outcomeFilter === "all" || c.outcome === outcomeFilter);

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen flex flex-col space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-5xl font-bold text-foreground tracking-tight leading-none">
            Voice <span className="text-primary">Operations</span>
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-2">
            Asynchronous Voice Path Intelligence & Sentiment Analysis
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm italic text-accent font-medium">Recording Active</div>
          <div className="sticker-outline px-4 py-2 text-primary border-primary/20 bg-primary/5 flex items-center gap-2">
            <ShieldCheck size={16} />
            Secure Comms V4
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-6 bg-white p-4 rounded-xl border border-purple-100 shadow-sm shadow-purple-900/5">
        <div className="flex items-center gap-6 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by account..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div className="h-8 w-px bg-gray-100" />
          <div className="flex gap-2">
            {(['all', 'picked_up', 'missed', 'retry'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setOutcomeFilter(filter)}
                className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${outcomeFilter === filter ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                {filter === 'all' ? 'All Calls' : filter.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="paper-card flex-1 overflow-hidden flex flex-col bg-white border border-gray-200 p-0 shadow-xl shadow-purple-900/5">
        <div className="overflow-auto flex-1 relative custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-primary/5 border-b border-gray-100">
              <tr className="text-[10px] uppercase text-gray-500 font-bold tracking-widest text-left">
                <th className="pl-8 py-4">Account</th>
                <th className="py-4">Time</th>
                <th className="text-center py-4">Duration</th>
                <th className="text-center py-4">Status</th>
                <th className="text-center py-4">Sentiment</th>
                <th className="text-center py-4 pr-8">Retries</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((call) => (
                <tr key={call.id} className="hover:bg-purple-50/50 transition-colors group">
                  <td className="pl-8 py-4 font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-primary/10 transition-colors">
                      <Phone size={14} className="text-primary" />
                    </div>
                    {call.accountName}
                  </td>
                  <td className="py-4 text-[10px] text-gray-500 font-semibold">{call.date}</td>
                  <td className="text-center py-4 font-semibold text-gray-700">{call.duration}</td>
                  <td className="text-center py-4">
                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${call.outcome === 'picked_up' ? 'bg-success/10 text-success' : call.outcome === 'missed' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                      {call.outcome.replace('_', ' ').toUpperCase()}
                    </div>
                  </td>
                  <td className="text-center py-4">
                    {call.sentiment ? (
                      <div className="flex items-center justify-center gap-2 bg-background/50 py-1 px-2 rounded-lg border border-purple-50 inline-flex mx-auto">
                        <span className="text-lg">{call.sentiment === "positive" ? "😊" : call.sentiment === "neutral" ? "😐" : "😟"}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${call.sentiment === 'positive' ? 'text-success' : call.sentiment === 'neutral' ? 'text-gray-400' : 'text-red-600'}`}>{call.sentiment}</span>
                      </div>
                    ) : <span className="text-gray-300 font-bold text-xs">N/A</span>}
                  </td>
                  <td className="text-center py-4 font-bold text-xs pr-8 text-gray-400">{call.retryCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
            SYNC STATUS: {filtered.length} / {voiceCalls.length} AUDIT LOGS
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <History size={12} />
              <span>Retention 90d</span>
            </div>
            <div className="px-3 py-1 bg-white border border-gray-200 rounded text-gray-500 shadow-sm">Sorted by Recency</div>
          </div>
        </div>
      </div>
    </div>
  );
}
