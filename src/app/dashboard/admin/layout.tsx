// src/app/dashboard/admin/layout.tsx
import type { ReactNode } from 'react';
import DashboardLayoutComponent from '@/components/dashboard/DashboardLayout';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardLayoutComponent currentPage="users">
      {children}
    </DashboardLayoutComponent>
  );
}