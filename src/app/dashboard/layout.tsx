import type { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-screen bg-black text-white">
			<nav className="p-4 bg-gray-900 border-b border-white/5">Dashboard Navigation</nav>
			<main>{children}</main>
		</div>
	);
}
