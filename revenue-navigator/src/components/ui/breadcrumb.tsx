import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav className={cn('flex items-center gap-2 text-sm', className)} aria-label="Breadcrumb">
      <Link
        to="/app"
        className="flex items-center text-foreground/60 hover:text-primary transition-colors"
      >
        <Home size={16} />
      </Link>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight size={16} className="text-foreground/40" />
          {item.href && index < items.length - 1 ? (
            <Link
              to={item.href}
              className="text-foreground/60 hover:text-primary transition-colors font-black uppercase tracking-wider text-xs"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-black uppercase tracking-wider text-xs">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
