'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Music, User, Percent, Mail, Phone, MapPin, Building, ShieldCheck, AlertTriangle, Send, Pencil, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface Contributor {
  id: string;
  userId: string | null;
  legalName: string;
  stageName: string | null;
  role: string;
  contributorType: string;
  percentage: number;
  proAffiliation: string | null;
  proOrgId: string | null;
  proOtherText: string | null;
  publisherCompany: string | null;
  publisherName: string | null;
  publisherContact: string | null;
  publisherPhone: string | null;
  publisherEmail: string | null;
  publisherId: string | null;
  publisherShare: number | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  labelId: string | null;
  publisherEntity?: { id: string; name: string; contact: string | null; phone: string | null; email: string | null } | null;
  proOrg?: { id: string; name: string } | null;
  labelEntity?: { id: string; name: string } | null;
}

interface Song {
  id: string;
  workingTitle: string | null;
  finalTitle: string;
  iswc: string | null;
  creationDate: string | null;
}

interface SplitSheet {
  id: string;
  songId: string;
  createdBy: string | null;
  version: number;
  agreementDate: string | null;
  status: string;
  totalPercentage: number;
  clauses: string | null;
  disputedBy: string | null;
  createdAt: string;
  updatedAt: string;
  song: Song;
  contributors: Contributor[];
}

interface Permissions {
  canEditSongDetails: boolean;
  canAddRemoveContributors: boolean;
  editableContributorIds: string[];
  canEditPercentage: boolean;
  canFinalize: boolean;
  canDispute: boolean;
  isCreator: boolean;
  isAdmin: boolean;
  currentUserId: string;
}

interface ContributorFormData {
  percentage: number;
  proAffiliation: string;
  proOtherText: string;
  publisherId: string | null;
  publisherCompany: string;
  publisherName: string;
  publisherContact: string;
  publisherPhone: string;
  publisherEmail: string;
  publisherShare: string;
  labelId: string | null;
  labelName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
}

