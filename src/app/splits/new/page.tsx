"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import GlassButton from '@/components/ui/GlassButton';

export default function NewSplitPage() {
  const [finalTitle, setFinalTitle] = useState('');
  const [workingTitle, setWorkingTitle] = useState('');
  const [contributors, setContributors] = useState<Array<any>>([
    { legalName: '', stageName: '', role: '', percentage: 100, proAffiliation: '', ipiNumber: '', publisher: '', publisherShare: 0, contactEmail: '', contactPhone: '', address: '', userId: null, searchQuery: '', searchResults: [] },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!finalTitle || finalTitle.trim() === '') {
        setError('Final title is required');
        setLoading(false);
        return;
      }

      // client-side validation: percentages sum to 100
      const sum = contributors.reduce((s, c) => s + Number(c.percentage || 0), 0);
      if (sum !== 100) {
        setError('Percentages must total 100%');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/splits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalTitle, workingTitle, contributors }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to create split');
        setLoading(false);
        return;
      }

      const { split } = await res.json();
      router.push('/dashboard/artist');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  function updateContributor(idx: number, patch: Partial<any>) {
    setContributors((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  }

  function addContributor() {
    setContributors((prev) => [...prev, { legalName: '', stageName: '', role: '', percentage: 0, proAffiliation: '', ipiNumber: '', publisher: '', publisherShare: 0, contactEmail: '', contactPhone: '', address: '' }]);
  }

  function removeContributor(idx: number) {
    setContributors((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6">
      <div className="glass-card max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Create Split Sheet</h1>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Final Title</label>
            <input value={finalTitle} onChange={(e) => setFinalTitle(e.target.value)} className="w-full p-3 rounded-lg bg-[var(--color-glass-dark)]" />
          </div>
          <div>
            <label className="block text-sm mb-1">Working Title</label>
            <input value={workingTitle} onChange={(e) => setWorkingTitle(e.target.value)} className="w-full p-3 rounded-lg bg-[var(--color-glass-dark)]" />
          </div>
          <div>
            <label className="block text-sm mb-2">Contributors</label>
            <div className="space-y-3">
              {contributors.map((c, idx) => (
                <div key={idx} className="p-3 bg-[var(--color-glass-dark)] rounded-md">
                  <div className="flex flex-col gap-2">
                    <div>
                      <label className="block text-xs text-gray-300">Find User (optional)</label>
                      <div className="flex gap-2">
                        <input placeholder="Search by name or email" value={c.searchQuery} onChange={(e) => updateContributor(idx, { searchQuery: e.target.value })} className="flex-1 p-2 rounded bg-black/20" />
                        <GlassButton onClick={async () => {
                          try {
                            const q = (contributors[idx].searchQuery || '').trim();
                            if (!q) return;
                            const res = await fetch(`/api/labels/search-artists?q=${encodeURIComponent(q)}`);
                            if (!res.ok) return;
                            const data = await res.json();
                            updateContributor(idx, { searchResults: data.artists || [] });
                          } catch (err) {
                            console.error(err);
                          }
                        }}>Search</GlassButton>
                      </div>
                      {c.searchResults && c.searchResults.length > 0 && (
                        <div className="mt-2 bg-black/10 rounded max-h-40 overflow-auto">
                          {c.searchResults.map((r: any) => (
                            <div key={r.userId} className="p-2 hover:bg-black/20 cursor-pointer" onClick={() => {
                              updateContributor(idx, { userId: r.userId, legalName: r.name || '', stageName: r.name || '', contactEmail: r.email || '', searchResults: [], searchQuery: '' });
                            }}>
                              <div className="font-medium">{r.name || r.email}</div>
                              <div className="text-xs text-gray-400">{r.email}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300">Legal Name</label>
                      <input placeholder="Legal Name" value={c.legalName} onChange={(e) => updateContributor(idx, { legalName: e.target.value })} className="w-full p-2 rounded bg-black/20" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300">Stage Name</label>
                      <input placeholder="Stage Name" value={c.stageName} onChange={(e) => updateContributor(idx, { stageName: e.target.value })} className="w-full p-2 rounded bg-black/20" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300">Role</label>
                      <input placeholder="Role (e.g., Writer)" value={c.role} onChange={(e) => updateContributor(idx, { role: e.target.value })} className="w-full p-2 rounded bg-black/20" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300">Share (%)</label>
                      <select value={String(c.percentage ?? 0)} onChange={(e) => updateContributor(idx, { percentage: Number(e.target.value) })} className="w-40 p-2 rounded bg-black/20">
                        {Array.from({ length: 101 }, (_, i) => i).map((n) => (
                          <option key={n} value={n}>{n}%</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-400 mt-1">Tap to choose a percentage (mobile-friendly selector)</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300">IPI / CAE</label>
                      <input placeholder="IPI / CAE" value={c.ipiNumber} onChange={(e) => updateContributor(idx, { ipiNumber: e.target.value })} className="w-full p-2 rounded bg-black/20" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300">Publisher</label>
                      <input placeholder="Publisher name" value={c.publisher} onChange={(e) => updateContributor(idx, { publisher: e.target.value })} className="w-full p-2 rounded bg-black/20" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300">Publisher Share (%)</label>
                      <select value={String(c.publisherShare ?? 0)} onChange={(e) => updateContributor(idx, { publisherShare: Number(e.target.value) })} className="w-40 p-2 rounded bg-black/20">
                        {Array.from({ length: 101 }, (_, i) => i).map((n) => (
                          <option key={n} value={n}>{n}%</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300">Contact Email</label>
                      <input placeholder="Contact Email" value={c.contactEmail} onChange={(e) => updateContributor(idx, { contactEmail: e.target.value })} className="w-full p-2 rounded bg-black/20" />
                    </div>
                    <div className="flex justify-end mt-2">
                      <GlassButton variant="outline" onClick={() => removeContributor(idx)}>Remove</GlassButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2">
              <GlassButton onClick={addContributor}>Add Contributor</GlassButton>
            </div>
            <p className="text-xs text-gray-400 mt-2">Ensure contributor percentages add to 100%.</p>
          </div>
          {error && <div className="text-red-400">{error}</div>}
          <GlassButton type="submit" className="mt-2" disabled={loading}>{loading ? 'Creating...' : 'Create'}</GlassButton>
        </form>
      </div>
    </div>
  );
}
