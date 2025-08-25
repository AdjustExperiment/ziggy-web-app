import React, { useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualTableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T;
    header: string;
    render?: (value: any, item: T) => React.ReactNode;
  }>;
  rowHeight?: number;
  containerHeight?: number;
  className?: string;
}

export function VirtualTable<T extends Record<string, any>>({
  data,
  columns,
  rowHeight = 60,
  containerHeight = 400,
  className = ''
}: VirtualTableProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  const items = virtualizer.getVirtualItems();

  const paddingTop = items.length > 0 ? items[0]?.start || 0 : 0;
  const paddingBottom = items.length > 0 
    ? virtualizer.getTotalSize() - (items[items.length - 1]?.end || 0) 
    : 0;

  return (
    <div className={`border rounded-lg ${className}`}>
      {/* Header */}
      <div className="grid gap-4 p-4 border-b bg-muted/50 font-medium text-sm">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
          {columns.map((column) => (
            <div key={String(column.key)} className="text-left">
              {column.header}
            </div>
          ))}
        </div>
      </div>

      {/* Virtual Container */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: `${containerHeight}px` }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {paddingTop > 0 && (
            <div style={{ height: paddingTop }} />
          )}
          
          {items.map((virtualItem) => {
            const item = data[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start - paddingTop}px)`,
                }}
                className="border-b last:border-b-0"
              >
                <div className="grid gap-4 p-4 items-center h-full" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
                  {columns.map((column) => (
                    <div key={String(column.key)} className="text-sm">
                      {column.render 
                        ? column.render(item[column.key], item)
                        : String(item[column.key] || '')
                      }
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          
          {paddingBottom > 0 && (
            <div style={{ height: paddingBottom }} />
          )}
        </div>
      </div>
    </div>
  );
}