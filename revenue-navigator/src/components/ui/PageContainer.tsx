import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: boolean;
}

export function PageContainer({ 
  children, 
  className = '',
  maxWidth = true 
}: PageContainerProps) {
  return (
    <div 
      className={cn(
        'p-6 flex flex-col gap-6',
        maxWidth && 'max-w-[1600px] mx-auto',
        className
      )}
    >
      {children}
    </div>
  );
}
