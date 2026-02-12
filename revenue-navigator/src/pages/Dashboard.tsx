import { Users, AlertTriangle, TrendingUp, DollarSign } from "lucide-react";
import {
  accounts, voiceCalls, opportunities, formatCurrency,
} from "@/data/mockData";

const totalArr = accounts.reduce((s, a) => s + a.arr, 0);
const churnRiskCount = accounts.filter((a) => a.riskScore >= 70).length;
const renewalRate = Math.round(
  (accounts.filter((a) => a.renewalStage === "renewed" || a.healthScore >= 70).length / accounts.length) * 100
);
const upsellPipeline = opportunities
  .filter((o) => o.type === "upsell" || o.type === "cross_sell")
  .reduce((s, o) => s + o.value, 0);

export default function Dashboard() {
  return (
    <div className="p-4 max-w-[1600px] mx-auto h-[calc(100vh-64px)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Revenue Navigator</h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">REAL-TIME PERFORMANCE OVERVIEW</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase text-muted-foreground bg-muted/10 px-2 py-1 rounded border border-border">Q1 2026</span>
        </div>
      </div>

      {/* NB-Style Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {[
          { label: 'Total ARR', value: formatCurrency(totalArr), icon: <DollarSign size={20} />, color: 'text-black', borderColor: 'border-b-black', iconBg: 'bg-black' },
          { label: 'Churn Risk', value: churnRiskCount, icon: <AlertTriangle size={20} />, color: 'text-red-600', borderColor: 'border-b-red-600', iconBg: 'bg-red-600' },
          { label: 'Renewal Rate', value: `${renewalRate}%`, icon: <TrendingUp size={20} />, color: 'text-emerald-600', borderColor: 'border-b-emerald-600', iconBg: 'bg-emerald-600' },
          { label: 'Upsell Pipeline', value: formatCurrency(upsellPipeline), icon: <Users size={20} />, color: 'text-blue-600', borderColor: 'border-b-blue-600', iconBg: 'bg-blue-600' }
        ].map((metric, idx) => (
          <div key={idx} className={`p-4 bg-white dark:bg-gray-800 border-2 border-black dark:border-white border-b-[6px] ${metric.borderColor} flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] transition-transform hover:-translate-y-0.5`}>
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

      {/* Main Focus: Account Risk Table */}
      <div className="flex-1 min-h-0 border-2 border-black dark:border-white bg-white dark:bg-gray-800 flex flex-col shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]">
        <div className="p-3 border-b-2 border-black dark:border-white flex justify-between items-center bg-indigo-600 shrink-0">
          <h3 className="text-sm font-black uppercase tracking-wider text-white">Account Portfolio</h3>
          <span className="text-[10px] font-bold uppercase text-white/80">{accounts.length} Accounts</span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 border-b-2 border-black dark:border-white shadow-sm">
              <tr className="text-xs uppercase text-black dark:text-white font-bold tracking-wide">
                <th className="text-left pl-4 py-3">Account</th>
                <th className="text-right py-3">ARR</th>
                <th className="text-center py-3">Health</th>
                <th className="text-center py-3">Risk</th>
                <th className="text-center py-3">Stage</th>
                <th className="text-center py-3 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/10">
              {accounts.slice(0, 15).map(acc => (
                <tr key={acc.id} className="hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors group">
                  <td className="pl-4 py-3 font-bold text-black dark:text-white group-hover:underline decoration-2">{acc.name}</td>
                  <td className="text-right py-3 font-mono font-medium text-black dark:text-white">{formatCurrency(acc.arr)}</td>
                  <td className="text-center py-3">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-8 text-right font-mono text-xs text-black dark:text-white">{acc.healthScore}%</span>
                      <div className="w-16 h-2 bg-gray-100 dark:bg-gray-700 border border-black/10 dark:border-white/10 rounded-sm overflow-hidden">
                        <div
                          className={`h-full ${acc.healthScore >= 70 ? 'bg-emerald-500' : acc.healthScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${acc.healthScore}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="text-center py-3">
                    <span className={`inline-flex px-3 py-1 text-[10px] uppercase font-black tracking-wide border-2 border-black ${acc.riskScore >= 70
                      ? 'bg-red-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : acc.riskScore >= 40
                        ? 'bg-yellow-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-white text-green-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]'
                      }`}>
                      {acc.riskScore >= 70 ? 'HIGH' : acc.riskScore >= 40 ? 'MED' : 'LOW'}
                    </span>
                  </td>
                  <td className="text-center py-3 font-mono text-xs text-gray-600 dark:text-gray-400 uppercase">{acc.renewalStage}</td>
                  <td className="text-center py-3 pr-4">
                    <button className="text-black dark:text-white text-[10px] font-black uppercase hover:underline opacity-0 group-hover:opacity-100 transition-opacity decoration-2 underline-offset-2">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Table Footer */}
        <div className="border-t-2 border-black dark:border-white p-2 bg-gray-50 dark:bg-gray-900 flex justify-between items-center text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 shrink-0">
          <span>Showing {Math.min(15, accounts.length)} of {accounts.length} accounts</span>
          <span>Sorted by Risk (Default)</span>
        </div>
      </div>
    </div>
  );
}
