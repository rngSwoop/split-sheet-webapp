// src/app/dashboard/admin/layout.tsx
import type { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <header className="glass-card p-6 mb-8">
        <h1 className="text-3xl font-bold gradient-text">Admin Dashboard</h1>
      </header>
      <main className="container mx-auto px-6">
        {children}
      </main>
    </div>
  );
}