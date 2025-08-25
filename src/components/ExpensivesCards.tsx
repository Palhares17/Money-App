import { cn } from '@/utils/utils';
import { CategoryIcon } from './TableTransaction';

export function ExpensivesCards({
  title,
  date,
  amount,
  category,
}: {
  date: string;
  title: string;
  amount: number;
  category: string;
}) {
  const { Icon, bg, fg } = CategoryIcon(category);

  return (
    <section className="flex gap-4 justify-between items-start">
      <div className="flex gap-4 items-center">
        <div className={cn('rounded-lg w-10 h-10 shrink-0 flex items-center justify-center', bg)}>
          <Icon className={cn('w-5 h-5', fg)} />
        </div>

        <div>
          <h3 className="text-sm text-gray-950 font-bold">{title}</h3>
          <span className="text-xs text-gray-700 font-medium">{date}</span>
        </div>
      </div>

      <div>
        <p className="text-sm text-red-500 font-medium">R$ -{amount}</p>
      </div>
    </section>
  );
}
