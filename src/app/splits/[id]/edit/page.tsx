'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, HelpCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassButton from '@/components/ui/GlassButton';
import ContributorCard, { ContributorFormState, createEmptyContributor } from '@/components/splits/ContributorCard';
import PercentageSummary from '@/components/splits/PercentageSummary';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { cn } from '@/lib/utils';

function RequirementsTooltip({ reasons, label }: { reasons: string[]; label: string }) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShow(false);
      }
    }
    if (show) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [show]);

  if (reasons.length === 0) return null;

  return (
    <div ref={ref} className="relative inline-flex items-center ml-1">
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-white/30 hover:text-white/60 transition-colors"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 glass-card px-3 py-2 min-w-[240px] text-xs"
          >
            <p className="text-white/60 font-medium mb-1">{label}</p>
            <ul className="space-y-0.5">
              {reasons.map((r, i) => (
                <li key={i} className="text-white/40 flex items-start gap-1.5">
                  <span className="text-red-400 mt-0.5 shrink-0">&#8226;</span>
                  {r}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function EditSplitPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [finalTitle, setFinalTitle] = useState('');
  const [workingTitle, setWorkingTitle] = useState('');
  const [contributors, setContributors] = useState<ContributorFormState[]>([]);
  const [originalStatus, setOriginalStatus] = useState('PENDING');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchSplit = useCallback(async () => {
    try {
      const res = await fetch(`/api/splits/${id}`);
      if (!res.ok) {
        router.replace(`/splits/${id}`);
        return;
      }
      const data = await res.json();

      // Redirect if user can't edit
      if (!data.permissions.canAddRemoveContributors) {
        router.replace(`/splits/${id}`);
        return;
      }

      const split = data.split;
      setFinalTitle(split.song.finalTitle || '');
      setWorkingTitle(split.song.workingTitle || '');
      setOriginalStatus(split.status);

      // Map contributors to form state
      const mapped: ContributorFormState[] = split.contributors.map((c: any) => ({
        userId: c.userId || null,
        legalName: c.legalName || '',
        stageName: c.stageName || '',
        contactPhone: c.contactPhone || '',
        contactEmail: c.contactEmail || '',
        address: c.address || '',
        proAffiliation: c.proAffiliation || '',
        proOrgId: c.proOrgId || null,
        proOtherText: c.proOtherText || '',
        hasPublisher: !!(c.publisherCompany || c.publisherId),
        publisherCompany: c.publisherCompany || '',
        publisherName: c.publisherName || '',
        publisherContact: c.publisherContact || '',
        publisherPhone: c.publisherPhone || '',
        publisherEmail: c.publisherEmail || '',
        publisherId: c.publisherId || null,
        publisherShare: c.publisherShare ?? 0,
        hasLabel: !!c.labelId,
        labelId: c.labelId || null,
        labelName: c.labelEntity?.name || '',
        contributorType: 'WRITER' as const,
        percentage: c.percentage || 0,
      }));

      setContributors(mapped);
    } catch {
      router.replace(`/splits/${id}`);
    } finally {
      setFetching(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchSplit();
  }, [fetchSplit]);

  const writerTotal = contributors.reduce((s, c) => s + c.percentage, 0);

  // Compute finalize requirements
  const finalizeReasons: string[] = [];
  if (!finalTitle.trim()) finalizeReasons.push('Final title is required');
  if (contributors.length === 0) finalizeReasons.push('At least 1 co-writer is required');
  if (contributors.some((c) => !c.legalName.trim())) finalizeReasons.push('All co-writers must have a legal name');
  if (writerTotal !== 50) finalizeReasons.push(`Writer percentages must total 50% (currently ${writerTotal}%)`);
  if (contributors.some((c) => c.proAffiliation === 'OTHER' && !c.proOtherText.trim())) {
    finalizeReasons.push('Please specify PRO name when selecting "Other"');
  }
  const canFinalize = finalizeReasons.length === 0;

  // Compute save requirements
  const saveReasons: string[] = [];
  if (!finalTitle.trim()) saveReasons.push('Final title is required');
  if (contributors.length === 0) saveReasons.push('At least 1 co-writer is required');
  if (contributors.some((c) => !c.userId)) {
    saveReasons.push('All co-writers must have a linked account');
  }
  if (writerTotal !== 50) saveReasons.push(`Writer percentages must total 50% (currently ${writerTotal}%)`);
  const canSave = saveReasons.length === 0;

  function updateContributor(idx: number, patch: Partial<ContributorFormState>) {
    setContributors((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });
  }

  function addContributor() {
    setContributors((prev) => [...prev, createEmptyContributor()]);
  }

  function removeContributor(idx: number) {
    setContributors((prev) => prev.filter((_, i) => i !== idx));
  }

  const handleSubmit = async (action: 'save' | 'finalize') => {
    setError(null);
    setLoading(true);

    try {
      if (!finalTitle.trim()) {
        setError('Final title is required');
        setLoading(false);
        return;
      }

      if (contributors.length === 0) {
        setError('At least 1 co-writer is required');
        setLoading(false);
        return;
      }

      const missingAccount = contributors.some((c) => !c.userId);
      if (missingAccount) {
        setError('All co-writers must have a linked account');
        setLoading(false);
        return;
      }

      if (writerTotal !== 50) {
        setError('Writer percentages must total 50%');
        setLoading(false);
        return;
      }

      if (action === 'finalize') {
        const missingName = contributors.some((c) => !c.legalName.trim());
        if (missingName) {
          setError('All co-writers must have a legal name');
          setLoading(false);
          return;
        }

        const missingProText = contributors.some(
          (c) => c.proAffiliation === 'OTHER' && !c.proOtherText.trim()
        );
        if (missingProText) {
          setError('Please specify your PRO name when selecting "Other"');
          setLoading(false);
          return;
        }
      }

      // Build payload — strip UI-only fields
      const payload = contributors.map((c) => ({
        userId: c.userId,
        legalName: c.legalName,
        stageName: c.stageName || null,
        role: 'Writer',
        contributorType: 'WRITER' as const,
        percentage: c.percentage,
        proAffiliation: c.proAffiliation || null,
        proOrgId: c.proOrgId,
        proOtherText: c.proOtherText || null,
        publisherCompany: c.hasPublisher ? c.publisherCompany || null : null,
        publisherName: c.hasPublisher ? c.publisherName || null : null,
        publisherContact: c.hasPublisher ? c.publisherContact || null : null,
        publisherPhone: c.hasPublisher ? c.publisherPhone || null : null,
        publisherEmail: c.hasPublisher ? c.publisherEmail || null : null,
        publisherId: c.hasPublisher ? c.publisherId : null,
        publisherShare: c.hasPublisher ? c.publisherShare : null,
        labelId: c.hasLabel ? c.labelId : null,
        contactEmail: c.contactEmail || null,
        contactPhone: c.contactPhone || null,
        address: c.address || null,
      }));

      const status = action === 'finalize' ? 'SIGNED' : originalStatus;

      const res = await fetch(`/api/splits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalTitle, workingTitle, contributors: payload, status }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || 'Failed to update split');
        setLoading(false);
        return;
      }

      router.push(`/splits/${id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = cn(
    'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm',
    'placeholder:text-white/20 focus:outline-none focus:border-violet-500/50'
  );

  if (fetching) {
    return (
      <DashboardLayout currentPage="splits">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="splits">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/splits/${id}`)}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </button>
          <h1 className="text-2xl font-bold gradient-text">Edit Split Sheet</h1>
        </div>

        <div className="space-y-6">
          {/* Song Title Section */}
          <div className="glass-card space-y-4">
            <h2 className="text-lg font-semibold text-white/90">Song Details</h2>
            <div>
              <label className="block text-xs text-white/50 mb-1">Final Title *</label>
              <input
                value={finalTitle}
                onChange={(e) => setFinalTitle(e.target.value)}
                placeholder="Final song title"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Working Title</label>
              <input
                value={workingTitle}
                onChange={(e) => setWorkingTitle(e.target.value)}
                placeholder="Working title (optional)"
                className={inputClass}
              />
            </div>
          </div>

          {/* Co-Writers Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white/90">Co-Writers</h2>

            {contributors.map((c, idx) => (
              <ContributorCard
                key={idx}
                index={idx}
                data={c}
                onChange={(patch) => updateContributor(idx, patch)}
                onRemove={() => removeContributor(idx)}
                canRemove={contributors.length > 1}
              />
            ))}

            <button
              type="button"
              onClick={addContributor}
              className="glass-btn flex items-center gap-2 text-sm w-full justify-center"
            >
              <Plus className="w-4 h-4" /> Add Co-Writer
            </button>

            <PercentageSummary writerTotal={writerTotal} />
          </div>

          {/* Producer Split — Deferred */}
          <div className="glass-card opacity-50 border border-dashed border-white/10">
            <h2 className="text-lg font-semibold text-white/50">Producer Split</h2>
            <p className="text-sm text-white/30 mt-2">
              50% reserved for producers. Beat upload and licensing flow coming soon.
            </p>
          </div>

          {/* Error & Submit */}
          {error && <div className="text-red-400 text-sm">{error}</div>}

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-1">
              <GlassButton
                type="button"
                className="flex-1"
                disabled={loading || !canSave}
                onClick={() => handleSubmit('save')}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </GlassButton>
              <RequirementsTooltip reasons={saveReasons} label="Cannot save yet:" />
            </div>
            <div className="flex-1 flex items-center gap-1">
              <GlassButton
                type="button"
                className="flex-1"
                disabled={loading || !canFinalize}
                onClick={() => handleSubmit('finalize')}
              >
                {loading ? 'Saving...' : 'Save & Finalize'}
              </GlassButton>
              <RequirementsTooltip reasons={finalizeReasons} label="Cannot finalize yet:" />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
