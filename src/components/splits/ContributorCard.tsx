'use client';

import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ProDropdown from './ProDropdown';
import PublisherSubsection from './PublisherSubsection';
import LabelSubsection from './LabelSubsection';
import UserSearchField from './UserSearchField';

export interface ContributorFormState {
  userId: string | null;
  legalName: string;
  stageName: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  proAffiliation: string;
  proOrgId: string | null;
  proOtherText: string;
  hasPublisher: boolean;
  publisherCompany: string;
  publisherName: string;
  publisherContact: string;
  publisherPhone: string;
  publisherEmail: string;
  publisherId: string | null;
  publisherShare: number;
  hasLabel: boolean;
  labelId: string | null;
  labelName: string;
  contributorType: 'WRITER';
  percentage: number;
}

export function createEmptyContributor(): ContributorFormState {
  return {
    userId: null,
    legalName: '',
    stageName: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    proAffiliation: '',
    proOrgId: null,
    proOtherText: '',
    hasPublisher: false,
    publisherCompany: '',
    publisherName: '',
    publisherContact: '',
    publisherPhone: '',
    publisherEmail: '',
    publisherId: null,
    publisherShare: 0,
    hasLabel: false,
    labelId: null,
    labelName: '',
    contributorType: 'WRITER',
    percentage: 0,
  };
}

interface ContributorCardProps {
  index: number;
  data: ContributorFormState;
  onChange: (patch: Partial<ContributorFormState>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export default function ContributorCard({ index, data, onChange, onRemove, canRemove }: ContributorCardProps) {
  const inputClass = cn(
    'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm',
    'placeholder:text-white/20 focus:outline-none focus:border-violet-500/50'
  );

  return (
    <div className="glass-card border border-white/10 space-y-4">
      {/* Card header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/70">Co-Writer {index + 1}</h3>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 1. User search */}
      <UserSearchField
        onSelect={(result) => onChange({
          userId: result.userId,
          legalName: result.legalName,
          stageName: result.stageName,
          contactEmail: result.contactEmail,
        })}
      />

      {/* Linked Account UUID (read-only, shown when user is linked) */}
      {data.userId && (
        <div>
          <label className="block text-xs text-white/50 mb-1">Linked Account (UUID)</label>
          <input
            type="text"
            value={data.userId}
            readOnly
            className={cn(inputClass, 'opacity-50 cursor-not-allowed text-white/40')}
          />
        </div>
      )}

      {/* 2. Print Name (Legal Name) — required */}
      <div>
        <label className="block text-xs text-white/50 mb-1">Print Name (Legal Name) *</label>
        <input
          type="text"
          value={data.legalName}
          onChange={(e) => onChange({ legalName: e.target.value })}
          placeholder="Full legal name"
          className={inputClass}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* 3. Phone Number */}
        <div>
          <label className="block text-xs text-white/50 mb-1">Personal Phone</label>
          <input
            type="tel"
            value={data.contactPhone}
            onChange={(e) => onChange({ contactPhone: e.target.value })}
            placeholder="Co-writer phone number"
            className={inputClass}
          />
        </div>

        {/* 4. Email */}
        <div>
          <label className="block text-xs text-white/50 mb-1">Personal Email</label>
          <input
            type="email"
            value={data.contactEmail}
            onChange={(e) => onChange({ contactEmail: e.target.value })}
            placeholder="email@example.com"
            className={inputClass}
          />
        </div>
      </div>

      {/* 5. Address */}
      <div>
        <label className="block text-xs text-white/50 mb-1">Address</label>
        <input
          type="text"
          value={data.address}
          onChange={(e) => onChange({ address: e.target.value })}
          placeholder="Mailing address"
          className={inputClass}
        />
      </div>

      {/* 6. PRO Affiliation */}
      <ProDropdown
        proAffiliation={data.proAffiliation}
        proOtherText={data.proOtherText}
        onChange={(patch) => onChange(patch)}
      />

      {/* 7. Publisher subsection */}
      <PublisherSubsection
        data={{
          hasPublisher: data.hasPublisher,
          publisherCompany: data.publisherCompany,
          publisherName: data.publisherName,
          publisherContact: data.publisherContact,
          publisherPhone: data.publisherPhone,
          publisherEmail: data.publisherEmail,
          publisherId: data.publisherId,
          publisherShare: data.publisherShare,
        }}
        onChange={(patch) => onChange(patch)}
      />

      {/* 8. Label subsection */}
      <LabelSubsection
        data={{
          hasLabel: data.hasLabel,
          labelId: data.labelId,
          labelName: data.labelName,
        }}
        onChange={(patch) => onChange(patch)}
      />

      {/* 9. Song Split % */}
      <div>
        <label className="block text-xs text-white/50 mb-1">Song Split (%)</label>
        <select
          value={String(data.percentage)}
          onChange={(e) => onChange({ percentage: Number(e.target.value) })}
          className={inputClass}
        >
          {Array.from({ length: 51 }, (_, i) => i).map((n) => (
            <option key={n} value={n} className="bg-gray-900">{n}%</option>
          ))}
        </select>
      </div>

      {/* 10. Signature placeholder */}
      <div className="p-3 bg-white/5 rounded-lg border border-dashed border-white/10">
        <p className="text-xs text-white/30 text-center">Signatures collected after creation</p>
      </div>

      {/* 11. Date — auto-filled */}
      <div>
        <label className="block text-xs text-white/50 mb-1">Date</label>
        <input
          type="text"
          value={new Date().toLocaleDateString()}
          readOnly
          className={cn(inputClass, 'opacity-50 cursor-not-allowed')}
        />
      </div>
    </div>
  );
}
