// src/app/dashboard/admin/layout.tsx
import type { ReactNode } from 'react';
import DashboardLayoutComponent from '@/components/dashboard/DashboardLayout';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayoutComponent currentPage="users">
      <header className="glass-card p-6 mb-8">
        <h1 className="text-3xl font-bold gradient-text">Admin Dashboard</h1>
      </header>
      {children}
    </DashboardLayoutComponent>
  );
}