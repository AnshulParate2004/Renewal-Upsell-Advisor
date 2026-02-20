import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ 
  title, 
  subtitle, 
  badge, 
  actions,
  className = '' 
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`flex items-end justify-between shrink-0 pb-5 border-b border-border ${className}`}
    >
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">
            {title}
          </h1>
          {badge && (
            <span className="px-2.5 py-0.5 bg-primary/10 text-primary border border-black rounded-md text-[11px] font-black uppercase tracking-wider">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </motion.div>
  );
}
