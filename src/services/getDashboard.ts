import { httpClient } from '@/lib/api';

interface DashboardParams {
  month: number;
  year: number;
}

interface DashboardResponse {
  ok: boolean;
  month: string;
  cards: {
    total: number;
    income: number;
    expense: number;
    biggestExpense: number;
  };
  byMonth: Array<{ month: string; income: number; expense: number; total: number }>;
  topExpenses: Array<{
    _id: string;
    title: string;
    category: string;
    amount: number;
    date: string;
  }>;
}

export async function getDashboard({ month, year }: DashboardParams) {
  try {
    const { data } = await httpClient.get<DashboardResponse>('/api/dashboard', {
      params: { month, year },
    });
    return data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
}
