'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, FileText, Music, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabaseClient } from '@/lib/supabase/client';
import { getCurrentUserRoleClient, UserRole } from '@/lib/auth-client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ConfirmDeleteModal from '@/components/ui/ConfirmDeleteModal';

interface SplitSheet {
  id: string;
  status: string;
  totalPercentage: number;
  createdBy: string | null;
  createdAt: string;
  song: {
    finalTitle: string;
    workingTitle: string | null;
  };
  contributors: {
    id: string;
    legalName: string;
    stageName: string | null;
    percentage: number;
  }[];
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-yellow-500/20 text-yellow-400',
  PENDING: 'bg-blue-500/20 text-blue-400',
  SIGNED: 'bg-green-500/20 text-green-400',
  PUBLISHED: 'bg-violet-500/20 text-violet-400',
  REVERSED: 'bg-red-500/20 text-red-400',
  DISPUTED: 'bg-orange-500/20 text-orange-400',
};

export default function SplitsListPage() {
  const [splits, setSplits] = useState<SplitSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('ARTIST');
  const [deleteTarget, setDeleteTarget] = useState<SplitSheet | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        // Fetch user identity + role
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) setCurrentUserId(user.id);
        const role = await getCurrentUserRoleClient();
        setUserRole(role);

        const res = await fetch('/api/splits?mentioned=true');
        if (!res.ok) {
          setError('Failed to load split sheets');
          return;
        }
        const data = await res.json();
        setSplits(data.splits || []);
      } catch {
        setError('Failed to load split sheets');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const canDelete = (split: SplitSheet) => {
    if (userRole === 'ADMIN') return true;
    if (split.createdBy === currentUserId && split.status !== 'SIGNED') return true;
    return false;
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/splits/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to delete split sheet');
        return;
      }
      setSplits((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      setError('Failed to delete split sheet');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout currentPage="my-splits">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="my-splits">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">My Split Sheets</h1>
          <button
            onClick={() => router.push('/splits/new')}
            className="glass-btn flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> New Split Sheet
          </button>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {splits.length === 0 && !error ? (
          <div className="glass-card flex flex-col items-center justify-center py-16 gap-4">
            <FileText className="w-12 h-12 text-white/20" />
            <p className="text-white/40 text-sm">No split sheets yet</p>
            <button
              onClick={() => router.push('/splits/new')}
              className="glass-btn flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> Create Your First Split Sheet
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {splits.map((split, index) => (
              <motion.div
                key={split.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="glass-card w-full text-left hover:border-violet-500/30 border border-transparent transition-all duration-200 cursor-pointer"
                onClick={() => router.push(`/splits/${split.id}`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-violet-400" />
                    <h3 className="text-white font-medium">{split.song.finalTitle}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider',
                      STATUS_STYLES[split.status] || 'bg-white/10 text-white/50'
                    )}>
                      {split.status}
                    </span>
                    {canDelete(split) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(split);
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
                        title="Delete split sheet"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-white/40">
                  <span>{split.contributors.length} contributor{split.contributors.length !== 1 ? 's' : ''}</span>
                  <span>{split.totalPercentage}% allocated</span>
                  <span>{new Date(split.createdAt).toLocaleDateString()}</span>
                </div>

                {split.contributors.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {split.contributors.slice(0, 5).map((c) => (
                      <span key={c.id} className="text-[10px] bg-white/5 text-white/50 px-2 py-0.5 rounded-full">
                        {c.stageName || c.legalName} ({c.percentage}%)
                      </span>
                    ))}
                    {split.contributors.length > 5 && (
                      <span className="text-[10px] bg-white/5 text-white/50 px-2 py-0.5 rounded-full">
                        +{split.contributors.length - 5} more
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Split Sheet"
        warningText={
          deleteTarget?.status === 'SIGNED'
            ? `You are about to permanently delete the finalized split sheet for "${deleteTarget.song.finalTitle}". This action cannot be undone and will remove all signatures, contributor data, and audit history.`
            : `Are you sure you want to delete the split sheet for "${deleteTarget?.song.finalTitle || ''}"? This action cannot be undone.`
        }
        loading={deleting}
      />
    </DashboardLayout>
  );
}
