/* eslint-disable @typescript-eslint/no-explicit-any */
// app/DashboardRoot.tsx (Client Component)
'use client';

import { Header } from '@/components/Header';
import { Cards } from '@/components/Cards';
import { ChartBarMultiple } from '@/components/BarChart';
import { ExpensivesCards } from '@/components/ExpensivesCards';
import { TableTransaction } from '@/components/TableTransaction';
import { BanknoteArrowDown, BanknoteArrowUp, HandCoins, WalletMinimal } from 'lucide-react';
import { useDashboardCtx } from '@/hooks/useDashboard';
import { DashboardProvider } from '@/context/dashboardContext';
import { EarningsCards } from '../EarningsCards';

function DashboardContent() {
  const { data, loading, error } = useDashboardCtx();

  if (loading) return <main className="p-6">Carregando...</main>;
  if (error) return <main className="p-6 text-red-600">Erro ao carregar</main>;
  if (!data) return null;

  const { cards, byMonth, topExpenses, topEarnings } = data;

  return (
    <main>
      <Header />

      <section className="grid grid-cols-4 gap-4 mt-6">
        <Cards
          title="Saldo total"
          amount={String(cards.total)}
          icon={<WalletMinimal className="text-blue-500" />}
          background="bg-blue-100"
        />
        <Cards
          title="Total de Entrada"
          amount={String(cards.income)}
          icon={<BanknoteArrowUp className="text-green-500" />}
          background="bg-green-100"
        />
        <Cards
          title="Total de Saída"
          amount={String(Math.abs(cards.expense))}
          icon={<BanknoteArrowDown className="text-red-500" />}
          background="bg-red-100"
        />
        <Cards
          title="Maior Gasto"
          amount={String(Math.abs(cards.biggestExpense))}
          icon={<HandCoins className="text-yellow-700" />}
          background="bg-yellow-100"
        />
      </section>

      <section className="flex mt-6">
        <ChartBarMultiple data={byMonth} /> {/* adapte seu componente para receber props */}
        <div className="flex w-1/2 flex-col gap-4">
          <div className="ml-4 bg-white p-6 rounded-lg flex flex-col gap-3.5">
            <h3 className="font-semibold text-base text-gray-950">Principais Gastos</h3>
            {topExpenses.map((e: any) => (
              <ExpensivesCards
                key={e._id}
                title={e.description || e.title}
                amount={Math.abs(e.amount)}
                date={new Date(e.date).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit',
                })}
                category={e.category}
              />
            ))}
          </div>

          <div className="ml-4 bg-white p-6 rounded-lg flex flex-col gap-3.5 max-h-96">
            <h3 className="font-semibold text-base text-gray-950">Principais Ganhos</h3>
            {topEarnings.map((e: any) => (
              <EarningsCards
                key={e._id}
                title={e.description || e.title}
                amount={Math.abs(e.amount)}
                date={new Date(e.date).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit',
                })}
                category={e.category}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="flex mt-6 w-full mb-28">
        <div className="bg-white p-6 rounded-lg flex flex-col gap-3.5 w-full">
          <h3 className="font-semibold text-base text-gray-950">Minhas transações</h3>
          <TableTransaction />
        </div>
      </section>
    </main>
  );
}

export default function DashboardRoot({
  initialMonth,
  initialYear,
}: {
  initialMonth: number;
  initialYear: number;
}) {
  return (
    <DashboardProvider initialMonth={initialMonth} initialYear={initialYear}>
      <DashboardContent />
    </DashboardProvider>
  );
}
