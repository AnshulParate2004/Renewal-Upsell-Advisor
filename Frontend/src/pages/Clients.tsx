import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Download, Plus } from 'lucide-react';
import { type CustomerAccount, getAllClients } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState<'all' | 'high' | 'safe'>('all');

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: getAllClients
  });

  const filteredClients = accounts.filter((client: CustomerAccount) => {
    const matchesSearch = client.account_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.company_name && client.company_name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Safety check for risk label (sometimes valid 0/1, sometimes missing?)
    // Assuming backend returns 1 for high, 0 for safe.
    const isHighRisk = client.churn_risk_label === 1;

    const matchesFilter =
      filterRisk === 'all' ||
      (filterRisk === 'high' && isHighRisk) ||
      (filterRisk === 'safe' && !isHighRisk);

    return matchesSearch && matchesFilter;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleExportCSV = () => {
    if (filteredClients.length === 0) return;

    // Define CSV headers
    const headers = [
      'Account ID',
      'Company Name',
      'ARR',
      'Renewal Date',
      'Days to Renewal',
      'Login Drop Rate (%)',
      'Support Tickets',
      'Payment Failures',
      'License Utilization (%)',
      'Churn Risk Label'
    ];

    // Convert data to CSV rows
    const rows = filteredClients.map(client => [
      client.account_id,
      client.company_name || '',
      client.arr,
      client.renewal_date,
      client.days_to_renewal,
      client.login_drop_rate,
      client.support_tickets,
      client.payment_failures,
      client.license_utilization,
      client.churn_risk_label === 1 ? 'High Risk' : 'Healthy'
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `reviq_clients_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="p-4 max-w-[1600px] mx-auto h-screen flex flex-col">
      {/* Header & Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Client Management</h1>
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
          <div className="flex bg-muted/50 rounded p-0.5 border border-border">
            {(['all', 'high', 'safe'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterRisk(filter)}
                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-sm transition-all ${filterRisk === filter
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="h-8 w-[1px] bg-border mx-1" />
          <button
            onClick={handleExportCSV}
            className="h-8 px-3 border border-border bg-card hover:bg-muted text-xs font-medium rounded flex items-center gap-2 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            className="h-8 px-3 bg-primary text-primary-foreground text-xs font-medium rounded flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>

      {/* Data Grid */}
      <div className="border border-border rounded bg-card flex-1 overflow-hidden flex flex-col shadow-sm">
        <div className="overflow-auto flex-1 relative">
          <table className="w-full dense-table text-left">
            <thead className="sticky top-0 z-10 bg-muted/10 backdrop-blur-sm">
              <tr>
                <th className="pl-4 w-[180px]">Account ID</th>
                <th className="w-[200px]">Company Name</th>
                <th className="text-right">ARR</th>
                <th className="text-center">Renewal</th>
                <th className="text-center">Health</th>
                <th className="text-center">Utilization</th>
                <th className="text-center">Tickets</th>
                <th className="text-center">Failures</th>
                <th className="w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredClients.map((client) => (
                <tr key={client.account_id} className="hover:bg-muted/30 group transition-colors">
                  <td className="pl-4 font-mono font-medium text-foreground">{client.account_id}</td>
                  <td className="font-medium text-muted-foreground">{client.company_name || '-'}</td>
                  <td className="text-right font-mono">{formatCurrency(client.arr)}</td>
                  <td className="text-center">
                    <span className={`font-mono ${client.days_to_renewal <= 30 ? 'text-destructive font-bold' : ''}`}>
                      {client.days_to_renewal}d
                    </span>
                  </td>
                  <td className="text-center">
                    {client.churn_risk_label === 1 ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                        RISK
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
                        SAFE
                      </span>
                    )}
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-8 text-right font-mono">{(client.license_utilization * 100).toFixed(0)}%</span>
                      <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${client.license_utilization > 0.8 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                          style={{ width: `${client.license_utilization * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="text-center font-mono text-muted-foreground">{client.support_tickets}</td>
                  <td className="text-center font-mono text-muted-foreground">{client.payment_failures}</td>
                  <td>
                    <button className="text-primary text-[10px] font-bold uppercase hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Table Footer */}
        <div className="border-t border-border p-2 bg-muted/5 flex justify-between items-center text-[10px] text-muted-foreground">
          <span>Showing {filteredClients.length} of {accounts.length} accounts</span>
          <span>Sorted by Risk (Default)</span>
        </div>
      </div>
    </div>
  );
}
