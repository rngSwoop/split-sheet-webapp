// Global Loading Overlay - shared across all pages
'use client';

import { AnimatePresence } from 'framer-motion';
import { useLoading } from '@/contexts/LoadingContext';
import SharedLoadingScreen from '@/components/ui/SharedLoadingScreen';

export default function GlobalLoadingOverlay() {
  const { isLoading, message } = useLoading();

  return (
    <AnimatePresence>
      {isLoading && (
        <div className="fixed inset-0 z-[9999]">
          <SharedLoadingScreen message={message} disableBackground={true} />
        </div>
      )}
    </AnimatePresence>
  );
}