import type { ReactNode } from 'react';
import DashboardLayoutComponent from '@/components/dashboard/DashboardLayout';

export default function DashboardLayout({ children }: { children: ReactNode }) {
	return <DashboardLayoutComponent>{children}</DashboardLayoutComponent>;
}
