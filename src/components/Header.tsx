import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ButtonNewTransaction } from './ButtonNewTransaction';
import { InputFile } from './InputFile';
import { useDashboardCtx } from '@/hooks/useDashboard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Header() {
  const { month, year, nextMonth, prevMonth } = useDashboardCtx();

  const formatMonth = (month: number) => {
    switch (month) {
      case 1:
        return 'Janeiro';
      case 2:
        return 'Fevereiro';
      case 3:
        return 'Março';
      case 4:
        return 'Abril';
      case 5:
        return 'Maio';
      case 6:
        return 'Junho';
      case 7:
        return 'Julho';
      case 8:
        return 'Agosto';
      case 9:
        return 'Setembro';
      case 10:
        return 'Outubro';
      case 11:
        return 'Novembro';
      case 12:
        return 'Dezembro';
      default:
        return '';
    }
  };
  return (
    <header>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <ButtonNewTransaction />
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar suas transações:</AlertDialogTitle>

            <InputFile />
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center gap-2 mt-20">
        <button onClick={prevMonth} className="cursor-pointer">
          <ChevronLeft />
        </button>
        <h3 className="text-2xl font-semibold ">
          {formatMonth(month)} <span className="text-green-500">/</span> {year}
        </h3>
        <button onClick={nextMonth} className="cursor-pointer">
          <ChevronRight />
        </button>
      </div>
    </header>
  );
}
