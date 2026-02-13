import { useState } from 'react';
import { Search, Download, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { accounts, formatCurrency, getDaysUntil } from '@/data/mockData';

export default function Accounts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<'all' | 'high' | 'safe'>('all');
  const navigate = useNavigate();

  const filteredClients = accounts.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
    const isHighRisk = client.riskScore >= 70;
    const matchesFilter =
      filterRisk === 'all' ||
      (filterRisk === 'high' && isHighRisk) ||
      (filterRisk === 'safe' && !isHighRisk);

    return matchesSearch && matchesFilter;
  });

  const handleExportCSV = () => {
    if (filteredClients.length === 0) return;
    const headers = ['Account', 'ARR', 'Health', 'Risk', 'Renewal Days', 'Utilization', 'Relationship Score', 'Churn Probability', 'Sentiment Score'];
    const rows = filteredClients.map(client => [
      client.name,
      client.arr,
      client.healthScore,
      client.riskScore,
      getDaysUntil(client.renewalDate),
      client.utilization,
      client.relationshipScore,
      client.churnProbability,
      client.sentimentScore
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `accounts_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="p-4 max-w-[1600px] mx-auto h-[calc(100vh-64px)] flex flex-col">
      {/* Header & Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Account Management</h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            PORTFOLIO: {filteredClients.length} ACCOUNTS
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 h-8 text-xs rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary w-64"
            />
          </div>
          <div className="h-8 w-[1px] bg-border mx-1" />
          <div className="flex gap-2">
            {(['all', 'high', 'safe'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterRisk(filter)}
                className={`px-4 py-1.5 text-xs font-bold uppercase border-2 border-black dark:border-white transition-all duration-200
                  ${filterRisk === filter
                    ? 'bg-indigo-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]'
                    : 'bg-white dark:bg-gray-800 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[1px_1px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[1px] hover:translate-y-[1px]'
                  }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="h-8 w-[1px] bg-black/10 mx-2" />
          <button
            onClick={handleExportCSV}
            className="h-10 px-4 bg-white dark:bg-gray-800 text-black dark:text-white border-2 border-black dark:border-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            className="h-10 px-4 bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-white dark:hover:bg-black hover:text-black dark:hover:text-white"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* Data Grid */}
      <div className="border-2 border-black dark:border-white flex-1 overflow-hidden flex flex-col shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] bg-white dark:bg-gray-800">
        <div className="overflow-auto flex-1 relative custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-indigo-600 border-b-2 border-black dark:border-white shadow-sm">
              <tr className="text-xs uppercase text-white font-black tracking-wide">
                <th className="pl-4 py-3 w-[200px]">Account Name</th>
                <th className="text-right py-3">ARR</th>
                <th className="text-center py-3">Renewal</th>
                <th className="text-center py-3">Health</th>
                <th className="text-center py-3">Utilization</th>
                <th className="text-center py-3">Relationship</th>
                <th className="text-center py-3">Churn %</th>
                <th className="text-center py-3">Sentiment</th>
                <th className="text-center py-3">Risk Status</th>
                <th className="w-[100px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/10">
              {filteredClients.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => navigate(`/app/accounts/${client.id}`)}
                  className="hover:bg-black/5 dark:hover:bg-white/5 group transition-colors cursor-pointer"
                >
                  <td className="pl-4 py-3 font-bold text-black dark:text-white group-hover:underline decoration-2">{client.name}</td>
                  <td className="text-right py-3 font-mono text-gray-700 dark:text-gray-300">{formatCurrency(client.arr)}</td>
                  <td className="text-center py-3">
                    <span className={`font-mono font-bold ${getDaysUntil(client.renewalDate) <= 30 ? 'text-red-600' : 'text-black dark:text-white'}`}>
                      {getDaysUntil(client.renewalDate)}d
                    </span>
                  </td>
                  <td className="text-center py-3">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-8 text-right font-mono text-xs text-black dark:text-white">{client.healthScore}%</span>
                      <div className="w-16 h-2 bg-gray-100 dark:bg-gray-700 border border-black/10 dark:border-white/10 rounded-sm overflow-hidden">
                        <div
                          className={`h-full ${client.healthScore >= 70 ? 'bg-emerald-500' : client.healthScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${client.healthScore}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="text-center py-3">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-8 text-right font-mono text-xs text-black dark:text-white">{client.utilization}%</span>
                      <div className="w-16 h-2 bg-gray-100 dark:bg-gray-700 border border-black/10 dark:border-white/10 rounded-sm overflow-hidden">
                        <div
                          className={`h-full ${client.utilization > 80 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                          style={{ width: `${client.utilization}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  {/* Relationship Score - NEW */}
                  <td className="text-center py-3">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-8 text-right font-mono text-xs text-black dark:text-white">{client.relationshipScore}%</span>
                      <div className="w-16 h-2 bg-gray-100 dark:bg-gray-700 border border-black/10 dark:border-white/10 rounded-sm overflow-hidden">
                        <div
                          className={`h-full ${client.relationshipScore >= 70 ? 'bg-purple-600' : client.relationshipScore >= 40 ? 'bg-purple-400' : 'bg-purple-300'}`}
                          style={{ width: `${client.relationshipScore}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  {/* Churn Probability - NEW */}
                  <td className="text-center py-3">
                    <span className={`font-mono font-bold ${client.churnProbability >= 0.7 ? 'text-red-600' : client.churnProbability >= 0.4 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {Math.round(client.churnProbability * 100)}%
                    </span>
                  </td>
                  {/* Sentiment Score - NEW */}
                  <td className="text-center py-3">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-sm">
                        {client.sentimentScore > 0.5 ? '😊' : client.sentimentScore > 0 ? '🙂' : client.sentimentScore > -0.5 ? '😐' : '😟'}
                      </span>
                      <span className={`font-mono text-xs ${client.sentimentScore > 0.5 ? 'text-emerald-600' : client.sentimentScore > 0 ? 'text-blue-600' : client.sentimentScore > -0.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {client.sentimentScore > 0 ? '+' : ''}{client.sentimentScore.toFixed(2)}
                      </span>
                    </div>
                  </td>
                  <td className="text-center py-3">{client.riskScore >= 70 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-600 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      RISK
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white text-green-700 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                      SAFE
                    </span>
                  )}
                  </td>
                  <td className="text-center py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/app/accounts/${client.id}`);
                      }}
                      className="text-black dark:text-white text-[10px] font-black uppercase hover:underline opacity-0 group-hover:opacity-100 transition-opacity decoration-2 underline-offset-2"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Table Footer */}
        <div className="border-t-2 border-black dark:border-white p-2 bg-gray-50 dark:bg-gray-900 flex justify-between items-center text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">
          <span>Showing {filteredClients.length} of {accounts.length} accounts</span>
          <span>Sorted by Risk (Default)</span>
        </div>
      </div>
    </div>
  );
}
