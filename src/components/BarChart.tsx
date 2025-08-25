'use client';

import { TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

// helper p/ PT-BR
const brl = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

function CorvertNumberToMonth(month: string) {
  // Aceita formatos "2025-01" ou "01"
  const match = month.match(/(\d{2})$/);
  if (!match) return month;
  const monthNumber = parseInt(match[1], 10);
  const date = new Date(2000, monthNumber - 1); // Ano fixo para evitar problemas de data
  return date.toLocaleString('pt-BR', { month: 'short' });
}

/**
 * Props esperadas:
 *  data: Array<{ month: string; income: number; expense: number; total: number }>
 *  title?: string
 *  subtitle?: string
 */
export function ChartBarMultiple({
  data,
  title = 'Receitas x Despesas',
  subtitle,
}: {
  data: { month: string; income: number; expense: number; total: number }[];
  title?: string;
  subtitle?: string;
}) {
  // mapeia o payload da API para o formato do gráfico
  const chartData = (data ?? []).map((d) => ({
    month: CorvertNumberToMonth(d.month),
    income: d.income, // positivo
    expense: Math.abs(d.expense), // tornar positivo para a barra
  }));

  const chartConfig = {
    income: { label: 'Entradas', color: '#2A9D90' },
    expense: { label: 'Saídas', color: '#E76E50' },
  } satisfies ChartConfig;

  return (
    <Card className="w-3/4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle ?? 'Série mensal do ano selecionado'}</CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
            <YAxis tickFormatter={(v) => brl(v).replace('R$', 'R$ ')} width={80} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" labelFormatter={(label) => label} />}
            />
            <Bar dataKey="income" name="income" fill="var(--color-income)" radius={4} />
            <Bar dataKey="expense" name="expense" fill="var(--color-expense)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Tendência do mês <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">Entradas vs. saídas por mês</div>
      </CardFooter>
    </Card>
  );
}
