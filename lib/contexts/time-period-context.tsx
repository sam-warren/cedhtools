"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { TimePeriod } from "@/types/api";

const STORAGE_KEY = "cedhtools-time-period";
const DEFAULT_TIME_PERIOD: TimePeriod = "6_months";

interface TimePeriodContextValue {
  timePeriod: TimePeriod;
  setTimePeriod: (period: TimePeriod) => void;
}

const TimePeriodContext = createContext<TimePeriodContextValue | undefined>(undefined);

interface TimePeriodProviderProps {
  children: ReactNode;
}

export function TimePeriodProvider({ children }: TimePeriodProviderProps) {
  const [timePeriod, setTimePeriodState] = useState<TimePeriod>(DEFAULT_TIME_PERIOD);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isValidTimePeriod(stored)) {
      setTimePeriodState(stored as TimePeriod);
    }
    setIsHydrated(true);
  }, []);

  // Persist to localStorage when value changes
  const setTimePeriod = (period: TimePeriod) => {
    setTimePeriodState(period);
    localStorage.setItem(STORAGE_KEY, period);
  };

  // Prevent hydration mismatch by using default until hydrated
  const value: TimePeriodContextValue = {
    timePeriod: isHydrated ? timePeriod : DEFAULT_TIME_PERIOD,
    setTimePeriod,
  };

  return (
    <TimePeriodContext.Provider value={value}>
      {children}
    </TimePeriodContext.Provider>
  );
}

export function useTimePeriod(): TimePeriodContextValue {
  const context = useContext(TimePeriodContext);
  if (context === undefined) {
    throw new Error("useTimePeriod must be used within a TimePeriodProvider");
  }
  return context;
}

function isValidTimePeriod(value: string): value is TimePeriod {
  return ["1_month", "3_months", "6_months", "1_year", "all_time"].includes(value);
}

