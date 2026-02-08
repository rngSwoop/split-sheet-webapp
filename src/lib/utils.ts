import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDashboardRoute(role: string | null): string {
  const normalizedRole = (role || '').toLowerCase();
  switch (normalizedRole) {
    case 'admin':
      return '/dashboard/admin';
    case 'label':
      return '/dashboard/label';
    case 'publisher':
      return '/dashboard/artist';
    case 'pro':
      return '/dashboard/artist';
    default:
      return '/dashboard/artist';
  }
}