import { motion } from 'framer-motion';
import { AlertTriangle, TrendingDown, CheckCircle, ArrowUpRight } from 'lucide-react';
import type { CustomerAccount } from '@/lib/api';

interface RiskHeatmapProps {
  data: CustomerAccount[];
  onSelectAccount: (account: CustomerAccount) => void;
}

export function RiskHeatmap({ data, onSelectAccount }: RiskHeatmapProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getRiskBadge = (churnRisk: number, loginDrop: number) => {
    if (churnRisk === 1 && loginDrop > 40) {
      return (
        <span className="badge-risk">
          <AlertTriangle size={12} />
          High Risk
        </span>
      );
    } else if (churnRisk === 1) {
      return (
        <span className="badge-warning">
          <TrendingDown size={12} />
          At Risk
        </span>
      );
    }
    return (
      <span className="badge-safe">
        <CheckCircle size={12} />
        Healthy
      </span>
    );
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-card overflow-hidden"
    >
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Risk Heatmap</h2>
            <p className="text-sm text-muted-foreground">Accounts requiring immediate attention</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-destructive" />
              High Risk
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-warning" />
              At Risk
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-success" />
              Healthy
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr className="bg-muted/30">
              <th>Account ID</th>
              <th>ARR</th>
              <th>Days to Renewal</th>
              <th>Login Drop %</th>
              <th>Support Tickets</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <motion.tbody
            variants={container}
            initial="hidden"
            animate="show"
          >
            {data.map((account) => (
              <motion.tr
                key={account.account_id}
                variants={item}
                className="cursor-pointer"
                onClick={() => onSelectAccount(account)}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
              >
                <td>
                  <span className="font-mono text-sm text-foreground">
                    {account.account_id}
                  </span>
                </td>
                <td>
                  <span className="font-mono font-medium text-foreground">
                    {formatCurrency(account.arr)}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <div 
                      className={`w-2 h-2 rounded-full ${
                        account.days_to_renewal <= 30 ? 'bg-destructive animate-pulse' :
                        account.days_to_renewal <= 60 ? 'bg-warning' : 'bg-success'
                      }`}
                    />
                    <span className={`font-mono ${
                      account.days_to_renewal <= 30 ? 'text-destructive' : 'text-foreground'
                    }`}>
                      {account.days_to_renewal} days
                    </span>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          account.login_drop_rate > 40 ? 'bg-destructive' :
                          account.login_drop_rate > 20 ? 'bg-warning' : 'bg-success'
                        }`}
                        style={{ width: `${Math.min(account.login_drop_rate, 100)}%` }}
                      />
                    </div>
                    <span className="font-mono text-muted-foreground text-xs">
                      {account.login_drop_rate}%
                    </span>
                  </div>
                </td>
                <td>
                  <span className={`font-mono ${
                    account.support_tickets > 10 ? 'text-destructive' :
                    account.support_tickets > 5 ? 'text-warning' : 'text-muted-foreground'
                  }`}>
                    {account.support_tickets}
                  </span>
                </td>
                <td>{getRiskBadge(account.churn_risk_label, account.login_drop_rate)}</td>
                <td>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <ArrowUpRight size={16} />
                  </motion.button>
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>
    </motion.div>
  );
}
