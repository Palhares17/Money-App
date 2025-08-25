import { cn } from '@/utils/utils';

interface CardsProps {
  title?: string;
  amount?: string;
  icon?: React.ReactNode;
  background?: string;
}

const brl = (n: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

export function Cards({ title, amount, icon, background }: CardsProps) {
  return (
    <section className="flex gap-4 bg-white p-6 rounded-lg items-center ">
      <div className={cn('p-4 rounded-lg', background)}>{icon}</div>

      <div>
        <span className="text-sm text-gray-700 font-medium">{title}</span>
        <h3 className="text-lg text-gray-950 font-semibold">{brl(Number(amount ?? 0))}</h3>
      </div>
    </section>
  );
}
