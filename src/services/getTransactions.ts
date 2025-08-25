import { httpClient } from '@/lib/api';

export type TxType = 'income' | 'expense';

export type Tx = {
  _id: string;
  title: string;
  description?: string;
  amount: number; // assinado (negativo = despesa)
  date: string; // ISO
  category: string;
  type: TxType;
  aiConfidence?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ByMonthResponse = {
  ok: boolean;
  period: { year: number; month: string };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasPrev: boolean;
    hasNext: boolean;
  };
  data: Tx[];
};

export async function getTransactionsByMonth(params: {
  year: number;
  month: number; // 1–12
  page?: number;
  pageSize?: number;
  type?: TxType;
  category?: string;
  minAmount?: number; // assinado
  maxAmount?: number; // assinado
  sort?: string; // '-date' | 'date' | '-amount' | 'amount'
}) {
  const res = await httpClient.get<ByMonthResponse>('/api/transactions/by-month', { params });
  return res.data;
}
