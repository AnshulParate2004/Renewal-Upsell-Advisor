import { useState, useMemo } from 'react';
import { Search, Download, Plus, Loader2, ChevronRight, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, getDaysUntil } from '@/data/mockData';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAccounts } from '@/hooks/useAccounts';
import { emailApi } from '@/lib/api/email';

export default function Accounts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<'all' | 'high' | 'safe'>('all');
  const [sendingAccountId, setSendingAccountId] = useState<string | null>(null);
  const [emailFeedback, setEmailFeedback] = useState<{ id: string; type: 'success' | 'error'; text: string } | null>(null);
  const navigate = useNavigate();
  const { data: accounts = [], isLoading, error, refetch } = useAccounts();

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
      client.name, client.arr, client.healthScore, client.riskScore,
      getDaysUntil(client.renewalDate), client.utilization, client.relationshipScore,
      client.churnProbability, client.sentimentScore
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `accounts_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-background">
      {/* Page Header */}
      <div className="bg-card border-b-2 border-black px-6 py-5 shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Accounts</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{filteredClients.length} accounts under management</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-4 py-2 text-sm bg-background border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/20 w-48 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px]"
              />
            </div>
            <div className="flex gap-0.5 bg-muted rounded-lg p-0.5 border-2 border-black">
              {(['all', 'high', 'safe'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterRisk(filter)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filterRisk === filter
                    ? 'bg-card text-foreground shadow-sm border-2 border-black'
                    : 'text-muted-foreground hover:text-foreground bg-transparent'
                    }`}
                >
                  {filter === 'all' ? 'All' : filter === 'high' ? 'High Risk' : 'Safe'}
                </button>
              ))}
            </div>
            <button onClick={handleExportCSV} className="h-9 px-3 bg-card text-foreground border-2 border-black rounded-lg text-xs font-medium hover:bg-muted transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button className="h-9 px-3 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-all flex items-center gap-1.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none">
              <Plus className="w-3.5 h-3.5" /> Add Account
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="p-6">
        <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b-2 border-black">
              <tr className="text-[11px] uppercase text-muted-foreground font-medium tracking-wider text-left">
                <th className="pl-5 py-3">Account</th>
                <th className="text-right py-3 pr-4">ARR</th>
                <th className="text-center py-3">Renewal</th>
                <th className="text-center py-3">Utilization</th>
                <th className="text-center py-3">Rel. Score</th>
                <th className="text-center py-3">Churn</th>
                <th className="text-center py-3">Sentiment</th>
                <th className="text-center py-3">Status</th>
                <th className="text-center py-3 pr-5 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr className="border-b-2 border-black"><td colSpan={9} className="text-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
                </td></tr>
              ) : error ? (
                <tr className="border-b-2 border-black"><td colSpan={9} className="p-0">
                  <EmptyState variant="not-found" title="Failed to Load Accounts" message={error.message || "Failed to load accounts."} />
                </td></tr>
              ) : filteredClients.length === 0 ? (
                <tr className="border-b-2 border-black"><td colSpan={9} className="p-0">
                  <EmptyState variant="no-results" title="No Accounts Found" message="Try adjusting your search or filter criteria." />
                </td></tr>
              ) : (
                filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    onClick={() => navigate(`/app/accounts/${client.id}`)}
                    className="group cursor-pointer hover:bg-muted/20 transition-colors border-b-2 border-black"
                  >
                    <td className="pl-5 py-3.5">
                      <div>
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors text-sm">{client.name}</span>
                        <div className="text-[11px] text-muted-foreground">{client.id.substring(0, 8)}</div>
                      </div>
                    </td>
                    <td className="text-right font-medium text-foreground pr-4 py-3.5 text-sm">{formatCurrency(client.arr)}</td>
                    <td className="text-center py-3.5">
                      <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border-2 border-black ${getDaysUntil(client.renewalDate) <= 30 ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                        {getDaysUntil(client.renewalDate)}d
                      </span>
                    </td>
                    <td className="text-center py-3.5">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-muted-foreground">{client.utilization}%</span>
                        <div className="w-16 h-1 bg-muted rounded-full overflow-hidden border border-black/10">
                          <div className={`h-full rounded-full ${client.utilization > 80 ? 'bg-primary' : 'bg-emerald-500'}`} style={{ width: `${client.utilization}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="text-center py-3.5">
                      <span className="text-sm font-medium text-primary">{client.relationshipScore}</span>
                    </td>
                    <td className="text-center py-3.5">
                      <span className={`text-sm font-medium ${client.churnProbability >= 0.7 ? 'text-destructive' : client.churnProbability >= 0.4 ? 'text-amber-500' : 'text-emerald-600'}`}>
                        {Math.round(client.churnProbability * 100)}%
                      </span>
                    </td>
                    <td className="text-center py-3.5 text-base">
                      {client.sentimentScore > 0.5 ? '😊' : client.sentimentScore > 0 ? '🙂' : client.sentimentScore > -0.5 ? '😐' : '😟'}
                    </td>
                    <td className="text-center py-3.5">
                      <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border-2 border-black ${client.riskScore >= 70 ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-600'}`}>
                        {client.riskScore >= 70 ? 'High Risk' : 'Safe'}
                      </span>
                    </td>
                    <td className="text-center py-3.5 pr-5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={async () => {
                            if (sendingAccountId) return;
                            setSendingAccountId(client.id);
                            setEmailFeedback(null);
                            try {
                              const res = await emailApi.sendToAccount(client.id);
                              setEmailFeedback({ id: client.id, type: 'success', text: res.message || 'Sent' });
                              refetch();
                            } catch (err: any) {
                              setEmailFeedback({ id: client.id, type: 'error', text: err?.message || 'Failed' });
                            } finally {
                              setSendingAccountId(null);
                            }
                          }}
                          disabled={!!sendingAccountId}
                          title="Send email to this account"
                          className="p-1.5 rounded-lg border-2 border-black bg-card hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
                        >
                          {sendingAccountId === client.id ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                        </button>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors inline-block" />
                      </div>
                      {emailFeedback?.id === client.id && (
                        <p className={`text-[10px] mt-0.5 ${emailFeedback.type === 'success' ? 'text-emerald-600' : 'text-destructive'}`}>
                          {emailFeedback.text}
                        </p>
                      )}
                    </td>
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
