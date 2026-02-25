import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide',
  {
    variants: {
      variant: {
        default: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
        gold: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40',
        silver: 'bg-zinc-500/20 text-zinc-300 border border-zinc-500/40',
        bronze: 'bg-amber-700/20 text-amber-500 border border-amber-700/40',
        success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
        destructive: 'bg-red-500/20 text-red-400 border border-red-500/40',
        info: 'bg-blue-500/20 text-blue-400 border border-blue-500/40',
        bust: 'bg-red-900/50 text-red-400 border border-red-800/50',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
