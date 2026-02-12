import { useState } from "react";
import { DollarSign, TrendingUp, BarChart3, Target } from "lucide-react";
import { opportunities, formatCurrency } from "@/data/mockData";

const typeBadge: Record<string, { label: string; bgColor: string; textColor: string }> = {
  renewal: { label: "Renewal", bgColor: "bg-blue-600", textColor: "text-white" },
  upsell: { label: "Upsell", bgColor: "bg-purple-600", textColor: "text-white" },
  cross_sell: { label: "Cross-sell", bgColor: "bg-cyan-600", textColor: "text-white" },
};

export default function Opportunities() {
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = opportunities.filter((o) => typeFilter === "all" || o.type === typeFilter);

  const totalPipeline = opportunities.reduce((s, o) => s + o.value, 0);
  const weightedValue = opportunities.reduce((s, o) => s + o.value * (o.probability / 100), 0);
  const avgDeal = totalPipeline / opportunities.length;
  const conversionRate = Math.round(
    (opportunities.filter((o) => o.stage === "closed_won").length / opportunities.length) * 100
  ) || 15;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-foreground tracking-tight">Opportunities</h1>

      {/* NB-Style Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Pipeline', value: formatCurrency(totalPipeline), icon: <DollarSign size={20} />, color: 'text-black', borderColor: 'border-b-black', iconBg: 'bg-black' },
          { label: 'Weighted Value', value: formatCurrency(weightedValue), icon: <BarChart3 size={20} />, color: 'text-purple-600', borderColor: 'border-b-purple-600', iconBg: 'bg-purple-600' },
          { label: 'Avg Deal Size', value: formatCurrency(avgDeal), icon: <TrendingUp size={20} />, color: 'text-emerald-600', borderColor: 'border-b-emerald-600', iconBg: 'bg-emerald-600' },
          { label: 'Conversion Rate', value: `${conversionRate}%`, icon: <Target size={20} />, color: 'text-blue-600', borderColor: 'border-b-blue-600', iconBg: 'bg-blue-600' }
        ].map((metric, idx) => (
          <div key={idx} className={`p-4 bg-white dark:bg-gray-800 border-2 border-black dark:border-white border-b-[6px] ${metric.borderColor.replace('border-b-', 'border-b-')} flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] transition-transform hover:-translate-y-0.5`}>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-widest">{metric.label}</p>
              <div className={`text-3xl font-mono font-bold mt-1 ${metric.color} dark:text-white`}>{metric.value}</div>
            </div>
            <div className={`p-2 border-2 border-black dark:border-white ${metric.iconBg} text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]`}>
              {metric.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'renewal', 'upsell', 'cross_sell'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setTypeFilter(filter)}
            className={`px-4 py-1.5 text-xs font-bold uppercase border-2 border-black dark:border-white transition-all duration-200
              ${typeFilter === filter
                ? 'bg-indigo-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]'
                : 'bg-white dark:bg-gray-800 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[1px] hover:translate-y-[1px]'
              }`}
          >
            {filter === 'all' ? 'ALL' : filter.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border-2 border-black dark:border-white bg-white dark:bg-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]">
        <table className="w-full text-sm">
          <thead className="bg-indigo-600 border-b-2 border-black dark:border-white">
            <tr className="text-xs uppercase text-white font-black tracking-wide">
              <th className="text-left pl-4 py-3">Account</th>
              <th className="text-center py-3">Type</th>
              <th className="text-right py-3">Value</th>
              <th className="text-center py-3">Probability</th>
              <th className="text-center py-3">Stage</th>
              <th className="text-center py-3 pr-4">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/10">
            {filtered.map((opp) => (
              <tr key={opp.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <td className="pl-4 py-3 font-bold text-black dark:text-white">{opp.accountName}</td>
                <td className="text-center py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase border-2 border-black ${typeBadge[opp.type].bgColor} ${typeBadge[opp.type].textColor} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                    {typeBadge[opp.type].label}
                  </span>
                </td>
                <td className="text-right py-3 font-mono text-gray-700 dark:text-gray-300">{formatCurrency(opp.value)}</td>
                <td className="text-center py-3 font-mono text-gray-700 dark:text-gray-300">{opp.probability}%</td>
                <td className="text-center py-3 text-xs uppercase font-bold text-gray-600 dark:text-gray-400">{opp.stage.replace('_', ' ')}</td>
                <td className="text-center py-3 text-xs text-gray-600 dark:text-gray-400 pr-4">{opp.createdDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
