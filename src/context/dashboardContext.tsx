/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { createContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { getDashboard } from '@/services/getDashboard';
import { getTransactionsByMonth } from '@/services/getTransactions';

type Ctx = {
  setDate: (d: Date | undefined) => void;
  date: Date | undefined;
  month: number; // 1-12
  year: number;
  setPeriod: (p: { month: number; year: number }) => void;
  nextMonth: () => void;
  prevMonth: () => void;
  data: any | null;
  loading: boolean;
  error: unknown;
  refresh: () => void;
  transactions: any[];
  page: number;
  handleNextPage: () => void;
  handlePrevPage: () => void;
};

export const DashboardContext = createContext<Ctx | null>(null);

function clampMonth(m: number) {
  if (m < 1) return 1;
  if (m > 12) return 12;
  return m;
}

export function DashboardProvider({
  initialMonth,
  initialYear,
  children,
}: {
  initialMonth: number;
  initialYear: number;
  children: ReactNode;
}) {
  const [month, setMonth] = useState(clampMonth(initialMonth));
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [year, setYear] = useState(initialYear);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [tick, setTick] = useState(0);

  const [page, setPage] = useState(1);
  const [transactions, setTransactions] = useState<any[]>([]);

  const handleNextPage = () => setPage((p) => p + 1);
  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));

  const setPeriod = ({ month, year }: { month: number; year: number }) => {
    setMonth(clampMonth(month));
    setYear(year);
  };

  const nextMonth = () => {
    setMonth((m) => {
      if (m === 12) {
        setYear((y) => y + 1);
        return 1;
      }
      return m + 1;
    });
  };

  const prevMonth = () => {
    setMonth((m) => {
      if (m === 1) {
        setYear((y) => y - 1);
        return 12;
      }
      return m - 1;
    });
  };

  const refresh = () => setTick((t) => t + 1);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getDashboard({ month, year })
      .then((d) => {
        if (mounted) {
          setData(d);
          setError(null);
        }
      })
      .catch((e) => {
        if (mounted) setError(e);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [month, year, tick]);

  useEffect(() => {
    setLoading(true);
    getTransactionsByMonth({
      month: initialMonth,
      year: initialYear,
      pageSize: 10,
      page: page,
      sort: '-date',
    })
      .then((d) => {
        setTransactions(d.data);
      })
      .catch((e) => {
        setError(e);
      })
      .finally(() => setLoading(false));
  }, [page, initialMonth, initialYear]);

  const value = useMemo<Ctx>(
    () => ({
      setDate,
      date,
      month,
      year,
      setPeriod,
      nextMonth,
      prevMonth,
      data,
      loading,
      error,
      refresh,
      handleNextPage,
      handlePrevPage,
      page,
      transactions,
    }),
    [month, year, data, loading, error, page, transactions, date]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}
