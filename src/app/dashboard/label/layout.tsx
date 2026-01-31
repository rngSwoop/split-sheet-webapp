import type { ReactNode } from 'react';
import DashboardLayoutComponent from '@/components/dashboard/DashboardLayout';

export default function LabelLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayoutComponent currentPage="dashboard">
      <header className="glass-card p-6 mb-8">
        <h1 className="text-3xl font-bold gradient-text">Label Dashboard</h1>
      </header>
      {children}
    </DashboardLayoutComponent>
  );
}