'use client';

import React from 'react';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTheme } from '@/contexts/ThemeContext';

export interface FilterState {
  search: string;
  minReturn: number;
  maxReturn: number;
  minSharpe: number;
  profitableOnly: boolean;
}

export const DEFAULT_FILTERS: FilterState = {
  search: '',
  minReturn: -100,
  maxReturn: 100,
  minSharpe: -5,
  profitableOnly: false,
};

interface BacktestFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  resultCount: number;
  totalCount: number;
}

export default function BacktestFilters({
  filters,
  onFiltersChange,
  resultCount,
  totalCount,
}: BacktestFiltersProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const hasActiveFilters =
    filters.search !== '' ||
    filters.minReturn !== DEFAULT_FILTERS.minReturn ||
    filters.maxReturn !== DEFAULT_FILTERS.maxReturn ||
    filters.minSharpe !== DEFAULT_FILTERS.minSharpe ||
    filters.profitableOnly;

  const activeFilterCount = [
    filters.search !== '',
    filters.minReturn !== DEFAULT_FILTERS.minReturn || filters.maxReturn !== DEFAULT_FILTERS.maxReturn,
    filters.minSharpe !== DEFAULT_FILTERS.minSharpe,
    filters.profitableOnly,
  ].filter(Boolean).length;

  const clearFilters = () => onFiltersChange({ ...DEFAULT_FILTERS });

  const presets = [
    {
      label: 'Profitable Only',
      apply: () => onFiltersChange({ ...filters, profitableOnly: true, minReturn: 0 }),
      active: filters.profitableOnly,
    },
    {
      label: 'High Sharpe (>1)',
      apply: () => onFiltersChange({ ...filters, minSharpe: 1 }),
      active: filters.minSharpe >= 1,
    },
    {
      label: 'Low Drawdown',
      apply: () => onFiltersChange({ ...filters, maxReturn: 100, minReturn: -20 }),
      active: false,
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2"
            size={16}
            style={{ color: isDark ? '#757575' : '#9E9E9E' }}
          />
          <Input
            placeholder="Search strategies..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-9 text-sm"
            style={{
              backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
              borderColor: isDark ? '#424242' : '#E0E0E0',
              color: isDark ? '#F5F5F5' : '#212121',
            }}
          />
        </div>

        {/* Advanced Filter Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="relative flex items-center gap-2"
              style={{
                borderColor: isDark ? '#424242' : '#E0E0E0',
                color: isDark ? '#E0E0E0' : '#424242',
                backgroundColor: hasActiveFilters
                  ? isDark
                    ? 'rgba(254, 192, 15, 0.1)'
                    : 'rgba(254, 192, 15, 0.08)'
                  : 'transparent',
              }}
            >
              <SlidersHorizontal size={14} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <Badge
                  className="ml-1 h-5 w-5 rounded-full p-0 text-xs"
                  style={{ backgroundColor: '#FEC00F', color: '#212121' }}
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-80 p-4"
            style={{
              backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
              borderColor: isDark ? '#424242' : '#E0E0E0',
            }}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h4
                  className="text-sm font-semibold uppercase tracking-wider"
                  style={{
                    fontFamily: "'Rajdhani', sans-serif",
                    color: isDark ? '#F5F5F5' : '#212121',
                  }}
                >
                  Advanced Filters
                </h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-6 px-2 text-xs"
                    style={{ color: '#FEC00F' }}
                  >
                    Reset
                  </Button>
                )}
              </div>

              {/* Return Range */}
              <div>
                <label
                  className="mb-2 block text-xs font-medium"
                  style={{ color: isDark ? '#9E9E9E' : '#757575' }}
                >
                  Return Range: {filters.minReturn}% to {filters.maxReturn}%
                </label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[filters.minReturn, filters.maxReturn]}
                    min={-100}
                    max={200}
                    step={5}
                    onValueChange={([min, max]) =>
                      onFiltersChange({ ...filters, minReturn: min, maxReturn: max })
                    }
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Sharpe Ratio Min */}
              <div>
                <label
                  className="mb-2 block text-xs font-medium"
                  style={{ color: isDark ? '#9E9E9E' : '#757575' }}
                >
                  Min Sharpe Ratio: {filters.minSharpe.toFixed(1)}
                </label>
                <Slider
                  value={[filters.minSharpe]}
                  min={-5}
                  max={5}
                  step={0.1}
                  onValueChange={([val]) => onFiltersChange({ ...filters, minSharpe: val })}
                />
              </div>

              {/* Profitable Only Toggle */}
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.profitableOnly}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      profitableOnly: e.target.checked,
                      ...(e.target.checked ? { minReturn: Math.max(filters.minReturn, 0) } : {}),
                    })
                  }
                  className="rounded accent-[#FEC00F]"
                />
                <span
                  className="text-sm"
                  style={{ color: isDark ? '#E0E0E0' : '#424242' }}
                >
                  Profitable strategies only
                </span>
              </label>
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear all */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="flex items-center gap-1"
            style={{ color: isDark ? '#9E9E9E' : '#757575' }}
          >
            <X size={14} />
            Clear
          </Button>
        )}
      </div>

      {/* Quick presets + result count */}
      <div className="flex flex-wrap items-center gap-2">
        {presets.map((preset) => (
          <Badge
            key={preset.label}
            variant={preset.active ? 'default' : 'outline'}
            className="cursor-pointer text-xs transition-colors"
            style={
              preset.active
                ? { backgroundColor: '#FEC00F', color: '#212121' }
                : {
                    borderColor: isDark ? '#424242' : '#E0E0E0',
                    color: isDark ? '#9E9E9E' : '#757575',
                  }
            }
            onClick={preset.apply}
          >
            <Filter size={10} className="mr-1" />
            {preset.label}
          </Badge>
        ))}
        <span className="ml-auto text-xs" style={{ color: isDark ? '#757575' : '#9E9E9E' }}>
          {resultCount} of {totalCount} backtests
        </span>
      </div>
    </div>
  );
}