export default function SplitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [split, setSplit] = useState<SplitSheet | null>(null);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);

  // Track editable form state per contributor
  const [formData, setFormData] = useState<Record<string, ContributorFormData>>({});
  // Publisher search state per contributor
  const [pubSearch, setPubSearch] = useState<Record<string, { query: string; results: any[] }>>({});
  // Label search state per contributor
  const [labelSearch, setLabelSearch] = useState<Record<string, { query: string; results: any[] }>>({});

  const fetchSplit = useCallback(async () => {
    try {
      const res = await fetch(`/api/splits/${id}`);
      if (!res.ok) {
        if (res.status === 403) setError('You do not have access to this split sheet.');
        else if (res.status === 404) setError('Split sheet not found.');
        else setError('Failed to load split sheet.');
        return;
      }
      const data = await res.json();
      setSplit(data.split);
      setPermissions(data.permissions);

      // Initialize form data for editable contributors
      const initialForms: Record<string, ContributorFormData> = {};
      for (const c of data.split.contributors) {
        if (data.permissions.editableContributorIds.includes(c.id)) {
          initialForms[c.id] = {
            percentage: c.percentage,
            proAffiliation: c.proAffiliation || '',
            proOtherText: c.proOtherText || '',
            publisherId: c.publisherId || null,
            publisherCompany: c.publisherCompany || c.publisherEntity?.name || '',
            publisherName: c.publisherName || '',
            publisherContact: c.publisherContact || c.publisherEntity?.contact || '',
            publisherPhone: c.publisherPhone || c.publisherEntity?.phone || '',
            publisherEmail: c.publisherEmail || c.publisherEntity?.email || '',
            publisherShare: c.publisherShare?.toString() || '',
            labelId: c.labelId || null,
            labelName: c.labelEntity?.name || '',
            contactEmail: c.contactEmail || '',
            contactPhone: c.contactPhone || '',
            address: c.address || '',
          };
        }
      }
      setFormData(initialForms);
    } catch {
      setError('Failed to load split sheet.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSplit();
  }, [fetchSplit]);

  const updateField = (contributorId: string, field: keyof ContributorFormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [contributorId]: { ...prev[contributorId], [field]: value },
    }));
  };

  const handleSave = async (contributorId: string) => {
    const data = formData[contributorId];
    if (!data) return;

    setSavingId(contributorId);
    setSaveSuccess(null);
    try {
      const payload: Record<string, unknown> = {
        contributorId,
        proAffiliation: data.proAffiliation || null,
        proOtherText: data.proOtherText || null,
        publisherId: data.publisherId || null,
        publisherCompany: data.publisherCompany || null,
        publisherName: data.publisherName || null,
        publisherContact: data.publisherContact || null,
        publisherPhone: data.publisherPhone || null,
        publisherEmail: data.publisherEmail || null,
        publisherShare: data.publisherShare ? Number(data.publisherShare) : null,
        labelId: data.labelId || null,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        address: data.address || null,
      };

      // Only include percentage if the user has permission to edit it
      if (permissions?.canEditPercentage) {
        payload.percentage = Number(data.percentage);
      }

      const res = await fetch(`/api/splits/${id}/contributor`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to save');
        return;
      }

      setSaveSuccess(contributorId);
      // Refresh data to get updated totals
      await fetchSplit();
      setTimeout(() => setSaveSuccess(null), 2000);
    } catch {
      alert('Failed to save changes');
    } finally {
      setSavingId(null);
    }
  };

  const isEditable = (contributorId: string) =>
    permissions?.editableContributorIds.includes(contributorId) ?? false;

  const handleFinalize = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/splits/${id}/finalize`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to finalize');
        return;
      }
      await fetchSplit();
    } catch {
      alert('Failed to finalize split sheet');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispute = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/splits/${id}/dispute`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to dispute');
        return;
      }
      await fetchSplit();
    } catch {
      alert('Failed to dispute split sheet');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNotify = async () => {
    setNotifyLoading(true);
    setNotifySuccess(false);
    try {
      const res = await fetch(`/api/splits/${id}/notify`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to send notifications');
        return;
      }
      setNotifySuccess(true);
      setTimeout(() => setNotifySuccess(false), 3000);
    } catch {
      alert('Failed to send notifications');
    } finally {
      setNotifyLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout currentPage="splits">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !split || !permissions) {
    return (
      <DashboardLayout currentPage="splits">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-white/60 text-lg">{error || 'Something went wrong'}</p>
          <button
            onClick={() => router.back()}
            className="glass-btn text-sm"
          >
            Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout currentPage="splits">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/70" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{split.song.finalTitle}</h1>
            {split.song.workingTitle && (
              <p className="text-sm text-white/40">Working title: {split.song.workingTitle}</p>
            )}
          </div>
          {permissions.canAddRemoveContributors && (
            <button
              onClick={() => router.push(`/splits/${id}/edit`)}
              className="ml-auto p-2 rounded-xl hover:bg-white/10 transition-colors text-white/50 hover:text-violet-400"
              title="Edit split sheet"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          <span className={cn(
            !permissions.canAddRemoveContributors && 'ml-auto',
            'px-3 py-1 rounded-full text-xs font-medium',
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

        {/* Split overview */}
        {split.contributors.length > 0 && (() => {
          const writers = split.contributors.filter((c) => c.contributorType === 'WRITER' || !c.contributorType);
          const producers = split.contributors.filter((c) => c.contributorType === 'PRODUCER');
          const writerTotal = writers.reduce((s, c) => s + c.percentage, 0);
          const producerTotal = producers.reduce((s, c) => s + c.percentage, 0);

          return (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card space-y-4"
            >
              {/* Writers row */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/40 uppercase tracking-wider">Writers</span>
                  <span className={cn(
                    'text-xs font-medium',
                    writerTotal === 50 ? 'text-green-400' : 'text-yellow-400'
                  )}>
                    {writerTotal}%
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {writers.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-1.5"
                    >
                      <span className="text-sm text-white font-medium">
                        {c.stageName || c.legalName}
                      </span>
                      <span className="text-sm text-violet-400 font-semibold">{c.percentage}%</span>
                    </div>
                  ))}
                  {writers.length === 0 && (
                    <p className="text-xs text-white/30">No writers added</p>
                  )}
                </div>
              </div>

              {/* Producers row */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/40 uppercase tracking-wider">Producers</span>
                  <span className={cn(
                    'text-xs font-medium',
                    producerTotal === 50 ? 'text-green-400' : 'text-white/40'
                  )}>
                    {producerTotal > 0 ? `${producerTotal}%` : '50% reserved'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {producers.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5"
                    >
                      <span className="text-sm text-white font-medium">
                        {c.stageName || c.legalName}
                      </span>
                      <span className="text-sm text-blue-400 font-semibold">{c.percentage}%</span>
                    </div>
                  ))}
                  {producers.length === 0 && (
                    <p className="text-xs text-white/30 italic">No producers yet — 50% reserved</p>
                  )}
                </div>
              </div>

              {/* Total bar */}
              <div className="pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Total</span>
                  <span className={cn(
                    'text-sm font-semibold',
                    writerTotal + producerTotal === 100 ? 'text-green-400' :
                    writerTotal + producerTotal === 50 && producers.length === 0 ? 'text-white/60' :
                    'text-yellow-400'
                  )}>
                    {writerTotal + producerTotal}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full mt-1 overflow-hidden flex">
                  <div
                    className="h-full bg-violet-500 rounded-l-full transition-all duration-300"
                    style={{ width: `${writerTotal}%` }}
                  />
                  <div
                    className="h-full bg-blue-500 rounded-r-full transition-all duration-300"
                    style={{ width: `${producerTotal}%` }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })()}

        {/* Disputed banner */}
        {split.status === 'DISPUTED' && (
          <div className="flex items-center gap-2 px-4 py-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>This split sheet has been disputed. Contributors can edit their sections before re-finalization.</span>
          </div>
        )}

        {/* Action buttons */}
        {permissions && (permissions.canFinalize || permissions.canDispute || ((permissions.isCreator || permissions.isAdmin) && split.status !== 'SIGNED')) && (
          <div className="flex gap-3 flex-wrap">
            {permissions.canFinalize && (
              <button
                onClick={handleFinalize}
                disabled={actionLoading}
                className="glass-btn flex items-center gap-2 text-sm bg-green-500/10 border-green-500/30 hover:bg-green-500/20"
              >
                <ShieldCheck className="w-4 h-4" />
                {actionLoading ? 'Processing...' : 'Finalize Split Sheet'}
              </button>
            )}
            {permissions.canDispute && (
              <button
                onClick={handleDispute}
                disabled={actionLoading}
                className="glass-btn flex items-center gap-2 text-sm bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20"
              >
                <AlertTriangle className="w-4 h-4" />
                {actionLoading ? 'Processing...' : 'Dispute Splits'}
              </button>
            )}
            {(permissions.isCreator || permissions.isAdmin) && split.status !== 'SIGNED' && (
              <button
                onClick={handleNotify}
                disabled={notifyLoading}
                className={cn(
                  'glass-btn flex items-center gap-2 text-sm transition-colors',
                  notifySuccess
                    ? 'bg-green-500/20 border-green-500/40 text-green-400'
                    : 'bg-violet-500/10 border-violet-500/30 hover:bg-violet-500/20'
                )}
              >
                <Send className="w-4 h-4" />
                {notifyLoading ? 'Sending...' : notifySuccess ? 'Notifications Sent!' : 'Notify All Parties'}
              </button>
            )}
            {split.status === 'SIGNED' && !permissions.canDispute && (
              <span className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 px-3 py-1.5 rounded-lg">
                <ShieldCheck className="w-4 h-4" />
                Finalized
              </span>
            )}
          </div>
        )}

        {/* Song Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
        >
          <div className="flex items-center gap-2 mb-4">
            <Music className="w-4 h-4 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">Song Details</h2>
            {!permissions.canEditSongDetails && (
              <span className="text-xs text-white/30 ml-2">Read only</span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider">Final Title</label>
              <p className="text-white mt-1">{split.song.finalTitle}</p>
            </div>
            {split.song.workingTitle && (
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider">Working Title</label>
                <p className="text-white mt-1">{split.song.workingTitle}</p>
              </div>
            )}
            {split.song.iswc && (
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider">ISWC</label>
                <p className="text-white mt-1">{split.song.iswc}</p>
              </div>
            )}
            {split.agreementDate && (
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider">Agreement Date</label>
                <p className="text-white mt-1">{new Date(split.agreementDate).toLocaleDateString()}</p>
              </div>
            )}
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider">Total Percentage</label>
              <p className={cn('mt-1 font-medium', split.totalPercentage === 100 ? 'text-green-400' : 'text-yellow-400')}>
                {split.totalPercentage}%
              </p>
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider">Version</label>
              <p className="text-white mt-1">v{split.version}</p>
            </div>
          </div>
          {split.clauses && (
            <div className="mt-4">
              <label className="text-xs text-white/40 uppercase tracking-wider">Clauses</label>
              <p className="text-white/70 mt-1 text-sm whitespace-pre-wrap">{split.clauses}</p>
            </div>
          )}
        </motion.div>

        {/* Contributors */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-violet-400" />
            Contributors ({split.contributors.length})
          </h2>

          {split.contributors.map((contributor, index) => {
            const editable = isEditable(contributor.id);
            const form = formData[contributor.id];
            const isCurrentUser = contributor.userId === permissions.currentUserId;
            const needsInput = editable && isCurrentUser && !permissions.isCreator;

            return (
              <div key={contributor.id} className="space-y-2">
                {needsInput && (
                  <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Needs your input
                  </div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'glass-card transition-all duration-300',
                    needsInput
                      ? 'border-green-500/40 border bg-green-500/5'
                      : editable
                        ? 'border-violet-500/30 border'
                        : 'opacity-70'
                  )}
                >
                  {/* Contributor header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-white font-medium">
                        {contributor.legalName}
                        {contributor.stageName && (
                          <span className="text-white/40 ml-2 text-sm">({contributor.stageName})</span>
                        )}
                      </h3>
                      <p className="text-xs text-violet-400">{contributor.role}</p>
                    </div>
                  <div className="flex items-center gap-2">
                    {editable && (
                      <span className="text-[10px] uppercase tracking-wider text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
                        {permissions.isAdmin && contributor.userId !== permissions.currentUserId
                          ? 'Admin edit'
                          : 'Your section'}
                      </span>
                    )}
                    {!editable && (
                      <span className="text-[10px] uppercase tracking-wider text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                        Read only
                      </span>
                    )}
                  </div>
                </div>

                {editable && form ? (
                  /* Editable form */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Percentage */}
                      <div>
                        <label className="flex items-center gap-1 text-xs text-white/50 mb-1">
                          <Percent className="w-3 h-3" /> Split Percentage
                          {!permissions.canEditPercentage && (
                            <span className="text-white/30 ml-1">(locked)</span>
                          )}
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={form.percentage || ''}
                          onChange={(e) => updateField(contributor.id, 'percentage', Number(e.target.value))}
                          disabled={!permissions.canEditPercentage}
                          className={cn(
                            'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500/50',
                            !permissions.canEditPercentage && 'opacity-50 cursor-not-allowed'
                          )}
                        />
                      </div>

                      {/* PRO Affiliation */}
                      <div>
                        <label className="flex items-center gap-1 text-xs text-white/50 mb-1">
                          <Building className="w-3 h-3" /> PRO Affiliation
                        </label>
                        <select
                          value={form.proAffiliation}
                          onChange={(e) => updateField(contributor.id, 'proAffiliation', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500/50"
                        >
                          <option value="" className="bg-gray-900">Select PRO...</option>
                          <option value="ASCAP" className="bg-gray-900">ASCAP</option>
                          <option value="BMI" className="bg-gray-900">BMI</option>
                          <option value="SESAC" className="bg-gray-900">SESAC</option>
                          <option value="NONE" className="bg-gray-900">NONE (Independent)</option>
                          <option value="OTHER" className="bg-gray-900">Other</option>
                        </select>
                      </div>

                      {/* PRO Other Text */}
                      {form.proAffiliation === 'OTHER' && (
                        <div>
                          <label className="text-xs text-white/50 mb-1 block">PRO Name</label>
                          <input
                            type="text"
                            value={form.proOtherText}
                            onChange={(e) => updateField(contributor.id, 'proOtherText', e.target.value)}
                            placeholder="Enter PRO name"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
                          />
                        </div>
                      )}

                      {/* Publisher section */}
                      <div className="col-span-full bg-black/10 rounded-lg p-3 space-y-3">
                        <label className="text-xs text-white/50 uppercase tracking-wider flex items-center gap-1">
                          <Building className="w-3 h-3" /> Publisher
                        </label>

                        {form.publisherId ? (
                          /* Publisher selected — read-only info + share */
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-white">{form.publisherCompany}</p>
                                {form.publisherEmail && (
                                  <p className="text-xs text-white/40">{form.publisherEmail}</p>
                                )}
                                {form.publisherPhone && (
                                  <p className="text-xs text-white/40">{form.publisherPhone}</p>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  updateField(contributor.id, 'publisherId', '');
                                  updateField(contributor.id, 'publisherCompany', '');
                                  updateField(contributor.id, 'publisherName', '');
                                  updateField(contributor.id, 'publisherContact', '');
                                  updateField(contributor.id, 'publisherPhone', '');
                                  updateField(contributor.id, 'publisherEmail', '');
                                  updateField(contributor.id, 'publisherShare', '');
                                }}
                                className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
                                title="Remove publisher"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div>
                              <label className="text-xs text-white/40 mb-1 block">Publisher Share (%)</label>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                step={1}
                                value={form.publisherShare}
                                onChange={(e) => updateField(contributor.id, 'publisherShare', e.target.value)}
                                placeholder="e.g., 50"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
                              />
                            </div>
                          </div>
                        ) : (
                          /* No publisher — search */
                          <div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={pubSearch[contributor.id]?.query || ''}
                                onChange={(e) => setPubSearch((prev) => ({
                                  ...prev,
                                  [contributor.id]: { ...prev[contributor.id], query: e.target.value, results: prev[contributor.id]?.results || [] },
                                }))}
                                placeholder="Search publisher by name..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const q = pubSearch[contributor.id]?.query?.trim();
                                    if (!q) return;
                                    fetch(`/api/publishers/search?q=${encodeURIComponent(q)}`)
                                      .then((r) => r.json())
                                      .then((data) => setPubSearch((prev) => ({
                                        ...prev,
                                        [contributor.id]: { query: prev[contributor.id]?.query || '', results: data.publishers || [] },
                                      })))
                                      .catch(() => {});
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const q = pubSearch[contributor.id]?.query?.trim();
                                  if (!q) return;
                                  fetch(`/api/publishers/search?q=${encodeURIComponent(q)}`)
                                    .then((r) => r.json())
                                    .then((data) => setPubSearch((prev) => ({
                                      ...prev,
                                      [contributor.id]: { query: prev[contributor.id]?.query || '', results: data.publishers || [] },
                                    })))
                                    .catch(() => {});
                                }}
                                className="glass-btn px-3 py-2 text-sm"
                              >
                                <Search className="w-4 h-4" />
                              </button>
                            </div>
                            {(pubSearch[contributor.id]?.results?.length || 0) > 0 && (
                              <div className="mt-2 bg-black/20 rounded max-h-32 overflow-auto">
                                {pubSearch[contributor.id].results.map((pub: any) => (
                                  <div
                                    key={pub.id}
                                    className="p-2 hover:bg-white/10 cursor-pointer text-sm"
                                    onClick={() => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        [contributor.id]: {
                                          ...prev[contributor.id],
                                          publisherId: pub.id,
                                          publisherCompany: pub.name || '',
                                          publisherContact: pub.contact || '',
                                          publisherPhone: pub.phone || '',
                                          publisherEmail: pub.email || '',
                                        },
                                      }));
                                      setPubSearch((prev) => ({
                                        ...prev,
                                        [contributor.id]: { query: '', results: [] },
                                      }));
                                    }}
                                  >
                                    <div className="font-medium text-white">{pub.name}</div>
                                    {pub.email && <div className="text-xs text-white/40">{pub.email}</div>}
                                  </div>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-white/30 mt-1">None / Self-Published</p>
                          </div>
                        )}
                      </div>

                      {/* Label section */}
                      <div className="col-span-full bg-black/10 rounded-lg p-3 space-y-3">
                        <label className="text-xs text-white/50 uppercase tracking-wider">Label</label>

                        {form.labelId ? (
                          /* Label selected — read-only display */
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-white">{form.labelName}</p>
                            <button
                              type="button"
                              onClick={() => {
                                updateField(contributor.id, 'labelId', '');
                                updateField(contributor.id, 'labelName', '');
                              }}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
                              title="Remove label"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          /* No label — search */
                          <div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={labelSearch[contributor.id]?.query || ''}
                                onChange={(e) => setLabelSearch((prev) => ({
                                  ...prev,
                                  [contributor.id]: { ...prev[contributor.id], query: e.target.value, results: prev[contributor.id]?.results || [] },
                                }))}
                                placeholder="Search label by name..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const q = labelSearch[contributor.id]?.query?.trim();
                                    if (!q) return;
                                    fetch(`/api/labels/search?q=${encodeURIComponent(q)}`)
                                      .then((r) => r.json())
                                      .then((data) => setLabelSearch((prev) => ({
                                        ...prev,
                                        [contributor.id]: { query: prev[contributor.id]?.query || '', results: data.labels || [] },
                                      })))
                                      .catch(() => {});
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const q = labelSearch[contributor.id]?.query?.trim();
                                  if (!q) return;
                                  fetch(`/api/labels/search?q=${encodeURIComponent(q)}`)
                                    .then((r) => r.json())
                                    .then((data) => setLabelSearch((prev) => ({
                                      ...prev,
                                      [contributor.id]: { query: prev[contributor.id]?.query || '', results: data.labels || [] },
                                    })))
                                    .catch(() => {});
                                }}
                                className="glass-btn px-3 py-2 text-sm"
                              >
                                <Search className="w-4 h-4" />
                              </button>
                            </div>
                            {(labelSearch[contributor.id]?.results?.length || 0) > 0 && (
                              <div className="mt-2 bg-black/20 rounded max-h-32 overflow-auto">
                                {labelSearch[contributor.id].results.map((label: any) => (
                                  <div
                                    key={label.id}
                                    className="p-2 hover:bg-white/10 cursor-pointer text-sm"
                                    onClick={() => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        [contributor.id]: {
                                          ...prev[contributor.id],
                                          labelId: label.id,
                                          labelName: label.name,
                                        },
                                      }));
                                      setLabelSearch((prev) => ({
                                        ...prev,
                                        [contributor.id]: { query: '', results: [] },
                                      }));
                                    }}
                                  >
                                    <div className="font-medium text-white">{label.name}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-white/30 mt-1">None / Independent</p>
                          </div>
                        )}
                      </div>

                      {/* Personal Email */}
                      <div>
                        <label className="flex items-center gap-1 text-xs text-white/50 mb-1">
                          <Mail className="w-3 h-3" /> Personal Email
                        </label>
                        <input
                          type="email"
                          value={form.contactEmail}
                          onChange={(e) => updateField(contributor.id, 'contactEmail', e.target.value)}
                          placeholder="email@example.com"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
                        />
                      </div>

                      {/* Personal Phone */}
                      <div>
                        <label className="flex items-center gap-1 text-xs text-white/50 mb-1">
                          <Phone className="w-3 h-3" /> Personal Phone
                        </label>
                        <input
                          type="tel"
                          value={form.contactPhone}
                          onChange={(e) => updateField(contributor.id, 'contactPhone', e.target.value)}
                          placeholder="Co-writer phone number"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
                        />
                      </div>

                      {/* Address */}
                      <div>
                        <label className="flex items-center gap-1 text-xs text-white/50 mb-1">
                          <MapPin className="w-3 h-3" /> Address
                        </label>
                        <input
                          type="text"
                          value={form.address}
                          onChange={(e) => updateField(contributor.id, 'address', e.target.value)}
                          placeholder="Mailing address"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
                        />
                      </div>
                    </div>

                    {/* Save button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleSave(contributor.id)}
                        disabled={savingId === contributor.id}
                        className={cn(
                          'glass-btn flex items-center gap-2 text-sm',
                          saveSuccess === contributor.id && 'bg-green-500/20 border-green-500/40'
                        )}
                      >
                        <Save className="w-4 h-4" />
                        {savingId === contributor.id
                          ? 'Saving...'
                          : saveSuccess === contributor.id
                          ? 'Saved!'
                          : permissions?.isCreator ? 'Save Changes' : 'Save and Send for Review'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Read-only display */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <ReadOnlyField label="Type" value={contributor.contributorType || 'WRITER'} />
                    <ReadOnlyField label="Percentage" value={`${contributor.percentage}%`} />
                    {contributor.proAffiliation && (
                      <ReadOnlyField
                        label="PRO Affiliation"
                        value={contributor.proAffiliation === 'OTHER' && contributor.proOtherText
                          ? contributor.proOtherText
                          : contributor.proOrg?.name || contributor.proAffiliation}
                      />
                    )}
                    {(contributor.publisherEntity || contributor.publisherCompany) && (
                      <ReadOnlyField
                        label="Publisher"
                        value={contributor.publisherEntity?.name || contributor.publisherCompany || ''}
                      />
                    )}
                    {contributor.publisherShare != null && contributor.publisherShare > 0 && (
                      <ReadOnlyField label="Publisher Share" value={`${contributor.publisherShare}%`} />
                    )}
                    {contributor.labelEntity && (
                      <ReadOnlyField label="Label" value={contributor.labelEntity.name} />
                    )}
                    {contributor.contactEmail && (
                      <ReadOnlyField label="Personal Email" value={contributor.contactEmail} />
                    )}
                    {contributor.contactPhone && (
                      <ReadOnlyField label="Personal Phone" value={contributor.contactPhone} />
                    )}
                    {contributor.address && (
                      <ReadOnlyField label="Address" value={contributor.address} />
                    )}
                  </div>
                )}
              </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-xs text-white/40 uppercase tracking-wider">{label}</label>
      <p className="text-white/60 mt-0.5 text-sm">{value}</p>
    </div>
  );
}
