import { useState } from "react";
import { DollarSign, TrendingUp, BarChart3, Target, Briefcase, Zap } from "lucide-react";
import { opportunities, formatCurrency } from "@/data/mockData";
import AnimatedCard from "@/components/ui/AnimatedCard";

const typeBadge: Record<string, { label: string; bgColor: string }> = {
  renewal: { label: "RENEWAL", bgColor: "bg-primary" },
  upsell: { label: "UPSELL", bgColor: "bg-accent" },
  cross_sell: { label: "CROSS_SELL", bgColor: "bg-foreground" },
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
    <div className="p-6 max-w-[1600px] mx-auto h-[calc(100vh-64px)] flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-5xl font-bold text-foreground tracking-tight leading-none">
            Growth <span className="text-primary">Pipeline</span>
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-2">
            Strategic Opportunity Management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm italic text-accent">High Velocity!</div>
          <div className="sticker-outline px-4 py-2 text-sm flex items-center gap-2">
            <Zap size={16} className="text-primary" />
            LIVE PIPELINE FEED
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pipeline Total', value: formatCurrency(totalPipeline), icon: <DollarSign size={20} />, iconBg: 'bg-primary' },
          { label: 'Weighted Forecast', value: formatCurrency(weightedValue), icon: <BarChart3 size={20} />, iconBg: 'bg-accent' },
          { label: 'Avg Deal Index', value: formatCurrency(avgDeal), icon: <TrendingUp size={20} />, iconBg: 'bg-white' },
          { label: 'Closer Ratio', value: `${conversionRate}%`, icon: <Target size={20} />, iconBg: 'bg-white' }
        ].map((metric, idx) => (
          <AnimatedCard
            key={idx}
            delay={idx * 0.05}
            className={`paper-card p-5 flex flex-col justify-between group bg-white`}
          >
            <div className="flex justify-between items-start mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase">{metric.label}</p>
              <div className={`p-2 rounded-lg ${metric.iconBg} ${metric.iconBg === 'bg-white' ? 'text-foreground border border-gray-200' : 'text-white'} shadow-sm`}>
                {metric.icon}
              </div>
            </div>
            <div className="text-3xl font-bold tracking-tight text-foreground">
              {metric.value}
            </div>
          </AnimatedCard>
        ))}
      </div>

      {/* Filters & Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'renewal', 'upsell', 'cross_sell'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTypeFilter(filter)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${typeFilter === filter ? 'bg-primary text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
            >
              {filter === 'all' ? 'All Types' : filter.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
        <button className="px-4 py-2 bg-accent text-white rounded-lg font-semibold text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2 group">
          <Briefcase size={16} className="group-hover:scale-110 transition-transform" />
          New Opportunity
        </button>
      </div>

      {/* Table */}
      <div className="paper-card overflow-hidden bg-white border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-primary border-b border-gray-200">
            <tr className="text-xs uppercase text-white font-semibold text-left">
              <th className="pl-6 py-4">Account</th>
              <th className="text-center py-4">Type</th>
              <th className="text-right py-4">Value</th>
              <th className="text-center py-4">Probability</th>
              <th className="text-center py-4">Stage</th>
              <th className="text-center py-4 pr-6">Created Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((opp) => (
              <tr key={opp.id} className="hover:bg-purple-50 transition-colors group">
                <td className="pl-6 py-4 font-bold text-foreground group-hover:text-primary transition-colors">{opp.accountName}</td>
                <td className="text-center py-4">
                  <div className={`sticker inline-flex py-1 px-3 text-xs text-white ${typeBadge[opp.type].bgColor} shadow-sm`}>
                    {typeBadge[opp.type].label}
                  </div>
                </td>
                <td className="text-right py-4 font-semibold text-foreground">{formatCurrency(opp.value)}</td>
                <td className="text-center py-4">
                  <div className="w-24 h-3 border border-gray-200 bg-gray-100 rounded-full inline-block relative overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${opp.probability}%` }}
                    ></div>
                    <span className="absolute -top-5 right-0 text-xs font-semibold text-gray-600">{opp.probability}%</span>
                  </div>
                </td>
                <td className="text-center py-4 text-xs font-medium uppercase text-gray-600">{opp.stage.replace('_', ' ')}</td>
                <td className="text-center py-4 text-xs text-gray-500 pr-6">{opp.createdDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
