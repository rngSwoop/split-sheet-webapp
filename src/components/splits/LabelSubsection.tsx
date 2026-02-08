'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LabelData {
  hasLabel: boolean;
  labelId: string | null;
  labelName: string;
}

interface LabelSubsectionProps {
  data: LabelData;
  onChange: (patch: Partial<LabelData>) => void;
}

export default function LabelSubsection({ data, onChange }: LabelSubsectionProps) {
  const [isOpen, setIsOpen] = useState(data.hasLabel);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; name: string }[]>([]);

  const handleToggle = (hasLabel: boolean) => {
    setIsOpen(hasLabel);
    if (!hasLabel) {
      onChange({ hasLabel: false, labelId: null, labelName: '' });
    } else {
      onChange({ hasLabel: true });
    }
  };

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    try {
      const res = await fetch(`/api/labels/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) return;
      const json = await res.json();
      setSearchResults(json.labels || []);
    } catch (err) {
      console.error(err);
    }
  };

  const selectLabel = (label: { id: string; name: string }) => {
    onChange({ labelId: label.id, labelName: label.name });
    setSearchResults([]);
    setSearchQuery('');
  };

  const inputClass = cn(
    'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm',
    'placeholder:text-white/20 focus:outline-none focus:border-violet-500/50'
  );

  return (
    <div className="bg-black/10 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs text-white/50 uppercase tracking-wider">Label</label>
        <button
          type="button"
          onClick={() => handleToggle(!data.hasLabel)}
          className="text-xs text-violet-400 flex items-center gap-1 hover:text-violet-300"
        >
          {data.hasLabel ? (
            <>Collapse <ChevronUp className="w-3 h-3" /></>
          ) : (
            <>Add Label <ChevronDown className="w-3 h-3" /></>
          )}
        </button>
      </div>

      {!data.hasLabel && (
        <p className="text-xs text-white/30">None / Independent</p>
      )}

      {data.hasLabel && (
        <div className="space-y-3">
          {/* Label search */}
          <div>
            <label className="block text-xs text-white/40 mb-1">Search Existing Label</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name..."
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
              <div className="mt-2 bg-black/20 rounded max-h-32 overflow-auto">
                {searchResults.map((label) => (
                  <div
                    key={label.id}
                    className="p-2 hover:bg-white/10 cursor-pointer text-sm"
                    onClick={() => selectLabel(label)}
                  >
                    <div className="font-medium text-white">{label.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected label display */}
          {data.labelId && data.labelName && (
            <div>
              <label className="block text-xs text-white/40 mb-1">Selected Label</label>
              <p className="text-sm text-white/80">{data.labelName}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
