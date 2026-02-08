'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PublisherData {
  hasPublisher: boolean;
  publisherCompany: string;
  publisherName: string;
  publisherContact: string;
  publisherPhone: string;
  publisherEmail: string;
  publisherId: string | null;
  publisherShare: number;
}

interface PublisherSubsectionProps {
  data: PublisherData;
  onChange: (patch: Partial<PublisherData>) => void;
}

export default function PublisherSubsection({ data, onChange }: PublisherSubsectionProps) {
  const [isOpen, setIsOpen] = useState(data.hasPublisher);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleToggle = (hasPublisher: boolean) => {
    setIsOpen(hasPublisher);
    if (!hasPublisher) {
      onChange({
        hasPublisher: false,
        publisherCompany: '',
        publisherName: '',
        publisherContact: '',
        publisherPhone: '',
        publisherEmail: '',
        publisherId: null,
        publisherShare: 0,
      });
    } else {
      onChange({ hasPublisher: true });
    }
  };

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    try {
      const res = await fetch(`/api/publishers/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) return;
      const json = await res.json();
      setSearchResults(json.publishers || []);
    } catch (err) {
      console.error(err);
    }
  };

  const selectPublisher = (pub: any) => {
    onChange({
      publisherId: pub.id,
      publisherCompany: pub.name || '',
      publisherName: '',
      publisherContact: pub.contact || '',
      publisherPhone: pub.phone || '',
      publisherEmail: pub.email || '',
    });
    setSearchResults([]);
    setSearchQuery('');
  };

  const clearPublisher = () => {
    onChange({
      publisherId: null,
      publisherCompany: '',
      publisherName: '',
      publisherContact: '',
      publisherPhone: '',
      publisherEmail: '',
      publisherShare: 0,
    });
    setSearchQuery('');
  };

  const inputClass = cn(
    'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm',
    'placeholder:text-white/20 focus:outline-none focus:border-violet-500/50'
  );

  return (
    <div className="bg-black/10 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs text-white/50 uppercase tracking-wider">Publisher</label>
        <button
          type="button"
          onClick={() => handleToggle(!data.hasPublisher)}
          className="text-xs text-violet-400 flex items-center gap-1 hover:text-violet-300"
        >
          {data.hasPublisher ? (
            <>Collapse <ChevronUp className="w-3 h-3" /></>
          ) : (
            <>Add Publisher <ChevronDown className="w-3 h-3" /></>
          )}
        </button>
      </div>

      {!data.hasPublisher && (
        <p className="text-xs text-white/30">None / Self-Published</p>
      )}

      {data.hasPublisher && (
        <div className="space-y-3">
          {data.publisherId ? (
            /* Selected publisher — show read-only details */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{data.publisherCompany}</p>
                  {data.publisherEmail && (
                    <p className="text-xs text-white/40">{data.publisherEmail}</p>
                  )}
                  {data.publisherPhone && (
                    <p className="text-xs text-white/40">{data.publisherPhone}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={clearPublisher}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
                  title="Remove publisher"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1">Publisher Share (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={data.publisherShare || ''}
                  onChange={(e) => onChange({ publisherShare: Number(e.target.value) })}
                  placeholder="e.g., 50"
                  className={inputClass}
                />
              </div>
            </div>
          ) : (
            /* No publisher selected — show search */
            <div>
              <label className="block text-xs text-white/40 mb-1">Search Publisher</label>
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
                  {searchResults.map((pub) => (
                    <div
                      key={pub.id}
                      className="p-2 hover:bg-white/10 cursor-pointer text-sm"
                      onClick={() => selectPublisher(pub)}
                    >
                      <div className="font-medium text-white">{pub.name}</div>
                      {pub.email && <div className="text-xs text-white/40">{pub.email}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
