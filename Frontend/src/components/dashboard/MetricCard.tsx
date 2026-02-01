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
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass-card p-6 relative overflow-hidden group"
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${variantStyles[variant]} opacity-50`} />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${variantStyles[variant]}`}>
            <Icon className={`w-5 h-5 ${iconStyles[variant]}`} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${
              trend.isPositive ? 'text-success' : 'text-destructive'
            }`}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>

        <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
        
        <motion.p 
          className="metric-value text-foreground"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: delay + 0.2 }}
        >
          {value}
        </motion.p>

        {subtitle && (
          <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
        )}
      </div>

      {/* Hover glow effect */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: 'radial-gradient(circle at 50% 50%, hsl(217 91% 60% / 0.1), transparent 70%)',
        }}
      />
    </motion.div>
  );
}
