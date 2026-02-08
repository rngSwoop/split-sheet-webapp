'use client';

import { cn } from '@/lib/utils';

interface PercentageSummaryProps {
  writerTotal: number;
}

export default function PercentageSummary({ writerTotal }: PercentageSummaryProps) {
  const isValid = writerTotal === 50;
  const percentage = Math.min((writerTotal / 50) * 100, 100);

  return (
    <div className="space-y-3 p-4 bg-black/10 rounded-lg">
      {/* Writer split */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-white/70">Writer Split</span>
          <span className={cn(
            'text-sm font-medium',
            isValid ? 'text-green-400' : writerTotal > 50 ? 'text-red-400' : 'text-yellow-400'
          )}>
            {writerTotal}% / 50%
          </span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              isValid ? 'bg-green-500' : writerTotal > 50 ? 'bg-red-500' : 'bg-violet-500'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Producer split — deferred */}
      <div className="opacity-40">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-white/50">Producer Split</span>
          <span className="text-sm text-white/40">50% (reserved)</span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full w-full bg-white/10 rounded-full" />
        </div>
      </div>
    </div>
  );
}
