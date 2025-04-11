import * as React from 'react';
import { cn } from '@/lib/utils';

const Kbd = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <kbd
        ref={ref}
        className={cn(
          'px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted border border-input rounded-md shadow-sm',
          className,
        )}
        {...props}
      >
        {children}
      </kbd>
    );
  },
);
Kbd.displayName = 'Kbd';

export { Kbd };
