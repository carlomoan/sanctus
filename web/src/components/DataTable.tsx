import { useState, useMemo, useCallback } from 'react';
import { CheckSquare, Square, ChevronLeft, ChevronRight } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
  sortKey?: (item: T) => string | number;
  minWidth?: string;
}

export interface BulkAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (selectedItems: T[]) => void;
  variant?: 'default' | 'danger';
  requireConfirm?: boolean;
  confirmMessage?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  bulkActions?: BulkAction<T>[];
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyMessage?: string;
  pageSize?: number;
  onRowClick?: (item: T) => void;
  rowClassName?: (item: T) => string;
  stickyActions?: boolean;
}

export default function DataTable<T>({
  data,
  columns,
  keyField,
  bulkActions = [],
  emptyIcon,
  emptyTitle = 'No data found',
  emptyMessage = '',
  pageSize = 25,
  onRowClick,
  rowClassName,
  stickyActions: _stickyActions = false,
}: DataTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [, setShowBulkMenu] = useState(false);

  const sortedData = useMemo(() => {
    if (!sortCol) return data;
    const col = columns.find(c => c.key === sortCol);
    if (!col?.sortKey) return data;
    const fn = col.sortKey;
    return [...data].sort((a, b) => {
      const va = fn(a);
      const vb = fn(b);
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortCol, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const pagedData = sortedData.slice(page * pageSize, (page + 1) * pageSize);

  const allPageIds = pagedData.map(item => String(item[keyField]));
  const allSelected = allPageIds.length > 0 && allPageIds.every(id => selectedIds.has(id));
  const someSelected = allPageIds.some(id => selectedIds.has(id));

  const toggleAll = useCallback(() => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        allPageIds.forEach(id => next.delete(id));
      } else {
        allPageIds.forEach(id => next.add(id));
      }
      return next;
    });
  }, [allPageIds, allSelected]);

  const toggleOne = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSort = (colKey: string) => {
    const col = columns.find(c => c.key === colKey);
    if (!col?.sortable) return;
    if (sortCol === colKey) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(colKey);
      setSortDir('asc');
    }
  };

  const selectedItems = data.filter(item => selectedIds.has(String(item[keyField])));

  const handleBulkAction = (action: BulkAction<T>) => {
    if (action.requireConfirm) {
      if (!confirm(action.confirmMessage || `Are you sure you want to perform "${action.label}" on ${selectedItems.length} items?`)) return;
    }
    action.onClick(selectedItems);
    setSelectedIds(new Set());
    setShowBulkMenu(false);
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-100">
        {emptyIcon && <div className="mx-auto w-12 h-12 flex items-center justify-center mb-4 text-gray-300">{emptyIcon}</div>}
        <h3 className="text-lg font-medium text-gray-900">{emptyTitle}</h3>
        {emptyMessage && <p className="text-gray-500 mt-1">{emptyMessage}</p>}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      {/* Bulk action bar */}
      {selectedIds.size > 0 && bulkActions.length > 0 && (
        <div className="px-4 py-2.5 bg-primary-50 border-b border-primary-100 flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm font-medium text-primary-700">
            {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {bulkActions.map((action, i) => (
              <button
                key={i}
                onClick={() => handleBulkAction(action)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${action.variant === 'danger'
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-primary-600 hover:text-primary-800 ml-2"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {bulkActions.length > 0 && (
                <th className="w-10 px-3 py-3">
                  <button onClick={toggleAll} className="text-gray-400 hover:text-primary-600">
                    {allSelected ? <CheckSquare size={16} className="text-primary-600" /> : someSelected ? <CheckSquare size={16} className="text-primary-300" /> : <Square size={16} />}
                  </button>
                </th>
              )}
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap ${col.sortable ? 'cursor-pointer select-none hover:text-gray-700' : ''} ${col.headerClassName || ''}`}
                  style={col.minWidth ? { minWidth: col.minWidth } : undefined}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortCol === col.key && (
                      <span className="text-primary-500">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pagedData.map(item => {
              const id = String(item[keyField]);
              const isSelected = selectedIds.has(id);
              return (
                <tr
                  key={id}
                  className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-primary-50/50' : ''} ${onRowClick ? 'cursor-pointer' : ''} ${rowClassName?.(item) || ''}`}
                  onClick={() => onRowClick?.(item)}
                >
                  {bulkActions.length > 0 && (
                    <td className="w-10 px-3 py-3" onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleOne(id)} className="text-gray-400 hover:text-primary-600">
                        {isSelected ? <CheckSquare size={16} className="text-primary-600" /> : <Square size={16} />}
                      </button>
                    </td>
                  )}
                  {columns.map(col => (
                    <td key={col.key} className={`px-3 py-3 ${col.className || ''}`}>
                      {col.render(item)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sortedData.length)} of {sortedData.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i;
              } else if (page < 3) {
                pageNum = i;
              } else if (page > totalPages - 4) {
                pageNum = totalPages - 5 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-8 h-8 rounded text-xs font-medium ${page === pageNum ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
