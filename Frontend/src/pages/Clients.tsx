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
    <div className="p-4 max-w-[1600px] mx-auto h-[calc(100vh-64px)] flex flex-col">
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
          <div className="flex gap-2">
            {(['all', 'high', 'safe'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setFilterRisk(filter)}
                className={`px-4 py-1.5 text-xs font-bold uppercase border-2 border-black transition-all duration-200
                  ${filterRisk === filter
                    ? 'bg-indigo-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-white text-black hover:bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]'
                  }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="h-8 w-[1px] bg-black/10 mx-2" />
          <button
            onClick={handleExportCSV}
            className="h-10 px-4 bg-white text-black border-2 border-black text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            className="h-10 px-4 bg-black text-white border-2 border-black text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-white hover:text-black"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* Data Grid */}
      <div className="border-2 border-black flex-1 overflow-hidden flex flex-col shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white">
        <div className="overflow-auto flex-1 relative custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-indigo-600 border-b-2 border-black shadow-sm">
              <tr className="text-xs uppercase text-white font-black tracking-wide">
                <th className="pl-4 py-3 w-[150px]">Account ID</th>
                <th className="py-3 w-[200px]">Company Name</th>
                <th className="text-right py-3">ARR</th>
                <th className="text-center py-3">Renewal</th>
                <th className="text-center py-3">Health</th>
                <th className="text-center py-3">Utilization</th>
                <th className="text-center py-3">Tickets</th>
                <th className="text-center py-3">Failures</th>
                <th className="w-[100px] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredClients.map((client) => (
                <tr key={client.account_id} className="hover:bg-black/5 group transition-colors">
                  <td className="pl-4 py-3 font-mono font-bold text-black">{client.account_id}</td>
                  <td className="py-3 font-medium text-black group-hover:underline decoration-2">{client.company_name || '-'}</td>
                  <td className="text-right py-3 font-mono text-gray-700">{formatCurrency(client.arr)}</td>
                  <td className="text-center py-3">
                    <span className={`font-mono font-bold ${client.days_to_renewal <= 30 ? 'text-red-600' : 'text-black'}`}>
                      {client.days_to_renewal}d
                    </span>
                  </td>
                  <td className="text-center py-3">
                    {client.churn_risk_label === 1 ? (
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
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-8 text-right font-mono text-xs">{(client.license_utilization * 100).toFixed(0)}%</span>
                      <div className="w-16 h-2 bg-gray-100 border border-black/10 rounded-sm overflow-hidden">
                        <div
                          className={`h-full ${client.license_utilization > 0.8 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                          style={{ width: `${client.license_utilization * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="text-center py-3 font-mono text-gray-600">{client.support_tickets}</td>
                  <td className="text-center py-3 font-mono text-gray-600">{client.payment_failures}</td>
                  <td className="text-center py-3">
                    <button className="text-black text-[10px] font-black uppercase hover:underline opacity-0 group-hover:opacity-100 transition-opacity decoration-2 underline-offset-2">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Table Footer */}
        <div className="border-t-2 border-black p-2 bg-gray-50 flex justify-between items-center text-[10px] uppercase font-bold text-gray-500">
          <span>Showing {filteredClients.length} of {accounts.length} accounts</span>
          <span>Sorted by Risk (Default)</span>
        </div>
      </div>
    </div>
  );
}
