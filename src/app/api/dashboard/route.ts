import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Transaction } from '@/models/transaction';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function monthBounds(year: number, m1: number) {
  // [start, end) em UTC — evita “pular dia” por timezone
  const start = new Date(Date.UTC(year, m1 - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, m1, 1, 0, 0, 0));
  return { start, end };
}

/**
 * Formato do retorno:
 * {
 *   cards: { total, income, expense, biggestExpense },
 *   byMonth: [{ month: '2025-03', income: 1000, expense: 500, total: 500 }, ...],
 *   topExpenses: [{ _id, title, category, amount, date }, ...]
 * }
 */
export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const now = new Date();

  const year = Number(searchParams.get('year') ?? now.getUTCFullYear());
  const month = Number(searchParams.get('month') ?? now.getUTCMonth() + 1);
  const topLimit = Math.max(1, Math.min(20, Number(searchParams.get('topLimit') ?? 5)));

  const { start, end } = monthBounds(year, month);

  // ---- Cards do mês (saldo, entrada, saída, maior gasto) ----
  const [cardsAgg] = await Transaction.aggregate([
    { $match: { date: { $gte: start, $lt: end } } },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        income: { $sum: { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] } },
        expense: { $sum: { $cond: [{ $lt: ['$amount', 0] }, '$amount', 0] } }, // negativo
      },
    },
  ]);

  // Maior gasto (mais negativo) do mês
  const biggestExpenseDoc = await Transaction.find({
    date: { $gte: start, $lt: end },
    amount: { $lt: 0 },
  })
    .sort({ amount: 1 }) // mais negativo primeiro
    .limit(1)
    .lean();

  const biggestExpense = biggestExpenseDoc[0]?.amount ?? 0;

  // ---- Série ANUAL (byMonth) com 12 meses ----
  const yearStart = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
  const yearEnd = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0));

  const grouped = await Transaction.aggregate([
    { $match: { date: { $gte: yearStart, $lt: yearEnd } } },
    {
      $group: {
        _id: {
          y: { $year: { date: '$date' } },
          m: { $month: { date: '$date' } },
        },
        total: { $sum: '$amount' },
        income: { $sum: { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] } },
        expense: { $sum: { $cond: [{ $lt: ['$amount', 0] }, '$amount', 0] } },
      },
    },
    { $sort: { '_id.y': 1, '_id.m': 1 } },
  ]);

  // Normaliza para 12 meses (preenche com zeros se faltar)
  const byMonth: Array<{ month: string; income: number; expense: number; total: number }> = [];
  for (let m = 1; m <= 12; m++) {
    const g = grouped.find((s) => s._id.m === m);
    byMonth.push({
      month: `${year}-${String(m).padStart(2, '0')}`,
      income: g?.income ?? 0,
      expense: g?.expense ?? 0, // negativo
      total: g?.total ?? 0,
    });
  }

  // ---- Top despesas do mês (para lista lateral) ----
  const topExpenses = await Transaction.find({
    date: { $gte: start, $lt: end },
    amount: { $lt: 0 },
  })
    .sort({ amount: 1 }) // mais negativas primeiro
    .limit(topLimit)
    .select({ _id: 1, title: 1, category: 1, amount: 1, date: 1 })
    .lean();

  const topEarnings = await Transaction.find({
    date: { $gte: start, $lt: end },
    amount: { $gt: 0 }, // ganhos (assinado)
    // opcional: type: 'income',  // se quiser reforçar pelo campo type também
  })
    .sort({ amount: -1, date: -1 }) // maiores valores primeiro (desempata por data)
    .limit(topLimit)
    .select({ _id: 1, title: 1, category: 1, amount: 1, date: 1 })
    .lean();

  return NextResponse.json({
    ok: true,
    month: `${year}-${String(month).padStart(2, '0')}`,
    cards: {
      total: cardsAgg?.total ?? 0, // saldo
      income: cardsAgg?.income ?? 0,
      expense: cardsAgg?.expense ?? 0, // negativo
      biggestExpense, // negativo (use Math.abs no UI)
    },
    byMonth,
    topExpenses,
    topEarnings,
  });
}
