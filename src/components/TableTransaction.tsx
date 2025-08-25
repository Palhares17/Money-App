/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useMemo } from 'react';
import {
  Clapperboard,
  ShoppingCart,
  Utensils,
  CarFront,
  HeartPlus,
  CreditCard,
  Notebook,
  House,
  BriefcaseBusiness,
  BanknoteArrowDown,
  BanknoteArrowUp,
} from 'lucide-react';
import { cn } from '@/utils/utils';
import { useDashboardCtx } from '@/hooks/useDashboard';

const GRID_TEMPLATE = 'grid-cols-[1fr_2fr_1fr_1fr] sm:grid-cols-[1.5fr_3fr_1fr_1fr]';

const brl = (n: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(n);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });

export function CategoryIcon(category: string | undefined) {
  switch (category) {
    case 'Transporte':
      return { Icon: CarFront, bg: 'bg-teal-100', fg: 'text-teal-800' };
    case 'Alimentação':
      return { Icon: Utensils, bg: 'bg-orange-100', fg: 'text-orange-800' };
    case 'Mercado':
      return { Icon: ShoppingCart, bg: 'bg-emerald-100', fg: 'text-emerald-800' };
    case 'Streaming':
      return { Icon: Clapperboard, bg: 'bg-blue-100', fg: 'text-blue-800' };
    case 'Saúde':
      return { Icon: HeartPlus, bg: 'bg-rose-100', fg: 'text-rose-800' };
    case 'Lazer':
      return { Icon: CarFront, bg: 'bg-yellow-100', fg: 'text-yellow-800' };
    case 'Assinaturas':
      return { Icon: CreditCard, bg: 'bg-purple-100', fg: 'text-purple-800' };
    case 'Educação':
      return { Icon: Notebook, bg: 'bg-violet-100', fg: 'text-violet-800' };
    case 'Moradia':
      return { Icon: House, bg: 'bg-indigo-100', fg: 'text-indigo-800' };
    case 'Serviços':
      return { Icon: BriefcaseBusiness, bg: 'bg-stone-100', fg: 'text-stone-800' };
    case 'Entradas':
      return { Icon: BanknoteArrowUp, bg: 'bg-green-100', fg: 'text-green-800' };
    case 'Outros':
      return { Icon: BanknoteArrowDown, bg: 'bg-cyan-100', fg: 'text-cyan-800' };
    default:
      return { Icon: BanknoteArrowDown, bg: 'bg-pink-100', fg: 'text-pink-800' };
  }
}

function HeaderTable() {
  return (
    <div
      className={cn(
        'grid',
        GRID_TEMPLATE,
        'items-center gap-4 text-xs sm:text-sm font-medium text-muted-foreground bg-gray-100 px-2 py-4 rounded-lg'
      )}
      role="row"
    >
      <div className="col-span-1" role="columnheader">
        Categoria
      </div>
      <div role="columnheader">Nome</div>
      <div role="columnheader">Data</div>
      <div className="text-right" role="columnheader">
        Valor
      </div>
    </div>
  );
}

function Row({
  tx,
}: {
  tx: {
    _id: string;
    category?: string;
    title: string;
    date: string;
    amount: number;
    description: string;
  };
}) {
  const { Icon, bg, fg } = CategoryIcon(tx.category);
  const isExpense = tx.amount < 0;
  return (
    <div
      className={cn(
        'grid',
        GRID_TEMPLATE,
        'items-center gap-4 text-sm text-muted-foreground px-2 h-14'
      )}
      role="row"
    >
      {/* Categoria */}
      <div className="col-span-1 flex items-center gap-4 min-w-0">
        <div className={cn('rounded-lg w-10 h-10 shrink-0 flex items-center justify-center', bg)}>
          <Icon className={cn('w-5 h-5', fg)} />
        </div>
        <p className="truncate">{tx.category ?? '—'}</p>
      </div>

      {/* Nome */}
      <div className="min-w-0 w-full">
        <span className="truncate block">{tx.description}</span>
      </div>

      {/* Data */}
      <div className="whitespace-nowrap">{fmtDate(tx.date)}</div>

      {/* Valor */}
      <div
        className={cn(
          'text-right text-sm font-medium whitespace-nowrap',
          isExpense ? 'text-red-600' : 'text-green-700'
        )}
      >
        {isExpense ? '-' : ''} {brl(Math.abs(tx.amount))}
      </div>
    </div>
  );
}

export function TableTransaction() {
  const { transactions, page, handleNextPage, handlePrevPage } = useDashboardCtx();

  const hasData = useMemo(() => transactions && transactions.length > 0, [transactions]);

  return (
    <section className="bg-white rounded-lg w-full">
      <div className="overflow-x-auto">
        <div className="space-y-2">
          <HeaderTable />

          {!hasData && (
            <div className="p-6 text-sm text-muted-foreground">
              Nenhuma transação neste período.
            </div>
          )}

          {hasData && transactions.map((t: any) => <Row key={t._id} tx={t} />)}

          {/* Paginação simples */}
          <div className="flex items-center justify-between py-3">
            <button
              onClick={handlePrevPage}
              className="px-3 py-1 border rounded disabled:opacity-50"
              disabled={page <= 1}
            >
              Anterior
            </button>
            <span className="text-xs text-gray-500">Página {page}</span>
            <button onClick={handleNextPage} className="px-3 py-1 border rounded">
              Próxima
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
