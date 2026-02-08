'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Music, User, Percent, Mail, Phone, MapPin, Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface Contributor {
  id: string;
  userId: string | null;
  legalName: string;
  stageName: string | null;
  role: string;
  percentage: number;
  proAffiliation: string | null;
  ipiNumber: string | null;
  publisher: string | null;
  publisherShare: number | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
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
  createdAt: string;
  updatedAt: string;
  song: Song;
  contributors: Contributor[];
}

interface Permissions {
  canEditSongDetails: boolean;
  canAddRemoveContributors: boolean;
  editableContributorIds: string[];
}

interface ContributorFormData {
  percentage: number;
  proAffiliation: string;
  ipiNumber: string;
  publisher: string;
  publisherShare: string;
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

  // Track editable form state per contributor
  const [formData, setFormData] = useState<Record<string, ContributorFormData>>({});

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
            ipiNumber: c.ipiNumber || '',
            publisher: c.publisher || '',
            publisherShare: c.publisherShare?.toString() || '',
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
      const res = await fetch(`/api/splits/${id}/contributor`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contributorId,
          percentage: Number(data.percentage),
          proAffiliation: data.proAffiliation || null,
          ipiNumber: data.ipiNumber || null,
          publisher: data.publisher || null,
          publisherShare: data.publisherShare ? Number(data.publisherShare) : null,
          contactEmail: data.contactEmail || null,
          contactPhone: data.contactPhone || null,
          address: data.address || null,
        }),
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
          <span className={cn(
            'ml-auto px-3 py-1 rounded-full text-xs font-medium',
            split.status === 'DRAFT' && 'bg-yellow-500/20 text-yellow-400',
            split.status === 'PENDING' && 'bg-blue-500/20 text-blue-400',
            split.status === 'SIGNED' && 'bg-green-500/20 text-green-400',
            split.status === 'PUBLISHED' && 'bg-violet-500/20 text-violet-400',
            split.status === 'REVERSED' && 'bg-red-500/20 text-red-400',
          )}>
            {split.status}
          </span>
        </div>

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

            return (
              <motion.div
                key={contributor.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  'glass-card transition-all duration-300',
                  editable
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
                        Your section
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
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.01}
                          value={form.percentage}
                          onChange={(e) => updateField(contributor.id, 'percentage', Number(e.target.value))}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500/50"
                        />
                      </div>

                      {/* PRO Affiliation */}
                      <div>
                        <label className="flex items-center gap-1 text-xs text-white/50 mb-1">
                          <Building className="w-3 h-3" /> PRO Affiliation
                        </label>
                        <input
                          type="text"
                          value={form.proAffiliation}
                          onChange={(e) => updateField(contributor.id, 'proAffiliation', e.target.value)}
                          placeholder="e.g., ASCAP, BMI, SESAC"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
                        />
                      </div>

                      {/* IPI Number */}
                      <div>
                        <label className="text-xs text-white/50 mb-1 block">IPI Number</label>
                        <input
                          type="text"
                          value={form.ipiNumber}
                          onChange={(e) => updateField(contributor.id, 'ipiNumber', e.target.value)}
                          placeholder="IPI/CAE number"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
                        />
                      </div>

                      {/* Publisher */}
                      <div>
                        <label className="text-xs text-white/50 mb-1 block">Publisher</label>
                        <input
                          type="text"
                          value={form.publisher}
                          onChange={(e) => updateField(contributor.id, 'publisher', e.target.value)}
                          placeholder="Publisher name"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
                        />
                      </div>

                      {/* Publisher Share */}
                      <div>
                        <label className="text-xs text-white/50 mb-1 block">Publisher Share (%)</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={0.01}
                          value={form.publisherShare}
                          onChange={(e) => updateField(contributor.id, 'publisherShare', e.target.value)}
                          placeholder="e.g., 50"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
                        />
                      </div>

                      {/* Contact Email */}
                      <div>
                        <label className="flex items-center gap-1 text-xs text-white/50 mb-1">
                          <Mail className="w-3 h-3" /> Contact Email
                        </label>
                        <input
                          type="email"
                          value={form.contactEmail}
                          onChange={(e) => updateField(contributor.id, 'contactEmail', e.target.value)}
                          placeholder="email@example.com"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
                        />
                      </div>

                      {/* Contact Phone */}
                      <div>
                        <label className="flex items-center gap-1 text-xs text-white/50 mb-1">
                          <Phone className="w-3 h-3" /> Contact Phone
                        </label>
                        <input
                          type="tel"
                          value={form.contactPhone}
                          onChange={(e) => updateField(contributor.id, 'contactPhone', e.target.value)}
                          placeholder="Phone number"
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
                          : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Read-only display */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <ReadOnlyField label="Percentage" value={`${contributor.percentage}%`} />
                    {contributor.proAffiliation && (
                      <ReadOnlyField label="PRO Affiliation" value={contributor.proAffiliation} />
                    )}
                    {contributor.ipiNumber && (
                      <ReadOnlyField label="IPI Number" value={contributor.ipiNumber} />
                    )}
                    {contributor.publisher && (
                      <ReadOnlyField label="Publisher" value={contributor.publisher} />
                    )}
                    {contributor.publisherShare != null && (
                      <ReadOnlyField label="Publisher Share" value={`${contributor.publisherShare}%`} />
                    )}
                    {contributor.contactEmail && (
                      <ReadOnlyField label="Contact Email" value={contributor.contactEmail} />
                    )}
                    {contributor.contactPhone && (
                      <ReadOnlyField label="Contact Phone" value={contributor.contactPhone} />
                    )}
                    {contributor.address && (
                      <ReadOnlyField label="Address" value={contributor.address} />
                    )}
                  </div>
                )}
              </motion.div>
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
