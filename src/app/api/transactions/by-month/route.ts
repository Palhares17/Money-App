/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Transaction } from '@/models/transaction';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function monthBounds(year: number, m1: number) {
  // intervalo [start, end) em UTC
  const start = new Date(Date.UTC(year, m1 - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, m1, 1, 0, 0, 0));
  return { start, end };
}

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);

  // mês/ano
  const now = new Date();
  const year = Number(searchParams.get('year') ?? now.getUTCFullYear());
  const month = Number(searchParams.get('month') ?? now.getUTCMonth() + 1);

  // paginação
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') ?? 20)));
  const skip = (page - 1) * pageSize;

  // filtros opcionais
  const type = searchParams.get('type'); // 'income' | 'expense'
  const category = searchParams.get('category'); // ex.: 'Mercado'
  const minAmt = searchParams.get('minAmount'); // assinado
  const maxAmt = searchParams.get('maxAmount');

  const { start, end } = monthBounds(year, month);

  const where: any = { date: { $gte: start, $lt: end } };
  if (type === 'income' || type === 'expense') where.type = type;
  if (category) where.category = category;
  if (minAmt) where.amount = { ...(where.amount || {}), $gte: Number(minAmt) };
  if (maxAmt) where.amount = { ...(where.amount || {}), $lte: Number(maxAmt) };

  // ordenação (default: data desc)
  const sortParam = searchParams.get('sort') ?? '-date'; // ex.: '-date', 'date', '-amount', 'amount'
  const sort: Record<string, 1 | -1> = {};
  const field = sortParam.replace(/^-/, '');
  sort[field] = sortParam.startsWith('-') ? -1 : 1;

  // total + somatórios do mês (para paginação e cards auxiliares)
  const [metaAgg] = await Transaction.aggregate([
    { $match: where },
    {
      $group: {
        _id: null,
        totalCount: { $sum: 1 },
        total: { $sum: '$amount' },
        income: { $sum: { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] } },
        expense: { $sum: { $cond: [{ $lt: ['$amount', 0] }, '$amount', 0] } },
      },
    },
  ]);

  const total = metaAgg?.totalCount ?? 0;

  // listagem paginada
  const items = await Transaction.find(where)
    .sort(sort)
    .skip(skip)
    .limit(pageSize)
    .select({ __v: 0 }) // opcional
    .lean();

  return NextResponse.json({
    ok: true,
    period: { year, month: String(month).padStart(2, '0') },
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      hasPrev: page > 1,
      hasNext: page * pageSize < total,
    },
    data: items,
  });
}
