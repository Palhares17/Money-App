import { cn } from '@/utils/utils';
import { Plus } from 'lucide-react';
import React from 'react';

export const ButtonNewTransaction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(function ButtonNewTransaction(props, ref) {
  const { className, ...rest } = props;

  return (
    <button
      className={cn(
        'absolute top-6 right-10 px-4 py-2 bg-teal-600 text-white hover:bg-teal-700 transition flex items-center gap-2 rounded-full font-semibold cursor-pointer',
        className
      )}
      ref={ref}
      {...rest}
    >
      <Plus />
      New Transaction
    </button>
  );
});
