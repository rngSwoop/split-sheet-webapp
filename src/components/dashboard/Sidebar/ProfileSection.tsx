'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileSectionProps {
  isExpanded: boolean;
  isActive?: boolean;
}

export default function ProfileSection({ isExpanded, isActive = false }: ProfileSectionProps) {
  return (
    <div className="py-2 px-2 border-t border-white/8">
        <motion.div
          className={cn(
            "relative group flex items-center px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200",
            "hover:bg-white/8 border border-transparent",
            isActive && "bg-white/12 border-white/20",
            !isActive && "hover:border-white/10"
          )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          // Dispatch event to switch to profile view
          const event = new CustomEvent('switchToProfile');
          window.dispatchEvent(event);
        }}
      >
        {/* Profile Avatar */}
        <motion.div
          className="flex-shrink-0 w-5 h-5 text-white/70 group-hover:text-white"
          whileHover={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.3 }}
        >
          <User className="w-5 h-5" />
        </motion.div>

        {/* Profile Info - animate width instead of opacity */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ 
            width: isExpanded ? "auto" : 0,
            opacity: isExpanded ? 1 : 0
          }}
          transition={{ duration: 0.2 }}
          className="ml-3 flex-1 overflow-hidden min-w-0 flex justify-center"
        >
          <div className="text-center">
            <div className="text-sm font-medium text-white whitespace-nowrap">Profile</div>
            <div className="text-xs text-white/60 whitespace-nowrap">Manage account</div>
          </div>
        </motion.div>

        {/* Settings Icon - animate width instead of opacity */}
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ 
            width: isExpanded ? 16 : 0,
            opacity: isExpanded ? 1 : 0
          }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 overflow-hidden"
        >
          <Settings className="w-4 h-4 text-white/60" />
        </motion.div>
      </motion.div>
    </div>
  );
}