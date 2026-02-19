import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  iconBg?: string;
  iconColor?: string;
  iconBorder?: string;
  isAlert?: boolean;
  delay?: number;
  className?: string;
}

const colorMap = {
  default: 'text-foreground',
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-red-600',
};

export function MetricCard({
  label,
  value,
  icon,
  color = 'default',
  iconBg = 'bg-primary',
  iconColor = 'text-white',
  iconBorder = 'border-foreground',
  isAlert = false,
  delay = 0,
  className = '',
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        'paper-card p-5 flex flex-col justify-between group cursor-default transition-all',
        isAlert ? 'bg-red-50' : 'bg-white',
        className
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <p className="text-xs font-black text-foreground/60 uppercase tracking-wider">
          {label}
        </p>
        {icon && (
          <div
            className={cn(
              'w-10 h-10 p-2 border-2 rounded-lg flex items-center justify-center shrink-0',
              iconBorder,
              iconBg,
              iconColor
            )}
            style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}
          >
            {icon}
          </div>
        )}
      </div>
      <div className={cn('text-3xl font-black tracking-tight', colorMap[color])}>
        {value}
      </div>
    </motion.div>
  );
}
