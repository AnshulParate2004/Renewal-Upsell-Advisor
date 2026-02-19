import { ReactNode, useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  sortable?: boolean;
  className?: string;
  emptyMessage?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable<T extends { id: string }>({
  columns,
  data,
  onRowClick,
  sortable = false,
  className = '',
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const sortedData = useMemo(() => {
    if (!sortable || !sortKey || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aValue = (a as any)[sortKey];
      const bValue = (b as any)[sortKey];

      if (aValue === bValue) return 0;

      const comparison = aValue > bValue ? 1 : -1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection, sortable]);

  const handleSort = (key: string) => {
    if (!sortable) return;

    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: Column<T>) => {
    if (!sortable || !column.sortable) return null;
    if (sortKey !== column.key) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-1" />
      : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  return (
    <div className={cn('paper-card table-container overflow-hidden bg-white p-0', className)}>
      <div className="overflow-auto flex-1 relative custom-scrollbar">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-accent border-b-4 border-foreground">
            <tr className="text-[10px] uppercase text-white font-black tracking-widest text-left">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'py-4',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.align === 'left' && 'pl-6',
                    !column.align && 'pl-6',
                    column.width && `w-[${column.width}]`
                  )}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {sortable && column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="flex items-center hover:text-white/80 transition-colors"
                    >
                      {column.label}
                      {getSortIcon(column)}
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-foreground">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-12 text-center">
                  <p className="text-foreground/60 font-black uppercase tracking-wider">
                    {emptyMessage}
                  </p>
                </td>
              </tr>
            ) : (
              sortedData.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    'group transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-primary/10'
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        'py-4',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right',
                        column.align === 'left' && 'pl-6',
                        !column.align && 'pl-6'
                      )}
                    >
                      {column.render ? column.render(item) : String((item as any)[column.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
