'use client';

import { cn } from '@/lib/utils';

interface ProDropdownProps {
  proAffiliation: string;
  proOtherText: string;
  onChange: (patch: { proAffiliation: string; proOtherText?: string }) => void;
}

const PRO_OPTIONS = [
  { value: '', label: 'Select PRO...' },
  { value: 'ASCAP', label: 'ASCAP' },
  { value: 'BMI', label: 'BMI' },
  { value: 'SESAC', label: 'SESAC' },
  { value: 'NONE', label: 'NONE (Independent)' },
  { value: 'OTHER', label: 'Other' },
];

export default function ProDropdown({ proAffiliation, proOtherText, onChange }: ProDropdownProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs text-white/50">PRO Affiliation</label>
      <select
        value={proAffiliation}
        onChange={(e) => {
          const val = e.target.value;
          onChange({ proAffiliation: val, proOtherText: val === 'OTHER' ? proOtherText : '' });
        }}
        className={cn(
          'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm',
          'focus:outline-none focus:border-violet-500/50'
        )}
      >
        {PRO_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-gray-900">
            {opt.label}
          </option>
        ))}
      </select>
      {proAffiliation === 'OTHER' && (
        <input
          type="text"
          value={proOtherText}
          onChange={(e) => onChange({ proAffiliation: 'OTHER', proOtherText: e.target.value })}
          placeholder="Enter PRO name"
          className={cn(
            'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm',
            'placeholder:text-white/20 focus:outline-none focus:border-violet-500/50'
          )}
        />
      )}
    </div>
  );
}
