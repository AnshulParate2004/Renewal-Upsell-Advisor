import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'danger' | 'success';
  delay?: number;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  delay = 0
}: MetricCardProps) {
  const variantStyles = {
    default: 'from-primary/20 to-primary/5',
    danger: 'from-destructive/20 to-destructive/5',
    success: 'from-success/20 to-success/5',
  };

  const iconStyles = {
    default: 'text-primary',
    danger: 'text-destructive',
    success: 'text-success',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="bg-card border border-border p-6 relative overflow-hidden group shadow-sm"
    >
      {/* Background tint */}
      <div className={`absolute inset-0 bg-gradient-to-br ${variantStyles[variant]} opacity-20`} />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2 rounded bg-muted/50 border border-border/50`}>
            <Icon className={`w-5 h-5 ${iconStyles[variant]}`} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-bold ${trend.isPositive ? 'text-success' : 'text-destructive'
              }`}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{title}</h3>

        <motion.p
          className="metric-value text-foreground font-mono tracking-tight"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: delay + 0.2 }}
        >
          {value}
        </motion.p>

        {subtitle && (
          <p className="text-xs text-muted-foreground mt-2 font-medium">{subtitle}</p>
        )}
      </div>

      {/* Hover border effect or accent */}
      <div className={`absolute bottom-0 left-0 w-full h-[2px] opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r ${variantStyles[variant]}`} />
    </motion.div>
  );
}
