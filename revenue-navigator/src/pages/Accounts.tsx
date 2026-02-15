import { useState, useMemo } from 'react';
import { Search, Download, Plus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, getDaysUntil } from '@/data/mockData';
import { useAccounts } from '@/hooks/useAccounts';

export default function Accounts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<'all' | 'high' | 'safe'>('all');
  const navigate = useNavigate();
  const { data: accounts = [], isLoading, error } = useAccounts();

  const filteredClients = useMemo(() => {
    if (!accounts) return [];
    return accounts.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase());
    const isHighRisk = client.riskScore >= 70;
    const matchesFilter =
      filterRisk === 'all' ||
      (filterRisk === 'high' && isHighRisk) ||
      (filterRisk === 'safe' && !isHighRisk);

      return matchesSearch && matchesFilter;
    });
  }, [accounts, searchTerm, filterRisk]);

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
    <div className="p-6 max-w-[1600px] mx-auto h-[calc(100vh-64px)] flex flex-col gap-6">
      {/* Header & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-4 border-foreground pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-5xl font-black text-foreground tracking-tight uppercase">
              Account <span className="text-primary">Navigator</span>
            </h1>
            <div className="sticker-outline px-3 py-1 text-xs">PORTFOLIO</div>
          </div>
          <p className="text-sm font-black text-foreground/60 mt-2 uppercase tracking-wider">
            {filteredClients.length} High-Stakes Accounts Under Management
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 text-sm bg-white border-2 border-foreground rounded-lg focus:outline-none focus:bg-primary/5 w-64 transition-all font-black uppercase tracking-wider"
              style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}
            />
          </div>

          <div className="flex gap-2">
            {(['all', 'high', 'safe'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterRisk(filter)}
                className={`px-4 py-2 text-xs font-black border-2 border-foreground rounded-lg transition-all uppercase tracking-wider
                  ${filterRisk === filter
                    ? 'bg-primary text-white'
                    : 'bg-white text-foreground hover:bg-accent/10'
                  }`}
                style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}
              >
                {filter === 'all' ? 'All' : filter.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-white text-foreground border-2 border-foreground rounded-lg font-black text-sm transition-all flex items-center uppercase tracking-wider"
            style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>

          <button
            className="px-4 py-2 bg-primary text-white border-2 border-foreground rounded-lg font-black text-sm transition-all flex items-center uppercase tracking-wider"
            style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </button>
        </div>
      </div>

      {/* Data Grid */}
      <div className="paper-card table-container flex-1 overflow-hidden flex flex-col p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-foreground/60">Loading accounts...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-600">
            <span>Failed to load accounts. Please try again.</span>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="flex items-center justify-center h-full text-foreground/60">
            <span>No accounts found.</span>
          </div>
        ) : (
          <div className="overflow-auto flex-1 relative custom-scrollbar">
            <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-accent border-b-4 border-foreground">
              <tr className="text-[10px] uppercase text-white font-black tracking-widest text-left">
                <th className="pl-6 py-4 w-[250px]">Account Entity</th>
                <th className="text-right py-4">ARR Portfolio</th>
                <th className="text-center py-4">Renewal</th>
                <th className="text-center py-4">Utilization</th>
                <th className="text-center py-4">Rel. Score</th>
                <th className="text-center py-4">Churn Pr.</th>
                <th className="text-center py-4">Sentiment</th>
                <th className="text-center py-4">Status</th>
                <th className="w-[100px] text-center py-4 pr-6">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-foreground">
              {filteredClients.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => navigate(`/app/accounts/${client.id}`)}
                  className="group cursor-pointer hover:bg-primary/10 transition-colors"
                >
                  <td className="pl-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-base group-hover:text-primary transition-colors">
                        {client.name}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium tracking-wider">
                        UID: {client.id.substring(0, 8)}
                      </span>
                    </div>
                  </td>
                  <td className="text-right font-bold text-gray-700">
                    {formatCurrency(client.arr)}
                  </td>
                  <td className="text-center">
                    <div className={`px-2 py-0.5 border-2 border-foreground text-[10px] font-black text-white inline-flex uppercase ${getDaysUntil(client.renewalDate) <= 30 ? 'bg-red-500' : 'bg-primary'}`} style={{ boxShadow: "2px 2px 0px 0px hsl(var(--foreground))" }}>
                      {getDaysUntil(client.renewalDate)}D
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="font-bold text-xs text-gray-600">{client.utilization}%</span>
                      <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${client.utilization > 80 ? 'bg-primary' : 'bg-accent'}`}
                          style={{ width: `${client.utilization}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="text-center">
                    <span className="font-black text-sm px-2 py-1 bg-accent/20 text-primary border-2 border-foreground uppercase" style={{ boxShadow: "2px 2px 0px 0px hsl(var(--foreground))" }}>
                      {client.relationshipScore}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={`font-black text-sm uppercase ${client.churnProbability >= 0.7 ? 'text-red-600' : client.churnProbability >= 0.4 ? 'text-accent' : 'text-success'}`}>
                      {Math.round(client.churnProbability * 100)}%
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="inline-flex items-center gap-2 px-2 py-1 bg-white border-2 border-foreground" style={{ boxShadow: "2px 2px 0px 0px hsl(var(--foreground))" }}>
                      <span className="text-lg">
                        {client.sentimentScore > 0.5 ? '🔥' : client.sentimentScore > 0 ? '👍' : client.sentimentScore > -0.5 ? '😐' : '⚠️'}
                      </span>
                      <span className="font-black text-xs text-foreground">
                        {client.sentimentScore > 0 ? '+' : ''}{client.sentimentScore.toFixed(2)}
                      </span>
                    </div>
                  </td>
                  <td className="text-center">
                    {client.riskScore >= 70 ? (
                      <span className="px-2 py-1 border-2 border-foreground text-[10px] font-black bg-red-50 text-red-600 uppercase" style={{ boxShadow: "2px 2px 0px 0px hsl(var(--foreground))" }}>High Risk</span>
                    ) : (
                      <span className="px-2 py-1 border-2 border-foreground text-[10px] font-black bg-success/10 text-success uppercase" style={{ boxShadow: "2px 2px 0px 0px hsl(var(--foreground))" }}>Target Safe</span>
                    )}
                  </td>
                  <td className="text-center pr-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/app/accounts/${client.id}`);
                      }}
                      className="px-3 py-1 text-[10px] font-black uppercase bg-white text-foreground hover:bg-primary/10 hover:text-primary transition-all border-2 border-foreground"
                      style={{ boxShadow: "2px 2px 0px 0px hsl(var(--foreground))" }}
                    >
                      Audit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
        {/* Table Footer */}
        {!isLoading && !error && filteredClients.length > 0 && (
          <div className="p-4 bg-accent border-t-4 border-foreground flex justify-between items-center text-[10px] font-black text-white uppercase tracking-widest">
            <div className="flex gap-6">
              <span>ACTIVE ACCOUNTS: <span className="text-gray-600">{filteredClients.length}</span></span>
              <span>TOTAL ARR: <span className="text-gray-600">{formatCurrency(filteredClients.reduce((acc, c) => acc + c.arr, 0))}</span></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
