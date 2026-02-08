'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserSearchResult {
  userId: string;
  name: string | null;
  email: string | null;
}

interface UserSearchFieldProps {
  onSelect: (result: { userId: string; legalName: string; stageName: string; contactEmail: string }) => void;
}

export default function UserSearchField({ onSelect }: UserSearchFieldProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    try {
      const res = await fetch(`/api/labels/search-artists?q=${encodeURIComponent(q)}`);
      if (!res.ok) return;
      const data = await res.json();
      setSearchResults(data.artists || []);
    } catch (err) {
      console.error(err);
    }
  };

  const inputClass = cn(
    'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm',
    'placeholder:text-white/20 focus:outline-none focus:border-violet-500/50'
  );

  return (
    <div>
      <label className="block text-xs text-white/50 mb-1">Find User (optional)</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or email"
          className={cn(inputClass, 'flex-1')}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
        />
        <button
          type="button"
          onClick={handleSearch}
          className="glass-btn px-3 py-2 text-sm"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
      {searchResults.length > 0 && (
        <div className="mt-2 bg-black/20 rounded max-h-40 overflow-auto">
          {searchResults.map((r) => (
            <div
              key={r.userId}
              className="p-2 hover:bg-white/10 cursor-pointer"
              onClick={() => {
                onSelect({
                  userId: r.userId,
                  legalName: r.name || '',
                  stageName: r.name || '',
                  contactEmail: r.email || '',
                });
                setSearchResults([]);
                setSearchQuery('');
              }}
            >
              <div className="font-medium text-white text-sm">{r.name || r.email}</div>
              <div className="text-xs text-white/40">{r.email}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
