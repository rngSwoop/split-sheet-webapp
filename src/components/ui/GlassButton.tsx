// src/components/ui/GlassButton.tsx
'use client';

import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { Slot } from '@radix-ui/react-slot'; // Install if missing: npm install @radix-ui/react-slot
import { cn } from '@/lib/utils';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: 'default' | 'outline';
  children: ReactNode;
}

const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, children, asChild = false, variant = 'default', ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        className={cn(
          'glass-btn',
          variant === 'outline' && 'bg-transparent border-white/20 hover:bg-white/5',
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);

GlassButton.displayName = 'GlassButton';

export default GlassButton;