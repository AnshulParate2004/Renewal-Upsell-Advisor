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
      className="glass-card p-6 h-full"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border/50">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Building2 className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground font-mono">{account.account_id}</h3>
          <p className="text-sm text-muted-foreground">Enterprise Tier</p>
        </div>
        <div className="ml-auto">
          {account.churn_risk_label === 1 ? (
            <span className="badge-risk">High Risk</span>
          ) : (
            <span className="badge-safe">Healthy</span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="space-y-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between py-3 px-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <stat.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
            <span className={`font-mono font-medium ${stat.color}`}>{stat.value}</span>
          </motion.div>
        ))}
      </div>

      {/* License Utilization */}
      <div className="mt-6 pt-6 border-t border-border/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">License Utilization</span>
          <span className="font-mono text-sm text-foreground">{account.license_utilization}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${account.license_utilization}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${
              account.license_utilization < 40 ? 'bg-destructive' :
              account.license_utilization < 70 ? 'bg-warning' : 'bg-success'
            }`}
          />
        </div>
      </div>
    </motion.div>
  );
}
