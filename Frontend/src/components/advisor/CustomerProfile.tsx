import { motion } from 'framer-motion';
import { Building2, TrendingDown, Calendar, DollarSign, Ticket, CreditCard } from 'lucide-react';
import type { CustomerAccount } from '@/lib/api';

interface CustomerProfileProps {
  account: CustomerAccount | null;
}

export function CustomerProfile({ account }: CustomerProfileProps) {
  if (!account) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card p-6 h-full flex items-center justify-center"
      >
        <div className="text-center">
          <Building2 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">Select an account to view details</p>
        </div>
      </motion.div>
    );
  }

  const stats = [
    {
      icon: DollarSign,
      label: 'Annual Revenue',
      value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(account.arr),
      color: 'text-success'
    },
    {
      icon: Calendar,
      label: 'Days to Renewal',
      value: `${account.days_to_renewal} days`,
      color: account.days_to_renewal <= 30 ? 'text-destructive' : 'text-warning'
    },
    {
      icon: TrendingDown,
      label: 'Login Drop Rate',
      value: `${account.login_drop_rate}%`,
      color: account.login_drop_rate > 40 ? 'text-destructive' : 'text-foreground'
    },
    {
      icon: Ticket,
      label: 'Support Tickets',
      value: account.support_tickets.toString(),
      color: account.support_tickets > 10 ? 'text-destructive' : 'text-muted-foreground'
    },
    {
      icon: CreditCard,
      label: 'Payment Failures',
      value: account.payment_failures.toString(),
      color: account.payment_failures > 0 ? 'text-warning' : 'text-success'
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border/50">
        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center border border-primary/20">
          <Building2 className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground font-mono">{account.account_id}</h3>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Enterprise Tier</p>
        </div>
        <div className="ml-auto">
          {account.churn_risk_label === 1 ? (
            <span className="px-2 py-1 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">HIGH RISK</span>
          ) : (
            <span className="px-2 py-1 rounded text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">HEALTHY</span>
          )}
        </div>
      </div>

      {/* Stats List */}
      <div className="space-y-0 text-sm">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="flex items-center justify-between py-3 border-b border-border/40 last:border-0"
          >
            <div className="flex items-center gap-2">
              <stat.icon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{stat.label}</span>
            </div>
            <span className={`font-mono font-medium ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* License Utilization */}
      <div className="mt-8 pt-6 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">License Utilization</span>
          <span className="font-mono text-sm font-bold text-foreground">{account.license_utilization}%</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${account.license_utilization}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${account.license_utilization < 40 ? 'bg-destructive' :
                account.license_utilization < 70 ? 'bg-orange-500' : 'bg-emerald-500'
              }`}
          />
        </div>
      </div>
    </motion.div>
  );
}
