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
  success: 'text-primary',
  warning: 'text-accent',
  danger: 'text-destructive',
};

export function MetricCard({
  label,
  value,
  icon,
  color = 'default',
  iconBg = 'bg-primary/10',
  iconColor = 'text-primary',
  iconBorder,
  isAlert = false,
  delay = 0,
  className = '',
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: "easeOut" }}
      className={cn(
        'bg-card rounded-2xl border border-border p-5 flex flex-col justify-between hover:shadow-md transition-all',
        isAlert && 'border-destructive/20 bg-destructive/5',
        className
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        {icon && (
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', iconBg, iconColor)}>
            {icon}
          </div>
        )}
      </div>
      <div className={cn('text-2xl font-bold tracking-tight', colorMap[color])}>
        {value}
      </div>
    </motion.div>
  );
}
