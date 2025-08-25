import { DashboardContext } from '@/context/dashboardContext';
import { useContext } from 'react';

export function useDashboardCtx() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboardCtx must be used within DashboardProvider');

  return ctx;
}
