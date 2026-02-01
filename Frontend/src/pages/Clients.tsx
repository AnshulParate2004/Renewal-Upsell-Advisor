import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Download, Plus } from 'lucide-react';
import { mockHeatmapData, type CustomerAccount } from '@/lib/api';

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRisk, setFilterRisk] = useState<'all' | 'high' | 'safe'>('all');

  const filteredClients = mockHeatmapData.filter((client) => {
    const matchesSearch = client.account_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterRisk === 'all' ||
      (filterRisk === 'high' && client.churn_risk_label === 1) ||
      (filterRisk === 'safe' && client.churn_risk_label === 0);
    return matchesSearch && matchesFilter;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Client Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredClients.length} accounts in renewal window
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </motion.button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-4"
      >
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by account ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2">
          {(['all', 'high', 'safe'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterRisk(filter)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${filterRisk === filter
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }
              `}
            >
              {filter === 'all' ? 'All' : filter === 'high' ? 'High Risk' : 'Healthy'}
            </button>
          ))}
        </div>

        {/* Export */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-card text-muted-foreground hover:text-foreground transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </motion.button>
      </motion.div>

      {/* Client Cards Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredClients.map((client, index) => (
          <motion.div
            key={client.account_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4 }}
            className="glass-card p-6 cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-mono font-semibold text-foreground group-hover:text-primary transition-colors">
                  {client.account_id}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Enterprise Tier</p>
              </div>
              <div className="text-right">
                {client.churn_risk_label === 1 ? (
                  <span className="badge-risk mb-1 block">High Risk</span>
                ) : (
                  <span className="badge-safe mb-1 block">Healthy</span>
                )}
                {client.risk_score !== undefined && (
                  <span className={`text-xs font-mono font-medium ${client.risk_score > 50 ? 'text-destructive' : 'text-success'
                    }`}>
                    Risk: {client.risk_score}/100
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ARR</span>
                <span className="font-mono font-medium text-foreground">
                  {formatCurrency(client.arr)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Renewal</span>
                <span className={`font-mono ${client.days_to_renewal <= 30 ? 'text-destructive' : 'text-foreground'}`}>
                  {client.days_to_renewal} days
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Utilization</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${client.license_utilization < 40 ? 'bg-destructive' :
                          client.license_utilization < 70 ? 'bg-warning' : 'bg-success'
                        }`}
                      style={{ width: `${client.license_utilization}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {client.license_utilization}%
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {client.support_tickets} tickets • {client.payment_failures} failures
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                className="text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
              >
                View →
              </motion.button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
