'use client';

import React, { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown, Trash2, Eye, Download } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useTheme } from '@/contexts/ThemeContext';
import type { BacktestResult } from '@/types/api';

function formatPercent(value: number | undefined, abs = false): string {
  if (value === undefined || value === null) return '-';
  const v = abs ? Math.abs(value) : value;
  return `${(v * 100).toFixed(2)}%`;
}

function formatNumber(value: number | undefined): string {
  if (value === undefined || value === null) return '-';
  return value.toFixed(2);
}

interface BacktestTableProps {
  data: BacktestResult[];
  onSelect: (backtest: BacktestResult) => void;
  onDelete: (index: number) => void;
  onExport: () => void;
  selectedId?: string;
}

export default function BacktestTable({
  data,
  onSelect,
  onDelete,
  onExport,
  selectedId,
}: BacktestTableProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<BacktestResult>[]>(
    () => [
      {
        accessorKey: 'strategy_id',
        header: ({ column }) => (
          <SortHeader column={column} label="Strategy" isDark={isDark} />
        ),
        cell: ({ row }) => {
          const id = row.original.strategy_id;
          return (
            <span
              className="font-medium"
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                color: isDark ? '#F5F5F5' : '#212121',
              }}
            >
              {id ? id.slice(0, 10) + '...' : 'Unknown'}
            </span>
          );
        },
      },
      {
        id: 'total_return',
        accessorFn: (row) => row.total_return ?? row.metrics?.cagr ?? 0,
        header: ({ column }) => (
          <SortHeader column={column} label="Return" isDark={isDark} />
        ),
        cell: ({ getValue }) => {
          const value = getValue<number>();
          return (
            <span
              className="font-semibold tabular-nums"
              style={{ color: value >= 0 ? '#22C55E' : '#EF4444' }}
            >
              {formatPercent(value)}
            </span>
          );
        },
      },
      {
        id: 'win_rate',
        accessorFn: (row) => row.win_rate ?? row.metrics?.win_rate ?? 0,
        header: ({ column }) => (
          <SortHeader column={column} label="Win Rate" isDark={isDark} />
        ),
        cell: ({ getValue }) => {
          const value = getValue<number>();
          return (
            <span
              className="tabular-nums"
              style={{ color: value > 0.5 ? '#3B82F6' : isDark ? '#9E9E9E' : '#757575' }}
            >
              {formatPercent(value)}
            </span>
          );
        },
      },
      {
        id: 'sharpe_ratio',
        accessorFn: (row) => row.sharpe_ratio ?? row.metrics?.sharpe_ratio ?? 0,
        header: ({ column }) => (
          <SortHeader column={column} label="Sharpe" isDark={isDark} />
        ),
        cell: ({ getValue }) => {
          const value = getValue<number>();
          const color = value >= 2 ? '#22C55E' : value >= 1 ? '#FEC00F' : value >= 0 ? '#F59E0B' : '#EF4444';
          return (
            <span className="tabular-nums" style={{ color }}>
              {formatNumber(value)}
            </span>
          );
        },
      },
      {
        id: 'max_drawdown',
        accessorFn: (row) => row.max_drawdown ?? row.metrics?.max_drawdown ?? 0,
        header: ({ column }) => (
          <SortHeader column={column} label="Max DD" isDark={isDark} />
        ),
        cell: ({ getValue }) => {
          const value = getValue<number>();
          return (
            <span className="tabular-nums" style={{ color: '#EF4444' }}>
              {formatPercent(value, true)}
            </span>
          );
        },
      },
      {
        id: 'profit_factor',
        accessorFn: (row) => row.metrics?.profit_factor ?? null,
        header: ({ column }) => (
          <SortHeader column={column} label="PF" isDark={isDark} />
        ),
        cell: ({ getValue }) => {
          const value = getValue<number | null>();
          if (value === null) return <span style={{ color: isDark ? '#555' : '#CCC' }}>-</span>;
          return (
            <span className="tabular-nums" style={{ color: isDark ? '#E0E0E0' : '#424242' }}>
              {formatNumber(value)}
            </span>
          );
        },
      },
      {
        id: 'total_trades',
        accessorFn: (row) => row.metrics?.total_trades ?? null,
        header: ({ column }) => (
          <SortHeader column={column} label="Trades" isDark={isDark} />
        ),
        cell: ({ getValue }) => {
          const value = getValue<number | null>();
          if (value === null) return <span style={{ color: isDark ? '#555' : '#CCC' }}>-</span>;
          return (
            <span className="tabular-nums" style={{ color: isDark ? '#E0E0E0' : '#424242' }}>
              {value}
            </span>
          );
        },
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => (
          <SortHeader column={column} label="Date" isDark={isDark} />
        ),
        cell: ({ getValue }) => (
          <span className="text-xs" style={{ color: isDark ? '#757575' : '#9E9E9E' }}>
            {new Date(getValue<string>()).toLocaleDateString()}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => null,
        cell: ({ row }) => {
          const idx = data.indexOf(row.original);
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(row.original);
                }}
                title="View details"
              >
                <Eye size={14} style={{ color: '#FEC00F' }} />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={(e) => e.stopPropagation()}
                    title="Delete"
                  >
                    <Trash2 size={14} style={{ color: '#EF4444' }} />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent
                  style={{
                    backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                    borderColor: isDark ? '#424242' : '#E0E0E0',
                  }}
                >
                  <AlertDialogHeader>
                    <AlertDialogTitle style={{ color: isDark ? '#F5F5F5' : '#212121' }}>
                      Delete Backtest
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove this backtest result. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(idx)}
                      style={{ backgroundColor: '#EF4444', color: '#FFFFFF' }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        },
      },
    ],
    [isDark, data, onSelect, onDelete]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3
          className="text-sm font-semibold uppercase tracking-wider"
          style={{
            fontFamily: "'Rajdhani', sans-serif",
            color: isDark ? '#F5F5F5' : '#212121',
          }}
        >
          Results
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="flex items-center gap-2"
          style={{
            borderColor: isDark ? '#424242' : '#E0E0E0',
            color: isDark ? '#E0E0E0' : '#424242',
          }}
        >
          <Download size={14} />
          Export CSV
        </Button>
      </div>

      <div
        className="overflow-auto rounded-lg border"
        style={{
          borderColor: isDark ? '#333' : '#E5E5E5',
          backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
        }}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                style={{ borderColor: isDark ? '#333' : '#E5E5E5' }}
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="whitespace-nowrap text-xs"
                    style={{
                      backgroundColor: isDark ? '#161616' : '#FAFAFA',
                      color: isDark ? '#9E9E9E' : '#757575',
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-8 text-center text-sm"
                  style={{ color: isDark ? '#757575' : '#9E9E9E' }}
                >
                  No backtests match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer transition-colors"
                  style={{
                    borderColor: isDark ? '#333' : '#E5E5E5',
                    backgroundColor:
                      row.original.id === selectedId
                        ? isDark
                          ? 'rgba(254,192,15,0.08)'
                          : 'rgba(254,192,15,0.06)'
                        : 'transparent',
                  }}
                  onClick={() => onSelect(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Helper: sortable header
function SortHeader({
  column,
  label,
  isDark,
}: {
  column: any;
  label: string;
  isDark: boolean;
}) {
  const sorted = column.getIsSorted();
  return (
    <button
      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider"
      style={{ color: isDark ? '#9E9E9E' : '#757575' }}
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {label}
      {sorted === 'asc' ? (
        <ArrowUp size={12} style={{ color: '#FEC00F' }} />
      ) : sorted === 'desc' ? (
        <ArrowDown size={12} style={{ color: '#FEC00F' }} />
      ) : (
        <ArrowUpDown size={12} style={{ opacity: 0.4 }} />
      )}
    </button>
  );
}
