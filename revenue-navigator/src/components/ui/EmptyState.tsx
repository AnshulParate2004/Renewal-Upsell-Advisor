import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Inbox, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
  variant?: 'default' | 'not-found' | 'no-results';
  className?: string;
}

const defaultIcons = {
  default: Inbox,
  'not-found': AlertCircle,
  'no-results': Search,
};

export function EmptyState({
  icon,
  title,
  message,
  action,
  variant = 'default',
  className = '',
}: EmptyStateProps) {
  const IconComponent = defaultIcons[variant];
  const displayIcon = icon || <IconComponent size={48} className="text-foreground/40" />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center h-full p-12 text-center',
        className
      )}
    >
      <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 border-2 border-foreground">
        {displayIcon}
      </div>
      <h3 className="text-2xl font-black text-foreground mb-2 uppercase tracking-tight">
        {title}
      </h3>
      <p className="text-foreground/60 font-bold mb-8 max-w-md">
        {message}
      </p>
      {action && <div>{action}</div>}
    </motion.div>
  );
}
