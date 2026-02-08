'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface UserResult {
  userId: string;
  name: string | null;
  role: string | null;
  email?: string;
}

interface SplitResult {
  id: string;
  status: string;
  createdAt: string;
  song: { finalTitle: string; workingTitle: string | null };
  contributors: { id: string; legalName: string; userId: string | null }[];
}

export default function AdminSplitsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [splits, setSplits] = useState<SplitResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [splitsLoading, setSplitsLoading] = useState(false);

  const handleUserSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) return;
      const data = await res.json();
      setUserResults(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (user: UserResult) => {
    setSelectedUser(user);
    setUserResults([]);
    setSearchQuery('');
    setSplitsLoading(true);
    try {
      const res = await fetch(`/api/admin/splits?userId=${user.userId}`);
      if (!res.ok) return;
      const data = await res.json();
      setSplits(data.splits || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSplitsLoading(false);
    }
  };

  const inputClass = cn(
    'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm',
    'placeholder:text-white/20 focus:outline-none focus:border-violet-500/50'
  );

  return (
    <DashboardLayout currentPage="modify-splits">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-white">Modify Splits</h1>
        <p className="text-sm text-white/50">Search for a user to view and edit their split sheets.</p>

        {/* User search */}
        <div className="glass-card space-y-3">
          <label className="text-xs text-white/50 uppercase tracking-wider">Search User</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className={cn(inputClass, 'flex-1')}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUserSearch())}
            />
            <button
              type="button"
              onClick={handleUserSearch}
              disabled={loading}
              className="glass-btn px-4 py-2 text-sm flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* User search results */}
          {userResults.length > 0 && (
            <div className="bg-black/20 rounded-lg max-h-48 overflow-auto">
              {userResults.map((user) => (
                <div
                  key={user.userId}
                  className="p-3 hover:bg-white/10 cursor-pointer border-b border-white/5 last:border-0"
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-white">{user.name || 'No name'}</span>
                      {user.email && <span className="text-xs text-white/40 ml-2">{user.email}</span>}
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                      {user.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected user + splits */}
        {selectedUser && (
          <div className="space-y-4">
            <div className="glass-card">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">{selectedUser.name || 'No name'}</h2>
                  <p className="text-xs text-white/40">{selectedUser.email} &middot; {selectedUser.role}</p>
                </div>
                <button
                  onClick={() => { setSelectedUser(null); setSplits([]); }}
                  className="text-xs text-white/40 hover:text-white/60"
                >
                  Clear
                </button>
              </div>
            </div>

            {splitsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : splits.length === 0 ? (
              <p className="text-sm text-white/40 text-center py-8">No split sheets found for this user.</p>
            ) : (
              <div className="space-y-2">
                {splits.map((split) => (
                  <a
                    key={split.id}
                    href={`/splits/${split.id}`}
                    className="glass-card block hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-white">{split.song.finalTitle}</h3>
                        {split.song.workingTitle && (
                          <p className="text-xs text-white/30">Working: {split.song.workingTitle}</p>
                        )}
                        <p className="text-xs text-white/40 mt-1">
                          {split.contributors.length} contributor{split.contributors.length !== 1 ? 's' : ''} &middot;
                          Created {new Date(split.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-medium uppercase',
                        split.status === 'DRAFT' && 'bg-yellow-500/20 text-yellow-400',
                        split.status === 'PENDING' && 'bg-blue-500/20 text-blue-400',
                        split.status === 'SIGNED' && 'bg-green-500/20 text-green-400',
                        split.status === 'PUBLISHED' && 'bg-violet-500/20 text-violet-400',
                        split.status === 'REVERSED' && 'bg-red-500/20 text-red-400',
                        split.status === 'DISPUTED' && 'bg-orange-500/20 text-orange-400',
                      )}>
                        {split.status}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
