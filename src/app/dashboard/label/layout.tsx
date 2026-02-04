import type { ReactNode } from 'react';
import DashboardLayoutComponent from '@/components/dashboard/DashboardLayout';

export default function LabelLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayoutComponent currentPage="dashboard">
      {children}
    </DashboardLayoutComponent>
  );
}