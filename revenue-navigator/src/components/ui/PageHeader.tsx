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
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex items-end justify-between shrink-0 pb-6 border-b-4 border-foreground ${className}`}
    >
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-5xl font-black text-foreground tracking-tight leading-none uppercase">
            {title}
          </h1>
          {badge && (
            <div className="sticker-outline px-3 py-1 text-xs">
              {badge}
            </div>
          )}
        </div>
        {subtitle && (
          <p className="text-sm font-black text-foreground/60 mt-2 uppercase tracking-wider">
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
