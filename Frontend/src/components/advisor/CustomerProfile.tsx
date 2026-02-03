import { motion } from 'framer-motion';
import { Building2, TrendingDown, Calendar, DollarSign, Ticket, CreditCard } from 'lucide-react';
import type { CustomerAccount } from '@/lib/api';
import { EmptyAccountIcon } from '@/components/ui/CustomIcons';

interface CustomerProfileProps {
  account: CustomerAccount | null;
}

export function CustomerProfile({ account }: CustomerProfileProps) {
  if (!account) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full flex items-center justify-center border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6"
      >
        <div className="text-center">
          <EmptyAccountIcon className="w-32 h-32 mx-auto mb-4 opacity-100 grayscale" />
          <p className="text-black font-bold uppercase tracking-wider text-xs">Select an account to view details</p>
        </div>
      </motion.div>
    );
  }

  const stats = [
    {
      icon: DollarSign,
      label: 'Annual Revenue',
      value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(account.arr),
      color: 'text-black'
    },
    {
      icon: Calendar,
      label: 'Days to Renewal',
      value: `${account.days_to_renewal} days`,
      color: account.days_to_renewal <= 30 ? 'text-red-600' : 'text-orange-600'
    },
    {
      icon: TrendingDown,
      label: 'Login Drop Rate',
      value: `${account.login_drop_rate}%`,
      color: account.login_drop_rate > 40 ? 'text-red-600' : 'text-black'
    },
    {
      icon: Ticket,
      label: 'Support Tickets',
      value: account.support_tickets.toString(),
      color: account.support_tickets > 10 ? 'text-red-600' : 'text-gray-600'
    },
    {
      icon: CreditCard,
      label: 'Payment Failures',
      value: account.payment_failures.toString(),
      color: account.payment_failures > 0 ? 'text-orange-600' : 'text-green-600'
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-0 h-full border-r-2 border-black bg-white"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 p-6 border-b-2 border-black bg-indigo-50/30">
        <div className="w-12 h-12 border-2 border-black bg-white flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Building2 className="w-6 h-6 text-black" />
        </div>
        <div>
          <h3 className="text-lg font-black text-black font-mono tracking-tighter">{account.account_id}</h3>
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Enterprise Tier</p>
        </div>
        <div className="ml-auto">
          {account.churn_risk_label === 1 ? (
            <span className="px-2 py-1 text-[10px] font-black bg-red-600 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">HIGH RISK</span>
          ) : (
            <span className="px-2 py-1 text-[10px] font-black bg-white text-green-700 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">HEALTHY</span>
          )}
        </div>
      </div>

      {/* Stats List */}
      <div className="space-y-2 text-sm px-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center justify-between py-3 px-3 border-2 border-transparent hover:border-black hover:bg-indigo-50 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-default"
          >
            <div className="flex items-center gap-3">
              <stat.icon className="w-4 h-4 text-black" />
              <span className="text-gray-600 text-xs font-bold uppercase tracking-wider">{stat.label}</span>
            </div>
            <span className={`font-mono font-bold text-base ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* License Utilization */}
      <div className="mt-8 mx-6 pt-6 border-t-2 border-black">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black uppercase tracking-wider text-black">License Utilization</span>
          <span className="font-mono text-sm font-bold text-black">{account.license_utilization}%</span>
        </div>
        <div className="h-6 border-2 border-black bg-white p-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${account.license_utilization}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full ${account.license_utilization < 40 ? 'bg-red-600' :
              account.license_utilization < 70 ? 'bg-orange-500' : 'bg-green-600'
              }`}
          />
        </div>
      </div>
    </motion.div>
  );
}
