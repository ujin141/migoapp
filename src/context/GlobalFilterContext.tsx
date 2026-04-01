import React, { createContext, useContext, useState, useCallback } from "react";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
export type Destination = string | null;


export interface DateRange {
  start: string | null; // ISO date string "YYYY-MM-DD"
  end: string | null;
}

export interface GlobalFilterState {
  destination: Destination;
  dateRange: DateRange;
  groupSize: number | null; // null = any
}

interface GlobalFilterContextValue {
  filters: GlobalFilterState;
  setDestination: (d: Destination) => void;
  setDateRange: (r: DateRange) => void;
  setGroupSize: (n: number | null) => void;
  resetFilters: () => void;
  activeCount: number; // how many filters are active
}

// ──────────────────────────────────────────────
// Default state
// ──────────────────────────────────────────────
const DEFAULT_FILTERS: GlobalFilterState = {
  destination: null,
  dateRange: { start: null, end: null },
  groupSize: null,
};

// ──────────────────────────────────────────────
// Context
// ──────────────────────────────────────────────
const GlobalFilterContext = createContext<GlobalFilterContextValue | undefined>(undefined);

export const GlobalFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<GlobalFilterState>(DEFAULT_FILTERS);

  const setDestination = useCallback((d: Destination) => {
    setFilters((prev) => ({ ...prev, destination: d }));
  }, []);

  const setDateRange = useCallback((r: DateRange) => {
    setFilters((prev) => ({ ...prev, dateRange: r }));
  }, []);

  const setGroupSize = useCallback((n: number | null) => {
    setFilters((prev) => ({ ...prev, groupSize: n }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const activeCount =
    (filters.destination ? 1 : 0) +
    (filters.dateRange.start || filters.dateRange.end ? 1 : 0) +
    (filters.groupSize !== null ? 1 : 0);

  return (
    <GlobalFilterContext.Provider
      value={{ filters, setDestination, setDateRange, setGroupSize, resetFilters, activeCount }}
    >
      {children}
    </GlobalFilterContext.Provider>
  );
};

export const useGlobalFilter = (): GlobalFilterContextValue => {
  const ctx = useContext(GlobalFilterContext);
  if (!ctx) throw new Error("useGlobalFilter must be used within GlobalFilterProvider");
  return ctx;
};
